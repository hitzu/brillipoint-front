import { Button, Form, Modal } from "react-bootstrap";
import type { AgendaEntry, BookingDetail } from "../types";
import dialogStyles from "./AgendaDialog.module.css";
import { useBookingDetails } from "./hooks/useBookingDetails";
import { useBookingDetailsEffects } from "./hooks/useBookingDetailsEffects";
const safeHttpUrl = (value: string | null | undefined) => {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.hostname &&
      (url.protocol === "http:" || url.protocol === "https:")
      ? url.href
      : null;
  } catch {
    return null;
  }
};
interface Props {
  entry: AgendaEntry;
  readOnly: boolean;
  onClose: () => void;
  onEdit: (detail: BookingDetail) => void;
  detail?: BookingDetail | null;
  pendingNote?: string | null;
  onPendingNoteSaved?: () => void;
}
export const BookingDetails = ({
  entry,
  readOnly,
  onClose,
  onEdit,
  detail: updatedDetail,
  pendingNote,
  onPendingNoteSaved,
}: Props) => {
  const details = useBookingDetails({
    bookingId: entry.bookingId,
    onPendingNoteSaved,
  });
  useBookingDetailsEffects({
    bookingId: entry.bookingId,
    readOnly,
    updatedDetail,
    setDetail: details.setDetail,
    setError: details.setError,
    setNotes: details.setNotes,
  });
  const mapsUrl = safeHttpUrl(details.detail?.mapsUrl);
  const close = () => {
    if (!details.saving) onClose();
  };
  return (
    <Modal
      show
      onHide={close}
      backdrop={details.saving ? "static" : true}
      keyboard={!details.saving}
      centered
      scrollable
      dialogClassName={dialogStyles.dialog}
      aria-label="Detalles del evento"
    >
      <Modal.Header closeButton={!details.saving}>
        <Modal.Title as="h2">Detalles del evento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {details.error ? <p role="alert">{details.error}</p> : null}
        {!details.detail && !details.error ? (
          <p aria-busy="true">Cargando detalles…</p>
        ) : null}
        {details.detail ? (
          <>
            <p>
              <strong>{details.detail.title || entry.title || "Evento"}</strong>
            </p>
            {details.detail.contract?.sku && details.detail.contract.token ? (
              <p>
                <a href={`/reserva/${details.detail.contract.token}`}>
                  {details.detail.contract.sku}
                </a>
              </p>
            ) : (
              <p>Sin contrato vinculado.</p>
            )}
            {details.detail.venueName ? (
              <p>{details.detail.venueName}</p>
            ) : null}
            {mapsUrl ? (
              <p>
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  Ver en Maps
                </a>
              </p>
            ) : null}
            {!readOnly ? (
              <>
                <hr />
                <h3 className="h5">Notas internas</h3>
                {details.notes.length ? (
                  <ul className={`${dialogStyles.notes} ps-3`}>
                    {details.notes.map((item) => (
                      <li key={item.id}>{item.content}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-secondary">Sin notas internas.</p>
                )}
                {pendingNote ? (
                  <p role="alert">
                    El evento se guardó, pero falta la nota.{" "}
                    <Button
                      variant="link"
                      className="p-0 align-baseline"
                      disabled={details.saving}
                      onClick={() => details.addNote(pendingNote)}
                    >
                      Reintentar nota
                    </Button>
                  </p>
                ) : null}
                <Form.Group controlId="booking-details-note">
                  <Form.Label>Nueva nota</Form.Label>
                  <Form.Control
                    aria-label="Nueva nota"
                    as="textarea"
                    rows={3}
                    value={details.note}
                    onChange={(event) => details.setNote(event.target.value)}
                    disabled={details.saving}
                  />
                </Form.Group>
              </>
            ) : null}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        {!readOnly && details.detail ? (
          <Button
            type="button"
            variant="outline-primary"
            onClick={() => details.detail && onEdit(details.detail)}
          >
            Editar
          </Button>
        ) : null}
        {!readOnly ? (
          <Button
            type="button"
            variant="primary"
            disabled={details.saving || !details.note.trim()}
            onClick={() => details.addNote()}
          >
            Agregar nota
          </Button>
        ) : null}
        <Button
          type="button"
          variant="light"
          onClick={onClose}
          disabled={details.saving}
        >
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
