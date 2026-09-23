import { Button, Card, Col, Form, Row } from "react-bootstrap";

export interface ScheduleSectionProps {
  eventDate: string;
  onEventDateChange: (value: string) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  onApplyAllDay: () => void;
  venueName: string;
  onVenueNameChange: (value: string) => void;
  mapsUrl: string;
  onMapsUrlChange: (value: string) => void;
  disabled?: boolean;
}

export function ScheduleSection({
  eventDate,
  onEventDateChange,
  startTime,
  onStartTimeChange,
  endDate,
  onEndDateChange,
  endTime,
  onEndTimeChange,
  onApplyAllDay,
  venueName,
  onVenueNameChange,
  mapsUrl,
  onMapsUrlChange,
  disabled,
}: ScheduleSectionProps) {
  return (
    <Card className="mb-3">
      <Card.Header as="h5">Fecha y horario</Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={4}>
            <Form.Group controlId="contract-event-date">
              <Form.Label>Fecha inicio</Form.Label>
              <Form.Control
                aria-label="Fecha inicio"
                type="date"
                value={eventDate}
                onChange={(event) => onEventDateChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-start-time">
              <Form.Label>Inicio</Form.Label>
              <Form.Control
                aria-label="Inicio"
                type="time"
                value={startTime}
                onChange={(event) => onStartTimeChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-end-date">
              <Form.Label>Fecha fin</Form.Label>
              <Form.Control
                aria-label="Fecha fin"
                type="date"
                min={eventDate || undefined}
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-end-time">
              <Form.Label>Fin</Form.Label>
              <Form.Control
                aria-label="Fin"
                type="time"
                value={endTime}
                onChange={(event) => onEndTimeChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col xs={12}>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={onApplyAllDay}
              disabled={disabled}
            >
              Todo el día (00:00–23:59)
            </Button>
          </Col>
          <Col md={6}>
            <Form.Group controlId="contract-venue">
              <Form.Label>Lugar (opcional)</Form.Label>
              <Form.Control
                aria-label="Lugar"
                value={venueName}
                onChange={(event) => onVenueNameChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="contract-maps-url">
              <Form.Label>URL de Google Maps (opcional)</Form.Label>
              <Form.Control
                aria-label="URL de Google Maps"
                type="url"
                placeholder="https://maps.google.com/..."
                value={mapsUrl}
                onChange={(event) => onMapsUrlChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
