import React from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { Button, Form, InputGroup } from "react-bootstrap";
import {
  GetBrandsResponse,
  PromotionStatus,
  PromotionType,
} from "../../../interfaces";

export interface PromotionFormValues {
  brandId: number | "";
  name: string;
  type: PromotionType;
  value: string;
  status: PromotionStatus;
  validFrom: string;
  validUntil: string;
}

export const emptyPromotionValues: PromotionFormValues = {
  brandId: "",
  name: "",
  type: "percentage",
  value: "",
  status: "active",
  validFrom: "",
  validUntil: "",
};

const validationSchema = yup.object().shape({
  brandId: yup
    .number()
    .required("La marca es requerida")
    .min(1, "Seleccione una marca válida"),
  name: yup.string().trim().required("El nombre es requerido"),
  type: yup.string().oneOf(["percentage", "fixed"]).required(),
  value: yup
    .string()
    .required("El valor es requerido")
    .matches(/^\d+(\.\d{1,2})?$/, "Ingrese un valor válido")
    .test("max-percentage", "El porcentaje no puede ser mayor a 100", function (v) {
      return this.parent.type !== "percentage" || Number(v) <= 100;
    }),
  validUntil: yup
    .string()
    .test("after-from", "Debe ser posterior a la fecha de inicio", function (v) {
      const { validFrom } = this.parent;
      return !v || !validFrom || v >= validFrom;
    }),
});

interface Props {
  brands: GetBrandsResponse[];
  initialValues?: PromotionFormValues;
  /** Brand cannot change once the promotion exists. */
  brandLocked?: boolean;
  submitLabel: string;
  onSubmit: (values: PromotionFormValues) => Promise<void>;
  onDelete?: () => void;
}

const PromotionForm = ({
  brands,
  initialValues = emptyPromotionValues,
  brandLocked = false,
  submitLabel,
  onSubmit,
  onDelete,
}: Props) => {
  const formik = useFormik<PromotionFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit,
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Marca</Form.Label>
        <Form.Select
          name="brandId"
          value={formik.values.brandId}
          disabled={brandLocked}
          onChange={(e) =>
            formik.setFieldValue("brandId", e.target.value ? parseInt(e.target.value) : "")
          }
          isInvalid={formik.touched.brandId && !!formik.errors.brandId}
        >
          <option value="">Seleccione una marca</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{formik.errors.brandId}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          name="name"
          placeholder="Nombre de la promoción"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          isInvalid={formik.touched.name && !!formik.errors.name}
        />
        <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Tipo de descuento</Form.Label>
        <Form.Select name="type" value={formik.values.type} onChange={formik.handleChange}>
          <option value="percentage">Porcentaje</option>
          <option value="fixed">Monto fijo</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Valor</Form.Label>
        <InputGroup>
          <InputGroup.Text>{formik.values.type === "percentage" ? "%" : "$"}</InputGroup.Text>
          <Form.Control
            type="text"
            name="value"
            placeholder="0"
            value={formik.values.value}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            isInvalid={formik.touched.value && !!formik.errors.value}
          />
          <Form.Control.Feedback type="invalid">{formik.errors.value}</Form.Control.Feedback>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Estado</Form.Label>
        <Form.Select name="status" value={formik.values.status} onChange={formik.handleChange}>
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
        </Form.Select>
        <Form.Text className="text-muted">
          Solo puede haber una promoción activa por marca.
        </Form.Text>
      </Form.Group>

      <div className="row">
        <Form.Group className="mb-3 col-sm-6">
          <Form.Label>Válida desde</Form.Label>
          <Form.Control
            type="date"
            name="validFrom"
            value={formik.values.validFrom}
            onChange={formik.handleChange}
          />
        </Form.Group>
        <Form.Group className="mb-3 col-sm-6">
          <Form.Label>Válida hasta</Form.Label>
          <Form.Control
            type="date"
            name="validUntil"
            value={formik.values.validUntil}
            onChange={formik.handleChange}
            isInvalid={!!formik.errors.validUntil}
          />
          <Form.Control.Feedback type="invalid">{formik.errors.validUntil}</Form.Control.Feedback>
        </Form.Group>
      </div>

      <div className="row g-2">
        <div className={onDelete ? "col-12 col-sm-10" : "col-12"}>
          <Button type="submit" variant="primary" className="btn-page w-100" disabled={formik.isSubmitting}>
            {submitLabel}
          </Button>
        </div>
        {onDelete && (
          <div className="col-12 col-sm-2">
            <Button type="button" variant="danger" className="btn-page w-100" onClick={onDelete}>
              Eliminar
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
};

export default PromotionForm;
