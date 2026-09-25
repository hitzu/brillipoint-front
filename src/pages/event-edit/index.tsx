import Layout from "@layout/index";
import { useRouter } from "next/router";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Form, Row } from "react-bootstrap";
import { EventV2, GetEventTypesResponse } from "../../interfaces";
import { getEvents } from "../../api/services/eventsService";
import { getEventTypes } from "../../api/services/eventTypesService";

const EventEditIndex = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [allEvents, setAllEvents] = useState<EventV2[]>([]);
  const [eventTypes, setEventTypes] = useState<GetEventTypesResponse[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, eventTypesRes] = await Promise.all([
          getEvents(),
          getEventTypes(),
        ]);
        setAllEvents(eventsRes);
        setEventTypes(eventTypesRes);
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

  const handleSelectEvent = (event: EventV2) => {
    router.push(`/event-edit/${event.id}`);
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Eventos" subTitle="Editar evento" />
      <Row>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Buscar evento</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group style={{ position: "relative" }}>
                <Form.Label>Buscar evento por festejados</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Escribí los nombres de los festejados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {searchTerm.trim().length >= 2 && searchResults.length > 0 && (
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
                          {eventTypes.find((et) => et.id === event.eventTypeId)?.name || "Sin tipo"} -{" "}
                          {event.key}
                        </small>
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm.trim().length >= 2 && searchResults.length === 0 && (
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
        </Col>
      </Row>
    </React.Fragment>
  );
};

EventEditIndex.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EventEditIndex;
