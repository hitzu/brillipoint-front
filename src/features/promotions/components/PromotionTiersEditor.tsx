import React, { useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import {
  GetPackagesResponse,
  PromotionPackageRow,
} from "../../../interfaces";
import { getPackages } from "../../../api/services/packageService";
import { setPromotionPackages } from "../../../api/services/promotionsService";

interface TierDraft {
  order: string;
  discountPercentage: string;
}

interface PackageDraft {
  packageId: number;
  packageName: string;
  tiers: TierDraft[];
}

interface Props {
  promotionId: number;
  brandId: number;
  rows: PromotionPackageRow[];
  onResult: (message: string, variant: "success" | "danger") => void;
}

const groupRows = (rows: PromotionPackageRow[]): PackageDraft[] => {
  const byPackage = new Map<number, PackageDraft>();
  for (const row of rows) {
    if (!byPackage.has(row.packageId)) {
      byPackage.set(row.packageId, {
        packageId: row.packageId,
        packageName: row.package?.name ?? `Paquete ${row.packageId}`,
        tiers: [],
      });
    }
    byPackage.get(row.packageId)!.tiers.push({
      order: String(row.tierOrder),
      discountPercentage: String(row.discountPercentage),
    });
  }
  byPackage.forEach((draft) => draft.tiers.sort((a, b) => Number(a.order) - Number(b.order)));
  return Array.from(byPackage.values());
};

const isValidTier = (tier: TierDraft) => {
  const order = Number(tier.order);
  const discount = Number(tier.discountPercentage);
  return (
    Number.isInteger(order) &&
    order >= 1 &&
    tier.discountPercentage !== "" &&
    discount >= 0 &&
    discount <= 100
  );
};

const PromotionTiersEditor = ({ promotionId, brandId, rows, onResult }: Props) => {
  const [drafts, setDrafts] = useState<PackageDraft[]>([]);
  const [packages, setPackages] = useState<GetPackagesResponse[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDrafts(groupRows(rows));
  }, [rows]);

  useEffect(() => {
    getPackages({ brandId })
      .then(setPackages)
      .catch(() => setPackages([]));
  }, [brandId]);

  const available = packages.filter((p) => !drafts.some((d) => d.packageId === p.id));

  const addPackage = (packageId: number) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    setDrafts((prev) => [
      ...prev,
      { packageId: pkg.id, packageName: pkg.name, tiers: [{ order: "1", discountPercentage: "" }] },
    ]);
  };

  const updateTier = (packageId: number, index: number, patch: Partial<TierDraft>) =>
    setDrafts((prev) =>
      prev.map((d) =>
        d.packageId === packageId
          ? { ...d, tiers: d.tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) }
          : d
      )
    );

  const addTier = (packageId: number) =>
    setDrafts((prev) =>
      prev.map((d) =>
        d.packageId === packageId
          ? {
              ...d,
              tiers: [
                ...d.tiers,
                {
                  order: String(Math.max(0, ...d.tiers.map((t) => Number(t.order) || 0)) + 1),
                  discountPercentage: "",
                },
              ],
            }
          : d
      )
    );

  const removeTier = (packageId: number, index: number) =>
    setDrafts((prev) =>
      prev
        .map((d) =>
          d.packageId === packageId ? { ...d, tiers: d.tiers.filter((_, i) => i !== index) } : d
        )
        .filter((d) => d.tiers.length > 0)
    );

  const removePackage = (packageId: number) =>
    setDrafts((prev) => prev.filter((d) => d.packageId !== packageId));

  const handleSave = async () => {
    const invalid = drafts.some((d) => d.tiers.some((t) => !isValidTier(t)));
    if (invalid) {
      onResult("Cada tier necesita un orden entero (>= 1) y un descuento entre 0 y 100", "danger");
      return;
    }
    const duplicated = drafts.some(
      (d) => new Set(d.tiers.map((t) => Number(t.order))).size !== d.tiers.length
    );
    if (duplicated) {
      onResult("Hay órdenes repetidos dentro de un mismo paquete", "danger");
      return;
    }
    setSaving(true);
    try {
      await setPromotionPackages(promotionId, {
        packages: drafts.map((d) => ({
          packageId: d.packageId,
          tiers: d.tiers.map((t) => ({
            order: Number(t.order),
            discountPercentage: Number(t.discountPercentage),
          })),
        })),
      });
      onResult("Tiers actualizados exitosamente", "success");
    } catch (error) {
      console.error("Error saving promotion tiers:", error);
      onResult("Error al actualizar los tiers", "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {drafts.length === 0 && (
        <p className="text-muted">Esta promoción no tiene paquetes con tiers.</p>
      )}

      {drafts.map((draft) => (
        <div key={draft.packageId} className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>{draft.packageName}</strong>
            <Button variant="link" className="text-danger p-0" onClick={() => removePackage(draft.packageId)}>
              Quitar paquete
            </Button>
          </div>
          {draft.tiers.map((tier, index) => (
            <InputGroup key={index} className="mb-2">
              <InputGroup.Text>Extra #</InputGroup.Text>
              <Form.Control
                type="number"
                min={1}
                step={1}
                value={tier.order}
                onChange={(e) => updateTier(draft.packageId, index, { order: e.target.value })}
              />
              <InputGroup.Text>Descuento %</InputGroup.Text>
              <Form.Control
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={tier.discountPercentage}
                onChange={(e) =>
                  updateTier(draft.packageId, index, { discountPercentage: e.target.value })
                }
              />
              <Button variant="outline-danger" onClick={() => removeTier(draft.packageId, index)}>
                <i className="ti ti-trash"></i>
              </Button>
            </InputGroup>
          ))}
          <Button variant="light" size="sm" onClick={() => addTier(draft.packageId)}>
            + Agregar tier
          </Button>
        </div>
      ))}

      <Form.Group className="mb-3">
        <Form.Label>Agregar paquete</Form.Label>
        <Form.Select
          value=""
          onChange={(e) => e.target.value && addPackage(parseInt(e.target.value))}
        >
          <option value="">Seleccione un paquete</option>
          {available.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Button variant="primary" className="btn-page w-100" onClick={handleSave} disabled={saving}>
        Guardar tiers
      </Button>
    </div>
  );
};

export default PromotionTiersEditor;
