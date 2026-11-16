import React, { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "react-bootstrap";
import { getStaffPrepProfile } from "../../../../api/services/prepProfileService";
import { PrepProfileAnswers } from "../../../../interfaces";
import { PrepProfileAnswersView } from "./PrepProfileAnswersView";

interface PrepProfileModalProps {
  show: boolean;
  contractId: number;
  handleClose: () => void;
}

export function PrepProfileModal({
  show,
  contractId,
  handleClose,
}: PrepProfileModalProps) {
  const [answers, setAnswers] = useState<PrepProfileAnswers | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !contractId) return;
    let cancelled = false;
    setAnswers(null);
    setError(null);
    const load = async () => {
      try {
        const profile = await getStaffPrepProfile(contractId);
        if (!cancelled) setAnswers(profile.answers ?? {});
      } catch {
        if (!cancelled) setError("No se pudieron cargar las respuestas.");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [show, contractId]);

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Respuestas del cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <div role="alert" className="text-danger">
            {error}
          </div>
        ) : answers === null ? (
          <Spinner animation="border" size="sm" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        ) : (
          <PrepProfileAnswersView answers={answers} />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
