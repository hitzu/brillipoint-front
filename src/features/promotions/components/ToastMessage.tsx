import React from "react";
import { Toast } from "react-bootstrap";

interface Props {
  show: boolean;
  message: string;
  variant: "success" | "danger";
  onClose: () => void;
}

const ToastMessage = ({ show, message, variant, onClose }: Props) => (
  <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
    <Toast onClose={onClose} show={show} delay={4000} autohide bg={variant}>
      <Toast.Header>
        <strong className="me-auto">{variant === "success" ? "Éxito" : "Error"}</strong>
      </Toast.Header>
      <Toast.Body className="text-white">{message}</Toast.Body>
    </Toast>
  </div>
);

export default ToastMessage;
