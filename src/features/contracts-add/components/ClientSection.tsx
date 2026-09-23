import { Card, Col, Form, Row } from "react-bootstrap";
import type { GetBrandsResponse } from "../../../interfaces/brands";
import type { UserInfo } from "../../../interfaces/user";

export interface ClientSectionProps {
  users: UserInfo[];
  brands: GetBrandsResponse[];
  selectedUserId: number | "";
  onUserChange: (id: number | "") => void;
  selectedBrandId: number | "";
  onBrandChange: (id: number | "") => void;
  clientName: string;
  onClientNameChange: (value: string) => void;
  clientPhone: string;
  onClientPhoneChange: (value: string) => void;
  clientEmail: string;
  onClientEmailChange: (value: string) => void;
  disabled?: boolean;
}

const userLabel = (user: UserInfo) =>
  user.name || [user.firstName, user.lastName].filter(Boolean).join(" ");

export function ClientSection({
  users,
  brands,
  selectedUserId,
  onUserChange,
  selectedBrandId,
  onBrandChange,
  clientName,
  onClientNameChange,
  clientPhone,
  onClientPhoneChange,
  clientEmail,
  onClientEmailChange,
  disabled,
}: ClientSectionProps) {
  return (
    <Card className="mb-3">
      <Card.Header as="h5">Cliente</Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group controlId="contract-vendor">
              <Form.Label>Vendedor</Form.Label>
              <Form.Select
                aria-label="Vendedor"
                value={selectedUserId}
                onChange={(event) =>
                  onUserChange(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
                disabled={disabled}
              >
                <option value="">Selecciona un vendedor</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {userLabel(user)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="contract-brand">
              <Form.Label>Marca</Form.Label>
              <Form.Select
                aria-label="Marca"
                value={selectedBrandId}
                onChange={(event) =>
                  onBrandChange(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
                disabled={disabled}
              >
                <option value="">Selecciona una marca</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-client-name">
              <Form.Label>Nombre del cliente</Form.Label>
              <Form.Control
                aria-label="Nombre del cliente"
                value={clientName}
                onChange={(event) => onClientNameChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-client-phone">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                aria-label="Teléfono"
                type="tel"
                inputMode="numeric"
                placeholder="10 dígitos"
                value={clientPhone}
                onChange={(event) => onClientPhoneChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="contract-client-email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                aria-label="Email"
                type="email"
                value={clientEmail}
                onChange={(event) => onClientEmailChange(event.target.value)}
                disabled={disabled}
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
