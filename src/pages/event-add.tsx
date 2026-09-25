import Layout from "@layout/index";
import React, { ReactElement, useEffect, useState } from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Form, Row, Toast, Button } from "react-bootstrap";
import { useFormik } from "formik";
import { Contract, EventThemes, GetEventTypesResponse } from "../interfaces";
import { createEvent } from "../api/services/eventsService";
import { getContracts } from "../api/services/contractService";
import { getEventTypes } from "../api/services/eventTypesService";
import { getEventThemes } from "../api/services/eventThemesService";
import { buildCreateEventPayload } from "../features/events/utils/eventPayload";
import * as yup from "yup";

interface EventFormValues {
  contractId: string;
  key: string;
  eventType: string;
  eventThemeId: string;
  honoreesNames: string;
  albumPhrase: string;
  delegateName: string;
  photoCount: string;
}

const PHOTO_COUNT_OPTIONS = ["1", "2", "3", "4", "5"];

const validationSchema = yup.object().shape({
  contractId: yup.string().required("El contrato es requerido"),
  key: yup.string().required("La clave del evento es requerida"),
  eventType: yup.string().required("El tipo de evento es requerido"),
  eventThemeId: yup.string().optional(),
  honoreesNames: yup
    .string()
    .required("Los nombres de los festejados son requeridos"),
  albumPhrase: yup.string().optional(),
  delegateName: yup.string().optional(),
  photoCount: yup.number().integer().min(1).max(5).optional(),
});

const EventAdd = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "danger">(
    "success"
  );
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [eventTypes, setEventTypes] = useState<GetEventTypesResponse[]>([]);
  const [eventThemes, setEventThemes] = useState<EventThemes[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsRes, eventTypesRes, eventThemesRes] = await Promise.all(
          [
            getContracts({ includeFinalized: false, excludeWithEvents: true }),
            getEventTypes(),
            getEventThemes(),
          ]
        );
        setContracts(contractsRes);
        setEventTypes(eventTypesRes);
        setEventThemes(eventThemesRes);
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };
    fetchData();
  }, []);

  const formik = useFormik<EventFormValues>({
    initialValues: {
      contractId: "",
      key: "",
      eventType: "",
      eventThemeId: "",
      honoreesNames: "",
      albumPhrase: "",
      delegateName: "",
      photoCount: "2",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await createEvent(buildCreateEventPayload(values));
        setToastMessage("Evento creado exitosamente");
        setToastVariant("success");
        setShowToast(true);
        setTimeout(() => {
          formik.resetForm();
        }, 500);
      } catch (error: any) {
        console.error("Error creating event:", error);
        const msg =
          error?.response?.data?.message || "Error al crear el evento";
        setToastMessage(msg);
        setToastVariant("danger");
        setShowToast(true);
      }
    },
  });

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Eventos" subTitle="Agregar evento" />

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
              {toastVariant === "success" ? "Exito" : "Error"}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </div>

      <Row>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Informacion del evento</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={formik.handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Contrato</Form.Label>
                      <Form.Select
                        name="contractId"
                        value={formik.values.contractId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("contractId")}
                        isInvalid={
                          formik.touched.contractId &&
                          !!formik.errors.contractId
                        }
                      >
                        <option value="">Seleccionar contrato...</option>
                        {contracts.map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.sku} - {c.clientName}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.contractId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de evento</Form.Label>
                      <Form.Select
                        name="eventType"
                        value={formik.values.eventType}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("eventType")}
                        isInvalid={
                          formik.touched.eventType && !!formik.errors.eventType
                        }
                      >
                        <option value="">Seleccionar tipo...</option>
                        {eventTypes.map((et) => (
                          <option key={et.id} value={et.id}>
                            {et.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.eventType}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tema del evento</Form.Label>
                      <Form.Select
                        name="eventThemeId"
                        value={formik.values.eventThemeId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("eventThemeId")}
                      >
                        <option value="">Sin tema...</option>
                        {eventThemes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de fotos</Form.Label>
                      <Form.Select
                        name="photoCount"
                        value={formik.values.photoCount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("photoCount")}
                        isInvalid={
                          formik.touched.photoCount &&
                          !!formik.errors.photoCount
                        }
                      >
                        {PHOTO_COUNT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.photoCount}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Clave del evento</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: 20"
                        name="key"
                        value={formik.values.key}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("key")}
                        isInvalid={formik.touched.key && !!formik.errors.key}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.key}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombres de festejados</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Sinai y Eduardo"
                        name="honoreesNames"
                        value={formik.values.honoreesNames}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("honoreesNames")}
                        isInvalid={
                          formik.touched.honoreesNames &&
                          !!formik.errors.honoreesNames
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.honoreesNames}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Frase del album</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Nuestro para siempre comienza hoy"
                        name="albumPhrase"
                        value={formik.values.albumPhrase}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("albumPhrase")}
                        isInvalid={
                          formik.touched.albumPhrase &&
                          !!formik.errors.albumPhrase
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.albumPhrase}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre del contacto/delegado</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Contacto principal del evento"
                        name="delegateName"
                        value={formik.values.delegateName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur("delegateName")}
                        isInvalid={
                          formik.touched.delegateName &&
                          !!formik.errors.delegateName
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {formik.errors.delegateName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  type="submit"
                  variant="primary"
                  className="btn-page w-100 mt-2"
                >
                  Crear evento
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

EventAdd.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EventAdd;
