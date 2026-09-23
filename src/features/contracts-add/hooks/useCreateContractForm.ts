import { useEffect, useRef, useState } from "react";
import type {
  Contract,
  Extra,
  GenerateContractPayload,
  Note,
  Payment,
  PaymentMethod,
} from "../../../interfaces";
import type { GetBrandsResponse } from "../../../interfaces/brands";
import type { GetPackagesResponse } from "../../../interfaces/packages";
import type { UserInfo } from "../../../interfaces/user";
import { getBrands } from "../../../api/services/brandService";
import { getPackages } from "../../../api/services/packageService";
import { getExtras } from "../../../api/services/extrasService";
import { getUsers } from "../../../api/services/usersService";
import { generateContract } from "../../../api/services/contractService";
import { createPayment } from "../../../api/services/paymentService";
import { createNote } from "../../../api/services/notesService";
import { createBooking } from "../../booking-agenda/services/bookingDetailsService";
import { bookingConflictMessage } from "@shared/scheduling/bookingConflict";
import { clampQuantity } from "../../expo-bebe/utils/quantity";
import { formatSkuDate, normalizeSkuText } from "../../expo-bebe/utils/sku";
import { sanitizePhoneInput } from "../../expo-bebe/utils/contactValidation";
import { buildExactBookingPayload } from "../utils/booking";
import {
  validateCreateContractForm,
  type CartItem,
  type ExtraCartItem,
} from "../utils/validation";

export function useCreateContractForm() {
  // API data
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [brands, setBrands] = useState<GetBrandsResponse[]>([]);
  const [packages, setPackages] = useState<GetPackagesResponse[]>([]);
  const [extrasCatalog, setExtrasCatalog] = useState<Extra[]>([]);

  // Form fields
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setRawClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [extraCart, setExtraCart] = useState<ExtraCartItem[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  // Tracks the previous eventDate so the end-date-follows-start effect can
  // tell "the user never touched endDate" (it still equals the old start
  // date) apart from "the user picked their own endDate".
  const previousEventDateRef = useRef("");
  const [depositAmount, setDepositAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [publicNote, setPublicNote] = useState("");
  const [venueName, setVenueName] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");

  // Submission
  const [contract, setContract] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingWarning, setBookingWarning] = useState<string | null>(null);

  // Load vendors
  useEffect(() => {
    getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  // Load brands
  useEffect(() => {
    getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]));
  }, []);

  // Packages are scoped to the selected brand: cross-selling another
  // product line happens by creating an extra under the current brand
  // instead of mixing packages across brands. Never filtered by
  // availability.
  useEffect(() => {
    if (!selectedBrandId) {
      setPackages([]);
      return;
    }
    getPackages({ brandId: Number(selectedBrandId) })
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setPackages([]));
  }, [selectedBrandId]);

  // A brand change invalidates any cart line from the previous brand — all
  // loaded packages already belong to the newly selected brand, so anything
  // left over in the cart necessarily doesn't.
  useEffect(() => {
    setCart((prev) =>
      prev.filter((item) => item.pkg.brandId === Number(selectedBrandId)),
    );
  }, [selectedBrandId]);

  // Extras are scoped to the selected brand too: the backend rejects an
  // extra without the contract's brandId, or from a different brand, so the
  // UI must never offer one that isn't the current brand's.
  useEffect(() => {
    if (!selectedBrandId) {
      setExtrasCatalog([]);
      return;
    }
    getExtras({ brandId: Number(selectedBrandId) })
      .then((data) =>
        setExtrasCatalog(
          Array.isArray(data)
            ? data.filter((extra) => extra.status === "active")
            : [],
        ),
      )
      .catch(() => setExtrasCatalog([]));
  }, [selectedBrandId]);

  // Same reasoning as the cart-clearing effect above, for extras.
  useEffect(() => {
    setExtraCart((prev) =>
      prev.filter((item) => item.extra.brandId === Number(selectedBrandId)),
    );
  }, [selectedBrandId]);

  // endDate follows eventDate until the user picks a different one. It
  // detects "still following" by comparing against the *previous* eventDate
  // rather than a separate boolean: if endDate equalled the old start date,
  // it was tracking it and keeps tracking the new one. A custom endDate that
  // would now precede the (possibly later) start date is clamped back to it
  // — an event can't end before it starts.
  useEffect(() => {
    setEndDate((currentEndDate) => {
      if (!currentEndDate) return eventDate;
      if (currentEndDate === previousEventDateRef.current) return eventDate;
      if (currentEndDate < eventDate) return eventDate;
      return currentEndDate;
    });
    previousEventDateRef.current = eventDate;
  }, [eventDate]);

  const depositNum = Math.max(
    0,
    Number((depositAmount || "0").replace(/[^\d.]/g, "")) || 0,
  );
  const packagesSubtotal = cart.reduce(
    (sum, item) => sum + item.pkg.basePrice * item.quantity,
    0,
  );
  const extrasSubtotal = extraCart.reduce(
    (sum, item) => sum + item.extra.price * item.quantity,
    0,
  );
  const subtotal = packagesSubtotal + extrasSubtotal;
  const balance = subtotal - depositNum;

  // SSR-safe: `window` doesn't exist during server rendering, and there's
  // nothing to link to before a contract has a token anyway.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const contractLink = contract?.token
    ? `${origin}/reserva/${contract.token}?brandId=${Number(selectedBrandId)}`
    : "";

  const addPackageToCart = (packageId: number) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.pkg.id === pkg.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: clampQuantity(copy[idx].quantity + 1),
        };
        return copy;
      }
      return [...prev, { pkg, quantity: 1, clientRef: `pkg-${pkg.id}` }];
    });
  };

  const removePackageFromCart = (packageId: number) =>
    setCart((prev) => prev.filter((it) => it.pkg.id !== packageId));

  const setCartItemQuantity = (packageId: number, quantity: number) =>
    setCart((prev) =>
      prev.map((it) =>
        it.pkg.id === packageId
          ? { ...it, quantity: clampQuantity(quantity) }
          : it,
      ),
    );

  const addExtraToCart = (
    extraId: number,
    packageClientRef: string | null = null,
  ) => {
    const extra = extrasCatalog.find((e) => e.id === extraId);
    if (!extra) return;
    setExtraCart((prev) => {
      const idx = prev.findIndex((it) => it.extra.id === extra.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: clampQuantity(copy[idx].quantity + 1),
        };
        return copy;
      }
      return [...prev, { extra, quantity: 1, packageClientRef }];
    });
  };

  const removeExtraFromCart = (extraId: number) =>
    setExtraCart((prev) => prev.filter((it) => it.extra.id !== extraId));

  const setExtraCartItemQuantity = (extraId: number, quantity: number) =>
    setExtraCart((prev) =>
      prev.map((it) =>
        it.extra.id === extraId
          ? { ...it, quantity: clampQuantity(quantity) }
          : it,
      ),
    );

  const applyAllDay = () => {
    setStartTime("00:00");
    setEndTime("23:59");
    setEndDate(eventDate);
  };

  const resetForm = () => {
    setContract(null);
    setBookingWarning(null);
    setErrorMsg(null);
    setSelectedUserId("");
    setSelectedBrandId("");
    setClientName("");
    setRawClientPhone("");
    setClientEmail("");
    setCart([]);
    setExtraCart([]);
    setEventDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    previousEventDateRef.current = "";
    setDepositAmount("0");
    setPaymentMethod("cash");
    setPublicNote("");
    setVenueName("");
    setMapsUrl("");
  };

  const setClientPhone = (value: string) =>
    setRawClientPhone(sanitizePhoneInput(value));

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setErrorMsg(null);

    const validationError = validateCreateContractForm({
      selectedUserId,
      selectedBrandId,
      clientName,
      clientPhone,
      clientEmail,
      cart,
      eventDate,
      startTime,
      endDate,
      endTime,
      mapsUrl,
      depositNum,
      subtotal,
    });
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedName = clientName.trim();
      const sanitizedPhone = sanitizePhoneInput(clientPhone);
      const trimmedEmail = clientEmail.trim();

      const sku = `${normalizeSkuText(cart[0].pkg.name).toLowerCase()}${formatSkuDate(eventDate)}${normalizeSkuText(trimmedName)}`;

      const payload: GenerateContractPayload = {
        userId: Number(selectedUserId),
        brandId: Number(selectedBrandId),
        sku,
        clientName: trimmedName,
        clientPhone: sanitizedPhone || null,
        clientEmail: trimmedEmail || null,
        packages: cart.map((item) => ({
          packageId: item.pkg.id,
          quantity: item.quantity,
          clientRef: item.clientRef,
        })),
        extras: extraCart.map((item) => ({
          extraId: item.extra.id,
          quantity: item.quantity,
          packageClientRef: item.packageClientRef ?? undefined,
        })),
      };

      const newContract = await generateContract(payload);

      const promises: Promise<Payment | Note>[] = [
        createPayment({
          contractId: newContract.id,
          amount: depositNum,
          method: paymentMethod,
          note: "Depósito inicial",
          receivedAt: new Date().toISOString(),
        }),
      ];
      const trimmedNote = publicNote.trim();
      if (trimmedNote) {
        promises.push(
          createNote({
            targetId: newContract.id,
            content: trimmedNote,
            scope: "contract",
            kind: "public",
          }),
        );
      }
      await Promise.all(promises);

      // A booking failure is non-fatal: the contract and its deposit already
      // exist by this point, so reporting it as a contract error would push
      // the seller to sell the same thing twice. Kept out of the outer catch
      // on purpose.
      try {
        await createBooking(
          buildExactBookingPayload({
            eventDate,
            startTime,
            endDate,
            endTime,
            contractId: newContract.id,
            title: trimmedName,
            venueName: venueName.trim() || undefined,
            mapsUrl: mapsUrl.trim() || undefined,
          }),
        );
        setBookingWarning(null);
      } catch (bookingError) {
        console.error("Error creating the contract booking:", bookingError);
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
    } catch (e) {
      console.error("Error creating contract:", e);
      setErrorMsg("Ocurrió un error al generar el contrato. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // data
    users,
    brands,
    packages,
    extrasCatalog,
    // form state
    selectedUserId,
    setSelectedUserId,
    selectedBrandId,
    setSelectedBrandId,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    clientEmail,
    setClientEmail,
    cart,
    addPackageToCart,
    removePackageFromCart,
    setCartItemQuantity,
    extraCart,
    addExtraToCart,
    removeExtraFromCart,
    setExtraCartItemQuantity,
    eventDate,
    setEventDate,
    startTime,
    setStartTime,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
    applyAllDay,
    depositAmount,
    setDepositAmount,
    paymentMethod,
    setPaymentMethod,
    publicNote,
    setPublicNote,
    venueName,
    setVenueName,
    mapsUrl,
    setMapsUrl,
    // derived
    subtotal,
    balance,
    contractLink,
    // submission
    contract,
    isSubmitting,
    errorMsg,
    bookingWarning,
    handleSubmit,
    resetForm,
  };
}

export type CreateContractFormVM = ReturnType<typeof useCreateContractForm>;
