import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import Select, { MultiValue } from "react-select";
import { multiSelectStyles } from "@common/reactSelectStyles";
import { getProducts } from "../../../api/services/productsService";
import type { ProductOption } from "../utils/extraProducts";

export interface ExtraProductsFieldsProps {
  brandId: number | null;
  includes: readonly ProductOption[];
  replaces: readonly ProductOption[];
  onIncludesChange: (options: MultiValue<ProductOption>) => void;
  onReplacesChange: (options: MultiValue<ProductOption>) => void;
}

/**
 * Products an extra delivers ("Incluye") and products it takes out of the
 * package it is linked to ("Reemplaza a").
 */
export function ExtraProductsFields({
  brandId,
  includes,
  replaces,
  onIncludesChange,
  onReplacesChange,
}: ExtraProductsFieldsProps) {
  const [options, setOptions] = useState<ProductOption[]>([]);

  useEffect(() => {
    if (!brandId) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    getProducts({ brandId })
      .then((products) => {
        if (cancelled) return;
        setOptions(
          products.map((product) => ({
            value: product.id,
            label: product.name,
          }))
        );
      })
      .catch((error) => console.error("Error fetching products:", error));
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  return (
    <>
      <Form.Group className="mb-3" controlId="extra-includes">
        <Form.Label>Incluye</Form.Label>
        <Select
          inputId="extra-includes"
          isMulti
          options={options}
          value={includes}
          onChange={onIncludesChange}
          isDisabled={!brandId}
          placeholder="Productos que entrega este extra"
          styles={multiSelectStyles}
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="extra-replaces">
        <Form.Label>Reemplaza a</Form.Label>
        <Select
          inputId="extra-replaces"
          isMulti
          options={options}
          value={replaces}
          onChange={onReplacesChange}
          isDisabled={!brandId}
          placeholder="Productos del paquete que deja de entregar"
          styles={multiSelectStyles}
        />
        <Form.Text muted>
          Se quitan del paquete al que se vincule el extra en el contrato.
        </Form.Text>
      </Form.Group>
    </>
  );
}
