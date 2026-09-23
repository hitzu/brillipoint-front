import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import type {
  BookingDetail,
  ContractOption,
  ExactBookingPayload,
  YMD,
} from "../types";
import {
  BOOKING_BLOCKS,
  blockLabel,
} from "../../../shared/scheduling/bookingBlocks";
import dialogStyles from "./AgendaDialog.module.css";
import { ContractPicker, label as contractLabel } from "./ContractPicker";
import { useBookingForm, type BookingFormDraft } from "./hooks/useBookingForm";
interface Props {
  initialDate: YMD;
  booking?: BookingDetail | null;
  /** A calendar create request — only applied when `booking` is unset. */
  draft?: BookingFormDraft | null;
  /** Fixes the contract — used when the form is opened from a contract row. */
  contract?: ContractOption | null;
  onCancel: () => void;
  onSave: (
    payload: ExactBookingPayload,
    note: string,
    contractId: number | null
  ) => Promise<void>;
}
export const BookingForm = ({
  initialDate,
  booking,
  draft,
  contract,
  onCancel,
  onSave,
}: Props) => {
  const form = useBookingForm({ initialDate, booking, draft, contract, onSave });
  const title = booking ? "Editar evento" : "Nuevo evento";
  const close = () => {
    if (!form.saving) onCancel();
  };
  return (
    <Modal
      show
      onHide={close}
      backdrop={form.saving ? "static" : true}
      keyboard={!form.saving}
      centered
      scrollable
      dialogClassName={dialogStyles.dialog}
      aria-label={title}
    >
      <Form onSubmit={form.submit}>
        <Modal.Header closeButton={!form.saving}>
          <Modal.Title as="h2">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="booking-date">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  aria-label="Fecha"
                  type="date"
                  value={form.state.eventDate}
                  onChange={(event) =>
                    form.update("eventDate", event.target.value)
                  }
                  required
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="booking-start">
                <Form.Label>Inicio</Form.Label>
                <Form.Control
                  aria-label="Inicio"
                  type="time"
                  value={form.state.startsAt}
                  onChange={(event) =>
                    form.update("startsAt", event.target.value)
                  }
                  required
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="booking-end">
                <Form.Label>Fin</Form.Label>
                <Form.Control
                  aria-label="Fin"
                  type="time"
                  value={form.state.endsAt}
                  onChange={(event) =>
                    form.update("endsAt", event.target.value)
                  }
                  required
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Label>Horario rápido</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline-secondary"
                  aria-label="Todo el día (00:00–23:59)"
                  onClick={() => form.applyPreset("00:00", "23:59")}
                  disabled={form.saving}
                >
                  <strong className="d-block">Todo el día</strong>
                  <small className="d-block">(00:00–23:59)</small>
                </Button>
                {BOOKING_BLOCKS.map((block) => (
                  <Button
                    key={block.id}
                    type="button"
                    variant="outline-secondary"
                    aria-label={blockLabel(block)}
                    onClick={() =>
                      form.applyPreset(
                        block.startsAt,
                        block.endsAt,
                        block.endsNextDay
                      )
                    }
                    disabled={form.saving}
                  >
                    <strong className="d-block">{block.label}</strong>
                    <small className="d-block">
                      ({block.startsAt}–{block.endsAt})
                    </small>
                  </Button>
                ))}
              </div>
            </Col>
            <Col xs={12}>
              <ContractPicker
                value={form.contractId}
                onChange={form.setContractId}
                lockedLabel={contract ? contractLabel(contract) : undefined}
                disabled={form.saving}
              />
            </Col>
            <Col md={6}>
              <Form.Group controlId="booking-title">
                <Form.Label>Título</Form.Label>
                <Form.Control
                  aria-label="Título"
                  value={form.state.title}
                  onChange={(event) => form.update("title", event.target.value)}
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="booking-purpose">
                <Form.Label>Propósito</Form.Label>
                <Form.Select
                  aria-label="Propósito"
                  value={form.state.purpose}
                  onChange={(event) =>
                    form.update("purpose", event.target.value)
                  }
                  disabled={form.saving}
                >
                  <option value="event">Evento</option>
                  <option value="scouting">Scouting</option>
                  <option value="meeting">Reunión</option>
                  <option value="trial_makeup">Prueba de maquillaje</option>
                  <option value="trial_hair">Prueba de peinado</option>
                  <option value="trial_nail">Prueba de uñas</option>
                  <option value="other">Otro</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="booking-venue">
                <Form.Label>Lugar</Form.Label>
                <Form.Control
                  aria-label="Lugar"
                  value={form.state.venueName}
                  onChange={(event) =>
                    form.update("venueName", event.target.value)
                  }
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="booking-maps">
                <Form.Label>Maps URL</Form.Label>
                <Form.Control
                  aria-label="Maps URL"
                  type="url"
                  value={form.state.mapsUrl}
                  onChange={(event) =>
                    form.update("mapsUrl", event.target.value)
                  }
                  placeholder="https://..."
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group controlId="booking-note">
                <Form.Label>Nota interna</Form.Label>
                <Form.Control
                  aria-label="Nota interna"
                  as="textarea"
                  rows={3}
                  value={form.state.note}
                  onChange={(event) => form.update("note", event.target.value)}
                  disabled={form.saving}
                />
              </Form.Group>
            </Col>
          </Row>
          {form.error ? (
            <p className="text-danger mt-3 mb-0" role="alert">
              {form.error}
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="light"
            onClick={close}
            disabled={form.saving}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={form.saving}>
            {form.saving ? "Guardando…" : "Guardar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
