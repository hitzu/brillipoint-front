import { useEffect, useMemo, useState } from "react";
import styles from "@assets/css/expo-bebe.module.css";
import { useRouter } from "next/router";
import type { BookingBlockId } from "@shared/scheduling/bookingBlocks";
import { CalendarView } from "../components/CalendarView";
import { ContractView } from "../components/ContractView";
import { ServiceDetail } from "../components/ServiceDetail";
import { Tabs } from "../components/Tabs";
import { EXTRAS, SERVICES } from "../data/serviceCatalog";
import { getExpoBebeCarousel } from "../services/carousels";
import type {
  CatalogMode,
  ContentTabKey,
  ExpoBebeBrandKey,
  ServiceItem,
  TabKey,
} from "../types";
import { getBrandId, getBrandKeyById, parseExpoBebeBrand } from "../utils/brand";
import { getBrandById } from "../../../api/services/brandService";

export function ExpoBebePage() {
  const router = useRouter();
  const [tab, setTab] = useState<ContentTabKey>("cal");
  const [catalogMode, setCatalogMode] = useState<CatalogMode | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES);
  const [extras, setExtras] = useState<ServiceItem[]>(EXTRAS);

  const [minAmountHoldSlot, setMinAmountHoldSlot] = useState<number | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [slotSeed, setSlotSeed] = useState<string | null>(null);
  const [blockSeed, setBlockSeed] = useState<BookingBlockId | null>(null);

  const brandId = useMemo<number>(() => {
    const raw = router.query.brandId ?? router.query.brand;
    const asNumber = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!isNaN(asNumber) && asNumber > 0) return asNumber;
    // fallback: resolve from string key
    return getBrandId(parseExpoBebeBrand(raw));
  }, [router.query.brandId, router.query.brand]);

  const brand = useMemo<ExpoBebeBrandKey>(
    () => getBrandKeyById(brandId),
    [brandId]
  );
  const catalogItems =
    catalogMode === "extras"
      ? extras
      : catalogMode === "servicios"
        ? services
        : [];
  const activeMenu: TabKey =
    catalogMode === "extras" ? "ext" : catalogMode === "servicios" ? "srv" : tab;

  useEffect(() => {
    let cancelled = false;

    const loadCarousel = async (
      section: "services" | "extras",
      fallback: ServiceItem[],
      setter: (items: ServiceItem[]) => void
    ) => {
      try {
        const items = await getExpoBebeCarousel({ brandId, section });
        if (cancelled) return;
        setter(items.length > 0 ? items : fallback);
      } catch {
        if (cancelled) return;
        setter(fallback);
      }
    };

    const loadBrand = async () => {
      try {
        const data = await getBrandById(brandId);
        if (cancelled) return;
        setBrandName(data.name);
        setMinAmountHoldSlot(data.minAmountHoldSlot);
      } catch {
        // keep null — ContractView falls back to its own default
      }
    };

    loadCarousel("services", SERVICES, setServices);
    loadCarousel("extras", EXTRAS, setExtras);
    loadBrand();

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  const openCatalog = (mode: CatalogMode) => {
    setCatalogMode(mode);
    setDetailIndex(0);
  };

  const handleMenuChange = (next: TabKey) => {
    if (next === "srv") {
      openCatalog("servicios");
      return;
    }

    if (next === "ext") {
      openCatalog("extras");
      return;
    }

    setCatalogMode(null);
    setTab(next);
  };

  const goToDetail = (nextIndex: number) => {
    if (!catalogItems.length) return;
    setDetailIndex(
      ((nextIndex % catalogItems.length) + catalogItems.length) %
        catalogItems.length
    );
  };

  const handlePickDate = (date: string) => {
    setSlotSeed(date);
    setBlockSeed(null);
    setCatalogMode(null);
    setTab("ctr");
  };

  const handleReserve = ({
    date,
    blockId,
  }: {
    date: string;
    blockId: BookingBlockId;
  }) => {
    setSlotSeed(date);
    setBlockSeed(blockId);
    setCatalogMode(null);
    setTab("ctr");
  };

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <div className={styles.content}>
          <Tabs value={activeMenu} onChange={handleMenuChange} />

          {tab === "cal" && (
            <CalendarView
              brandName={brandName}
              onPickDate={handlePickDate}
              onReserve={handleReserve}
            />
          )}
          {tab === "ctr" && (
            <ContractView
              brand={brand}
              brandId={brandId}
              brandName={brandName}
              minAmountHoldSlot={minAmountHoldSlot}
              initialFecha={slotSeed ?? undefined}
              initialPeriod={blockSeed ?? undefined}
            />
          )}

          {tab !== "ctr" && (
            <footer className={styles.footer}>
              <span className={styles.footerStar}>✦</span> Traslado con costo
              adicional fuera de Puebla, Cholula o Cuautlancingo.
              <br />
              Precios válidos durante expo. Apartado con 30% de anticipo.
            </footer>
          )}
        </div>
      </div>

      <ServiceDetail
        isOpen={!!catalogMode}
        items={catalogItems}
        currentIndex={detailIndex}
        modeLabel={catalogMode === "extras" ? "Extras" : "Servicios"}
        onClose={() => setCatalogMode(null)}
        onSelectIndex={setDetailIndex}
        onPrevious={() => goToDetail(detailIndex - 1)}
        onNext={() => goToDetail(detailIndex + 1)}
      />
    </div>
  );
}
