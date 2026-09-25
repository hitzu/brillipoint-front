import Layout from "@layout/index";
import { useRouter } from "next/router";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Form, Row, Toast, Button } from "react-bootstrap";
import { useFormik } from "formik";
import { EventV2, EventThemes, GetEventTypesResponse } from "../../interfaces";
import {
  getEventById,
  getEvents,
  updateEventById,
} from "../../api/services/eventsService";
import { getContractById } from "../../api/services/contractService";
import { getEventTypes } from "../../api/services/eventTypesService";
import { getEventThemes } from "../../api/services/eventThemesService";
import { buildUpdateEventPayload } from "../../features/events/utils/eventPayload";
import * as yup from "yup";

interface EventFormValues {
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

const EventEdit = () => {
  const router = useRouter();
  const { id } = router.query;

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "danger">(
    "success"
  );
  const [eventTypes, setEventTypes] = useState<GetEventTypesResponse[]>([]);
  const [eventThemes, setEventThemes] = useState<EventThemes[]>([]);

  const [contractLabel, setContractLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allEvents, setAllEvents] = useState<EventV2[]>([]);

  const formik = useFormik<EventFormValues>({
    initialValues: {
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
        await updateEventById(Number(id), buildUpdateEventPayload(values));
        setToastMessage("Evento actualizado exitosamente");
        setToastVariant("success");
        setShowToast(true);
      } catch (error: any) {
        console.error("Error updating event:", error);
        const msg =
          error?.response?.data?.message || "Error al actualizar el evento";
        setToastMessage(msg);
        setToastVariant("danger");
        setShowToast(true);
      }
    },
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      const fetchEvent = async () => {
        try {
          const event = await getEventById(Number(id));
          formik.setValues({
            key: event.key || "",
            eventType: String(event.eventTypeId || ""),
            eventThemeId:
              event.eventThemeId != null ? String(event.eventThemeId) : "",
            honoreesNames: event.honoreesNames || "",
            albumPhrase: event.albumPhrase || "",
            delegateName: event.delegateName || "",
            photoCount:
              event.photoCount != null ? String(event.photoCount) : "2",
          });
          setContractLabel(`#${event.contractId}`);
          getContractById(event.contractId)
            .then(({ contract }) =>
              setContractLabel(`#${contract.sku} - ${contract.clientName}`),
            )
            .catch((error) => console.error("Error fetching contract:", error));
        } catch (error) {
          console.error("Error fetching event:", error);
          setToastMessage("Error al cargar el evento");
          setToastVariant("danger");
          setShowToast(true);
        }
      };
      fetchEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, eventTypesRes, eventThemesRes] = await Promise.all([
          getEvents(),
          getEventTypes(),
          getEventThemes(),
        ]);
        setAllEvents(eventsRes);
        setEventTypes(eventTypesRes);
        setEventThemes(eventThemesRes);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) return [];
    return allEvents
      .filter((e) => e.honoreesNames?.toLowerCase().includes(term))
      .slice(0, 50);
  }, [allEvents, searchTerm]);

  const showSearchResults = searchTerm.trim().length >= 2;

  const handleSelectEvent = (event: EventV2) => {
    setSearchTerm("");
    router.push(`/event-edit/${event.id}`);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Eventos" subTitle="Editar evento" />

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
          <Card className="mb-3">
            <Card.Header>
              <h5>Buscar evento</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>Buscar evento por festejados</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Escribí los nombres de los festejados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {showSearchResults && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      zIndex: 1000,
                      backgroundColor: "white",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      width: "100%",
                      marginTop: "4px",
                    }}
                  >
                    {searchResults.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f5f5f5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "white";
                        }}
                      >
                        <strong>{event.honoreesNames}</strong>
                        <br />
                        <small className="text-muted">
                          {eventTypes.find((et) => et.id === event.eventTypeId)
                            ?.name || "Sin tipo"}{" "}
                          - {event.key}
                        </small>
                      </div>
                    ))}
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      zIndex: 1000,
                      backgroundColor: "white",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "12px",
                      marginTop: "4px",
                      width: "100%",
                    }}
                  >
                    <small className="text-muted">
                      No se encontraron eventos con esos festejados
                    </small>
                  </div>
                )}
              </Form.Group>
            </Card.Body>
          </Card>

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
                      <Form.Control type="text" value={contractLabel} disabled />
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
                  Actualizar evento
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

EventEdit.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EventEdit;
