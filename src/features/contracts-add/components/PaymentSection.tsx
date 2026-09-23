import { Card, Col, Form, Row } from "react-bootstrap";
import type { PaymentMethod } from "../../../interfaces/payments";

export interface PaymentSectionProps {
  subtotal: number;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  balance: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  disabled?: boolean;
}

const fmtPrice = (value: number) => value.toLocaleString("es-MX");

export function PaymentSection({
  subtotal,
  depositAmount,
  onDepositAmountChange,
  balance,
  paymentMethod,
  onPaymentMethodChange,
  disabled,
}: PaymentSectionProps) {
  return (
    <Card className="mb-3">
      <Card.Header as="h5">Pago</Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>Subtotal</Form.Label>
            <p className="fs-5 mb-0">${fmtPrice(subtotal)}</p>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-deposit">
              <Form.Label>Anticipo</Form.Label>
              <Form.Control
                aria-label="Anticipo"
                inputMode="numeric"
                value={depositAmount}
                onChange={(event) =>
                  onDepositAmountChange(event.target.value)
                }
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Label>Saldo</Form.Label>
            <p className="fs-5 mb-0">${fmtPrice(balance)}</p>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-payment-method">
              <Form.Label>Forma de pago</Form.Label>
              <Form.Select
                aria-label="Forma de pago"
                value={paymentMethod}
                onChange={(event) =>
                  onPaymentMethodChange(event.target.value as PaymentMethod)
                }
                disabled={disabled}
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
