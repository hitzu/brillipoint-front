import { useEffect, useMemo, useRef, useState } from "react";
import {
  Contract,
  Extra,
  GenerateContractPayload,
  GetBrandsResponse,
  GetPackagesResponse,
  Note,
  Payment,
  PaymentMethod,
  Promotion,
  UserInfo,
} from "../../../../../interfaces";
import { getBrands } from "../../../../../api/services/brandService";
import { getPackages } from "../../../../../api/services/packageService";
import { getExtras } from "../../../../../api/services/extrasService";
import { getUsers } from "../../../../../api/services/usersService";
import { generateContract } from "../../../../../api/services/contractService";
import { createBooking } from "../../../../booking-agenda/services/bookingDetailsService";
import { bookingPayloadForBlock } from "../../../../booking-agenda/utils/blockBooking";
import {
  blockAvailability as blockAvailabilityFor,
  type BlockAvailability,
} from "../../../../booking-agenda/utils/blockAvailability";
import type { AgendaEntry, YMD } from "../../../../booking-agenda/types";
import { getPublicBookingCalendar } from "../../../services/publicBookingCalendar";
import { createPayment } from "../../../../../api/services/paymentService";
import { createNote } from "../../../../../api/services/notesService";
import { getPromotionsByBrandId } from "../../../../../api/services/promotionsService";
import { bookingConflictMessage } from "@shared/scheduling/bookingConflict";
import type { ExtraLineItem, PackageLineItem } from "../../../types";
import type { ExpoBebeBrandKey } from "../../../types";
import type { ContractPeriod } from "../../../utils/calendar";
import { formatSkuDate, normalizeSkuText } from "../../../utils/sku";
import { clampQuantity } from "../../../utils/quantity";
import {
  isValidEmailFormat,
  isValidPhoneLength,
  sanitizePhoneInput,
} from "../../../utils/contactValidation";

const pad = (n: number) => String(n).padStart(2, "0");
const DEFAULT_MIN_AMOUNT_HOLD_SLOT = 200;

/**
 * Reads the booking calendar for a day and the one after it.
 *
 * The night block runs past midnight, so a conflict can live in the small
 * hours of the following civil day — which, at a month end, is also the next
 * month. Both the calendar-refresh effect and the pre-submit availability
 * check below share this exact fetch so they cannot drift apart.
 */
const fetchCalendarEntriesForDate = (
  date: YMD,
): Promise<Record<YMD, AgendaEntry[]>> => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const wanted = new Map<string, [number, number]>();
  for (const day of [date, next.toISOString().slice(0, 10)]) {
    wanted.set(day.slice(0, 7), [
      Number(day.slice(0, 4)),
      Number(day.slice(5, 7)),
    ]);
  }

  return Promise.all(
    Array.from(wanted.values()).map(([year, month]) =>
      getPublicBookingCalendar(year, month),
    ),
  ).then((months) =>
    months.reduce<Record<YMD, AgendaEntry[]>>(
      (all, entries) => ({ ...all, ...entries }),
      {},
    ),
  );
};

interface UseContractFormOptions {
  brandKey?: ExpoBebeBrandKey;
  lockedBrandId?: number | null;
  lockedBrandName?: string;
  minAmountHoldSlot?: number | null;
  initialFecha?: string;
  initialPeriod?: ContractPeriod;
}

export function useContractForm({
  brandKey,
  lockedBrandId,
  lockedBrandName,
  minAmountHoldSlot,
  initialFecha,
  initialPeriod,
}: UseContractFormOptions = {}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const seededPeriodRef = useRef<ContractPeriod | null>(
    initialFecha && initialPeriod ? initialPeriod : null,
  );

  // API data
  const [brands, setBrands] = useState<GetBrandsResponse[]>([]);
  const [packages, setPackages] = useState<GetPackagesResponse[]>([]);
  const [extrasCatalog, setExtrasCatalog] = useState<Extra[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(
    null,
  );
  const [calendarEntries, setCalendarEntries] = useState<
    Record<YMD, AgendaEntry[]>
  >({});
  const [bookingWarning, setBookingWarning] = useState<string | null>(null);

  // Form fields
  const [fecha, setFecha] = useState(initialFecha ?? todayStr);
  const [period, setPeriod] = useState<ContractPeriod | null>(
    initialPeriod ?? null,
  );
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | "">("");
  const [selectedPackageId, setSelectedPackageId] = useState<number | "">("");
  const [items, setItems] = useState<PackageLineItem[]>([]);
  const [selectedExtraId, setSelectedExtraId] = useState<number | "">("");
  const [selectedExtraPackageClientRef, setSelectedExtraPackageClientRef] =
    useState<string>("");
  const [extraItems, setExtraItems] = useState<ExtraLineItem[]>([]);
  const [anticipo, setAnticipo] = useState("500");
  const [formaPago, setFormaPago] = useState<PaymentMethod>("cash");
  const [notas, setNotas] = useState("");

  // Submission
  const [contract, setContract] = useState<Contract | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const isLocked = !!contract;
  const isBrandSelectionLocked = !!lockedBrandId;
  const requiredMinAmountHoldSlot =
    minAmountHoldSlot ?? DEFAULT_MIN_AMOUNT_HOLD_SLOT;

  // Sync anticipo with minAmountHoldSlot once it resolves from the API
  useEffect(() => {
    setAnticipo(String(requiredMinAmountHoldSlot));
  }, [requiredMinAmountHoldSlot]);

  // Load brands
  useEffect(() => {
    getBrands()
      .then((data) => {
        const arr = Array.isArray(data) ? (data as GetBrandsResponse[]) : [];
        setBrands(arr);
        if (arr.length === 0) return;

        if (lockedBrandId) {
          setSelectedBrandId(lockedBrandId);
          return;
        }

        const matchedBrand = brandKey
          ? arr.find((brand) => brand.key?.toLowerCase() === brandKey)
          : null;

        setSelectedBrandId(matchedBrand?.id ?? arr[0].id);
      })
      .catch(() => setBrands([]));
  }, [brandKey, lockedBrandId]);

  // Load users (vendors)
  useEffect(() => {
    getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  // Load packages when brand changes
  useEffect(() => {
    if (!selectedBrandId) {
      setPackages([]);
      setSelectedPackageId("");
      return;
    }
    setSelectedPackageId("");
    getPackages({ brandId: Number(selectedBrandId) })
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setPackages([]));
  }, [selectedBrandId]);

  // Load extras catalog when brand changes
  useEffect(() => {
    if (!selectedBrandId) {
      setExtrasCatalog([]);
      setSelectedExtraId("");
      return;
    }
    setSelectedExtraId("");
    getExtras({ brandId: Number(selectedBrandId) })
      .then((data) => setExtrasCatalog(Array.isArray(data) ? data : []))
      .catch(() => setExtrasCatalog([]));
  }, [selectedBrandId]);

  // Load the active promotion when brand changes
  useEffect(() => {
    if (!selectedBrandId) {
      setActivePromotion(null);
      return;
    }
    getPromotionsByBrandId({
      brandId: Number(selectedBrandId),
      status: "active",
    })
      .then((data) => setActivePromotion(Array.isArray(data) ? data[0] ?? null : null))
      .catch(() => setActivePromotion(null));
  }, [selectedBrandId]);

  // Load slots for selected date
  useEffect(() => {
    if (!fecha) return;
    setPeriod((currentPeriod) => {
      if (seededPeriodRef.current && fecha === initialFecha) {
        const seededPeriod = seededPeriodRef.current;
        seededPeriodRef.current = null;
        return seededPeriod;
      }

      return currentPeriod === null ? currentPeriod : null;
    });

  }, [fecha, initialFecha]);

  // The night block runs past midnight, so the day after the selected one has
  // to be loaded too — which at a month end means the next month as well.
  useEffect(() => {
    if (!fecha) return;
    let cancelled = false;
    fetchCalendarEntriesForDate(fecha)
      .then((entries) => {
        if (!cancelled) setCalendarEntries(entries);
      })
      // Never block a sale on a failed read. The seller has a client in front
      // of them, and a false "no disponible" costs more than a rare double
      // booking, which the agenda surfaces anyway.
      .catch(() => {
        if (!cancelled) setCalendarEntries({});
      });

    return () => {
      cancelled = true;
    };
  }, [fecha]);

  // Auto-select the target package for extras when there's exactly one in the cart.
  useEffect(() => {
    if (items.length === 1) {
      setSelectedExtraPackageClientRef(items[0].clientRef);
      return;
    }
    if (items.length === 0) {
      setSelectedExtraPackageClientRef("");
      return;
    }
    setSelectedExtraPackageClientRef((current) =>
      items.some((it) => it.clientRef === current) ? current : "",
    );
  }, [items]);

  const blockAvailability: BlockAvailability = useMemo(
    () => blockAvailabilityFor(fecha, calendarEntries),
    [fecha, calendarEntries],
  );

  // Tier discount % (display-only hint) for the Nth extra (0-indexed) added to a given package row.
  const getTierDiscount = (
    packageClientRef: string | null,
    positionIndex: number,
  ): number => {
    if (!packageClientRef || !activePromotion) return 0;
    const pkgLine = items.find((it) => it.clientRef === packageClientRef);
    if (!pkgLine) return 0;
    const promoPackage = activePromotion.packages?.find(
      (p) => p.packageId === pkgLine.pkg.id,
    );
    return promoPackage?.tiers[positionIndex]?.discountPercentage ?? 0;
  };

  const extrasSubtotal = useMemo(
    () => extraItems.reduce((s, it) => s + it.extra.price * it.quantity, 0),
    [extraItems],
  );
  const extrasDiscountTotal = useMemo(() => {
    const seenByPackage: Record<string, number> = {};
    return extraItems.reduce((s, it) => {
      const key = it.packageClientRef ?? "";
      const positionIndex = seenByPackage[key] ?? 0;
      seenByPackage[key] = positionIndex + 1;
      const discountPercentage = getTierDiscount(
        it.packageClientRef,
        positionIndex,
      );
      return s + (it.extra.price * it.quantity * discountPercentage) / 100;
    }, 0);
  }, [extraItems, activePromotion, items]);
  const subtotal = useMemo(
    () =>
      items.reduce((s, it) => s + it.pkg.basePrice * it.quantity, 0) +
      extrasSubtotal,
    [items, extrasSubtotal],
  );
  const selectedBrandName = useMemo(
    () =>
      lockedBrandName ||
      brands.find((brand) => brand.id === selectedBrandId)?.name ||
      "",
    [brands, lockedBrandName, selectedBrandId]
  );
  const packagesDiscountTotal = useMemo(
    () =>
      items.reduce((s, it) => {
        if (!activePromotion || activePromotion.brandId !== it.pkg.brandId) {
          return s;
        }
        return (
          s +
          (it.pkg.basePrice * it.quantity * activePromotion.value) / 100
        );
      }, 0),
    [items, activePromotion],
  );
  const discountTotal = packagesDiscountTotal + extrasDiscountTotal;
  const anticipoNum = Math.max(
    0,
    Number((anticipo || "0").replace(/[^\d.]/g, "")) || 0,
  );
  const fmtPrice = (n: number) => n.toLocaleString("es-MX");

  const handleAgregar = () => {
    if (isLocked || !selectedPackageId) return;
    const pkg = packages.find((p) => p.id === Number(selectedPackageId));
    if (!pkg) return;
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.pkg.id === pkg.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { pkg, quantity: 1, clientRef: `pkg-${pkg.id}` }];
    });
    setSelectedPackageId("");
  };

  const handleAgregarExtra = () => {
    if (isLocked || !selectedExtraId) return;
    const extra = extrasCatalog.find((e) => e.id === Number(selectedExtraId));
    if (!extra) return;
    const packageClientRef = selectedExtraPackageClientRef || null;
    setExtraItems((prev) => {
      const idx = prev.findIndex((x) => x.extra.id === extra.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { extra, quantity: 1, packageClientRef }];
    });
    setSelectedExtraId("");
  };

  const setExtraItemQuantity = (id: number, quantity: number) =>
    setExtraItems((prev) =>
      prev.map((it) =>
        it.extra.id === id ? { ...it, quantity: clampQuantity(quantity) } : it,
      ),
    );
  const removeExtraItem = (id: number) =>
    setExtraItems((prev) => prev.filter((it) => it.extra.id !== id));

  const setItemQuantity = (id: number, quantity: number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.pkg.id === id ? { ...it, quantity: clampQuantity(quantity) } : it,
      ),
    );
  const removeItem = (id: number) =>
    setItems((prev) => prev.filter((it) => it.pkg.id !== id));

  const handleSubmit = async () => {
    if (submitting || isLocked) return;
    setErrorMsg(null);
    const normalizedEmail = email.trim();
    const normalizedPhone = sanitizePhoneInput(telefono);

    if (!period) {
      setErrorMsg("Selecciona un slot horario.");
      return;
    }
    if (!selectedUserId) {
      setErrorMsg("Selecciona un vendedor.");
      return;
    }
    if (!nombre.trim()) {
      setErrorMsg("Ingresa el nombre del cliente.");
      return;
    }
    if (!isValidEmailFormat(normalizedEmail)) {
      setErrorMsg("Ingresa un email válido.");
      return;
    }
    if (!isValidPhoneLength(normalizedPhone)) {
      setErrorMsg("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    if (anticipoNum < requiredMinAmountHoldSlot) {
      setErrorMsg(
        `El anticipo mínimo es de $${fmtPrice(requiredMinAmountHoldSlot)}.`
      );
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Agrega al menos un paquete.");
      return;
    }

    setSubmitting(true);
    try {
      // Availability can go stale between form load and submit. Re-read it
      // right before charging anything, so a block someone else just took
      // refuses the sale instead of silently overbooking it.
      //
      // Never block a sale on a failed read — same principle as the calendar
      // effect above: the seller has a client in front of them, and a false
      // "no disponible" costs more than a rare double booking, which the
      // agenda surfaces anyway. Only a successfully-read, definitely-taken
      // block may refuse.
      let freshCalendarEntries: Record<YMD, AgendaEntry[]> | null = null;
      try {
        freshCalendarEntries = await fetchCalendarEntriesForDate(fecha);
      } catch (precheckError) {
        console.error(
          "Error checking availability before the sale:",
          precheckError,
        );
      }

      if (freshCalendarEntries) {
        const freshAvailability = blockAvailabilityFor(
          fecha,
          freshCalendarEntries,
        );
        if (!freshAvailability[period]) {
          setCalendarEntries(freshCalendarEntries);
          setErrorMsg(
            "Ese bloque se acaba de ocupar. Elige otro horario para continuar.",
          );
          return;
        }
      }

      const sku = `${normalizeSkuText(items[0]?.pkg?.name).toLowerCase()}${formatSkuDate(fecha)}${normalizeSkuText(nombre)}`;

      const payload: GenerateContractPayload = {
        userId: Number(selectedUserId),
        brandId: Number(selectedBrandId),
        sku,
        clientName: nombre.trim(),
        clientPhone: normalizedPhone || null,
        clientEmail: normalizedEmail || null,
        packages: items.map((it) => ({
          packageId: it.pkg.id,
          quantity: it.quantity,
          clientRef: it.clientRef,
        })),
        extras: extraItems.map((it) => ({
          extraId: it.extra.id,
          quantity: it.quantity,
          packageClientRef: it.packageClientRef ?? undefined,
        })),
      };

      const newContract = await generateContract(payload);

      if (newContract) {
        const promises: Promise<Payment | Note>[] = [
          createPayment({
            contractId: newContract.id,
            amount: anticipoNum,
            method: formaPago,
            note: "Depósito inicial",
            receivedAt: new Date().toISOString(),
          }),
        ];
        if (notas.trim()) {
          promises.push(
            createNote({
              targetId: newContract.id,
              content: notas.trim(),
              scope: "contract",
              kind: "public",
            }),
          );
        }
        await Promise.all(promises);

        // The contract is sold by block, so its booking is derived from the
        // chosen block rather than typed. Kept out of the batch above and out
        // of the outer catch on purpose: the contract and its deposit already
        // exist here, so reporting a booking failure as a contract failure
        // would invite the seller to sell the same thing twice.
        try {
          await createBooking(
            bookingPayloadForBlock(fecha, period, {
              contractId: newContract.id,
              purpose: "event",
              title: nombre.trim() || undefined,
            }),
          );
          setBookingWarning(null);
        } catch (bookingError) {
          console.error("Error creating the contract booking:", bookingError);
          // The conflict detail is appended, never substituted: the contract
          // and its deposit already exist here, so a warning that only names
          // the clash reads like the sale failed — and a seller who believes
          // that sells the same thing twice.
          const conflict = bookingConflictMessage(bookingError);
          setBookingWarning(
            [
              "El contrato se generó, pero no se pudo apartar la fecha en la agenda.",
              conflict,
              "Avisa a coordinación.",
            ]
              .filter(Boolean)
              .join(" "),
          );
        }

        setContract(newContract);
      }
    } catch (e) {
      console.error("Error creating contract:", e);
      setErrorMsg("Ocurrió un error al generar el contrato. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setContract(null);
    setBookingWarning(null);
    setFecha(todayStr);
    setPeriod(null);
    setSelectedUserId("");
    setNombre("");
    setEmail("");
    setTelefono("");
    setSelectedPackageId("");
    setItems([]);
    setSelectedExtraId("");
    setSelectedExtraPackageClientRef("");
    setExtraItems([]);
    setAnticipo(String(requiredMinAmountHoldSlot));
    setFormaPago("cash");
    setNotas("");
    setErrorMsg(null);
    setHasCopiedLink(false);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const contractLink = contract?.token
    ? `${origin}/reserva/${contract.token}?brandId=${Number(selectedBrandId)}`
    : "";

  return {
    // data
    brands,
    packages,
    extrasCatalog,
    users,
    // form state
    fecha,
    setFecha,
    period,
    setPeriod,
    selectedUserId,
    setSelectedUserId,
    nombre,
    setNombre,
    email,
    setEmail,
    telefono,
    setTelefono,
    selectedBrandId,
    setSelectedBrandId,
    selectedBrandName,
    isBrandSelectionLocked,
    selectedPackageId,
    setSelectedPackageId,
    items,
    activePromotion,
    selectedExtraId,
    setSelectedExtraId,
    selectedExtraPackageClientRef,
    setSelectedExtraPackageClientRef,
    extraItems,
    getTierDiscount,
    anticipo,
    setAnticipo,
    formaPago,
    setFormaPago,
    notas,
    setNotas,
    // submission
    contract,
    submitting,
    errorMsg,
    bookingWarning,
    hasCopiedLink,
    setHasCopiedLink,
    // derived
    isLocked,
    requiredMinAmountHoldSlot,
    blockAvailability,
    subtotal,
    discountTotal,
    extrasSubtotal,
    anticipoNum,
    fmtPrice,
    contractLink,
    // handlers
    handleAgregar,
    setItemQuantity,
    removeItem,
    handleAgregarExtra,
    setExtraItemQuantity,
    removeExtraItem,
    handleSubmit,
    resetForm,
  };
}

export type ContractFormVM = ReturnType<typeof useContractForm>;
