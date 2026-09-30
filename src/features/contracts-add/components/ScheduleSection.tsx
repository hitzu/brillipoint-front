import { Card, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { TimeSelect } from "../../booking-agenda/components/TimeSelect";
import {
  endTimeOptions,
  formatDuration,
  isValidTime,
  nextDayDurationMinutes,
  startTimeOptions,
} from "../../booking-agenda/utils/timeOptions";

export interface ScheduleSectionProps {
  eventDate: string;
  onEventDateChange: (value: string) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  endsNextDay: boolean;
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
  endTime,
  onEndTimeChange,
  endsNextDay,
  venueName,
  onVenueNameChange,
  mapsUrl,
  onMapsUrlChange,
  disabled,
}: ScheduleSectionProps) {
  const nextDayNotice =
    endsNextDay && isValidTime(startTime) && isValidTime(endTime)
      ? `Termina el día siguiente (${formatDuration(
          nextDayDurationMinutes(startTime, endTime),
        )})`
      : null;
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
              <TimeSelect
                ariaLabel="Inicio"
                value={startTime}
                options={startTimeOptions()}
                onChange={onStartTimeChange}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-end-time">
              <Form.Label>
                Fin
                {nextDayNotice ? (
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="contract-end-next-day">
                        {nextDayNotice}
                      </Tooltip>
                    }
                  >
                    <i
                      className="ti ti-alert-triangle text-warning ms-1"
                      role="img"
                      aria-label={nextDayNotice}
                      tabIndex={0}
                    />
                  </OverlayTrigger>
                ) : null}
              </Form.Label>
              <TimeSelect
                ariaLabel="Fin"
                value={endTime}
                options={isValidTime(startTime)
                  ? endTimeOptions(startTime)
                  : startTimeOptions()}
                onChange={onEndTimeChange}
                disabled={disabled}
              />
            </Form.Group>
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
