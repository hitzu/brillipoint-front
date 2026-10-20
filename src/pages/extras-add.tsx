import Layout from "@layout/index";
import React, { ReactElement, useState, useEffect } from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Form, Row, Toast, InputGroup, Button } from "react-bootstrap";
import { useFormik } from "formik";
import { GetBrandsResponse, CreateExtraPayload, ExtraStatus } from "../interfaces";
import { getBrands } from "../api/services/brandService";
import * as yup from "yup";
import { translatePackageStatus } from "../Common/translations";
import { createExtra } from "../api/services/extrasService";
import { ExtraProductsFields } from "../features/extras/components/ExtraProductsFields";
import {
  ProductOption,
  toExtraProductsPayload,
} from "../features/extras/utils/extraProducts";

interface ExtraFormValues {
  name: string;
  description: string;
  price: string;
  status: ExtraStatus;
  brandId: number | "";
}

const validationSchema = yup.object().shape({
  name: yup.string().required("El nombre del extra es requerido"),
  description: yup.string(),
  price: yup
    .string()
    .required("El precio es requerido")
    .matches(/^\d+(\.\d{1,2})?$/, "Ingrese un precio válido"),
  status: yup
    .string()
    .oneOf(["active", "inactive"])
    .required("El estado es requerido"),
  brandId: yup
    .number()
    .required("La marca es requerida")
    .min(1, "Seleccione una marca válida"),
});

const ExtrasAdd = () => {
  const [brands, setBrands] = useState<GetBrandsResponse[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "danger">(
    "success"
  );
  const [includes, setIncludes] = useState<readonly ProductOption[]>([]);
  const [replaces, setReplaces] = useState<readonly ProductOption[]>([]);

  const formik = useFormik<ExtraFormValues>({
    initialValues: {
      name: "",
      description: "",
      price: "",
      status: "active",
      brandId: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const payload: CreateExtraPayload = {
        name: values.name,
        description: values.description || null,
        price: parseFloat(values.price),
        status: values.status,
        brandId: values.brandId as number,
        products: toExtraProductsPayload(includes, replaces),
      };
      try {
        await createExtra(payload);
        setToastMessage("Extra creado exitosamente");
        setToastVariant("success");
        setShowToast(true);
        setTimeout(() => {
          formik.resetForm();
          setIncludes([]);
          setReplaces([]);
        }, 500);
      } catch (error: any) {
        console.error("Error creating extra:", error);
        setToastMessage("Error al crear el extra");
        setToastVariant("danger");
        setShowToast(true);
      }
    },
  });

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = (await getBrands()) as GetBrandsResponse[];
        setBrands(response);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  // Products are brand-scoped, so a brand change invalidates the selection.
  useEffect(() => {
    setIncludes([]);
    setReplaces([]);
  }, [formik.values.brandId]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Extras" subTitle="Agregar extra" />

      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
        }}
      >
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={4000}
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === "success" ? "Éxito" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </div>

      <Row>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Descripción del extra</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={formik.handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Marca</Form.Label>
                  <Form.Select
                    name="brandId"
                    value={formik.values.brandId}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "brandId",
                        e.target.value ? parseInt(e.target.value) : ""
                      )
                    }
                    onBlur={formik.handleBlur("brandId")}
                    isInvalid={
                      formik.touched.brandId && !!formik.errors.brandId
                    }
                  >
                    <option>Seleccione una marca</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formik.errors.brandId}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nombre del extra</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre del extra"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur("name")}
                    isInvalid={formik.touched.name && !!formik.errors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formik.errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Descripción del extra (opcional)"
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur("description")}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Precio</Form.Label>
                  <InputGroup className="mb-3">
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Precio"
                      name="price"
                      value={formik.values.price}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      isInvalid={formik.touched.price && !!formik.errors.price}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formik.errors.price}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="status"
                    value={formik.values.status}
                    onChange={(e) =>
                      formik.setFieldValue(
                        "status",
                        e.target.value as ExtraStatus
                      )
                    }
                    onBlur={formik.handleBlur("status")}
                    isInvalid={formik.touched.status && !!formik.errors.status}
                  >
                    {(["active", "inactive"] as ExtraStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {translatePackageStatus(status)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formik.errors.status}
                  </Form.Control.Feedback>
                </Form.Group>

                <ExtraProductsFields
                  brandId={formik.values.brandId || null}
                  includes={includes}
                  replaces={replaces}
                  onIncludesChange={setIncludes}
                  onReplacesChange={setReplaces}
                />

                <Button type="submit" variant="primary" className="btn-page w-100">
                  Crear extra
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

ExtrasAdd.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ExtrasAdd;
