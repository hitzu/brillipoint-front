import { Card, Form } from "react-bootstrap";

export interface NotesSectionProps {
  publicNote: string;
  onPublicNoteChange: (value: string) => void;
  disabled?: boolean;
}

export function NotesSection({
  publicNote,
  onPublicNoteChange,
  disabled,
}: NotesSectionProps) {
  return (
    <Card className="mb-3">
      <Card.Header as="h5">Notas</Card.Header>
      <Card.Body>
        <Form.Group controlId="contract-public-note">
          <Form.Label>Nota pública</Form.Label>
          <Form.Control
            aria-label="Nota pública"
            as="textarea"
            rows={3}
            value={publicNote}
            onChange={(event) => onPublicNoteChange(event.target.value)}
            disabled={disabled}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
}
