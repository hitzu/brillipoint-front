import React, { ReactNode, useId, useState } from "react";
import { Card, Collapse } from "react-bootstrap";

interface EventBrandSectionProps {
  /** Initial open state; afterwards toggling is pure UI state. */
  defaultOpen: boolean;
  children: ReactNode;
}

/**
 * Collapsible "Marca del evento" card. Collapsing only hides the content: it
 * never mounts/unmounts it, so unsaved edits and the saved data are untouched.
 */
const EventBrandSection = ({ defaultOpen, children }: EventBrandSectionProps) => {
  const id = useId();
  const panelId = `${id}-brand-panel`;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="mt-3">
      <Card.Header>
        <button
          type="button"
          className="btn btn-link p-0 text-reset text-decoration-none w-100 text-start d-flex align-items-center justify-content-between"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <h5 className="mb-0">Marca del evento</h5>
          <i className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`} aria-hidden="true" />
        </button>
        <small className="text-muted d-block mt-1">
          Para empresas o eventos con marca propia: logo, tema y CTA.
        </small>
      </Card.Header>
      <Collapse in={open}>
        <div id={panelId}>
          <Card.Body>{children}</Card.Body>
        </div>
      </Collapse>
    </Card>
  );
};

export default EventBrandSection;
