import { useState } from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import type { Extra } from "../../../interfaces/extras";
import { clampQuantity } from "../../expo-bebe/utils/quantity";
import type { CartItem, ExtraCartItem } from "../utils/validation";

export interface ExtrasSectionProps {
  extras: Extra[];
  cart: CartItem[];
  extraCart: ExtraCartItem[];
  onAdd: (extraId: number, packageClientRef: string | null) => void;
  onRemove: (extraId: number) => void;
  onQuantityChange: (extraId: number, quantity: number) => void;
  disabled?: boolean;
}

const fmtPrice = (value: number) => value.toLocaleString("es-MX");

export function ExtrasSection({
  extras,
  cart,
  extraCart,
  onAdd,
  onRemove,
  onQuantityChange,
  disabled,
}: ExtrasSectionProps) {
  const [selectedExtraId, setSelectedExtraId] = useState<number | "">("");
  const [selectedPackageClientRef, setSelectedPackageClientRef] =
    useState<string>("");

  const handleAdd = () => {
    if (!selectedExtraId) return;
    onAdd(Number(selectedExtraId), selectedPackageClientRef || null);
    setSelectedExtraId("");
  };

  return (
    <Card className="mb-3">
      <Card.Header as="h5">Extras</Card.Header>
      <Card.Body>
        <Row className="g-3">
          {cart.length > 1 ? (
            <Col xs={12}>
              <Form.Group controlId="contract-extra-target">
                <Form.Label>Paquete al que pertenece</Form.Label>
                <Form.Select
                  aria-label="Paquete al que pertenece"
                  value={selectedPackageClientRef}
                  onChange={(event) =>
                    setSelectedPackageClientRef(event.target.value)
                  }
                  disabled={disabled}
                >
                  <option value="">Sin vincular</option>
                  {cart.map((item) => (
                    <option key={item.clientRef} value={item.clientRef}>
                      {item.pkg.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          ) : null}
          <Col xs={12}>
            <Form.Group controlId="contract-extra-picker">
              <Form.Label>Extra</Form.Label>
              <Form.Select
                aria-label="Extra"
                value={selectedExtraId}
                onChange={(event) =>
                  setSelectedExtraId(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
                disabled={disabled}
              >
                <option value="">Selecciona un extra</option>
                {extras.map((extra) => (
                  <option key={extra.id} value={extra.id}>
                    {extra.name} — ${fmtPrice(extra.price)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12}>
            <Button
              type="button"
              variant="primary"
              onClick={handleAdd}
              disabled={disabled || !selectedExtraId}
            >
              Agregar
            </Button>
          </Col>
        </Row>

        {extraCart.length > 0 ? (
          <Table responsive className="mt-3 mb-0" aria-label="Extras agregados">
            <thead>
              <tr>
                <th>Extra</th>
                <th>Vinculado a</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {extraCart.map((item) => {
                const linkedPackage = cart.find(
                  (line) => line.clientRef === item.packageClientRef,
                );
                return (
                  <tr key={item.extra.id}>
                    <td>{item.extra.name}</td>
                    <td>{linkedPackage?.pkg.name ?? "Sin vincular"}</td>
                    <td>${fmtPrice(item.extra.price)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-secondary"
                          aria-label={`Quitar una unidad de ${item.extra.name}`}
                          onClick={() =>
                            onQuantityChange(
                              item.extra.id,
                              clampQuantity(item.quantity - 1),
                            )
                          }
                          disabled={disabled}
                        >
                          −
                        </Button>
                        <span aria-label={`Cantidad de ${item.extra.name}`}>
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-secondary"
                          aria-label={`Agregar una unidad de ${item.extra.name}`}
                          onClick={() =>
                            onQuantityChange(
                              item.extra.id,
                              clampQuantity(item.quantity + 1),
                            )
                          }
                          disabled={disabled}
                        >
                          +
                        </Button>
                      </div>
                    </td>
                    <td>${fmtPrice(item.extra.price * item.quantity)}</td>
                    <td>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-danger"
                        aria-label={`Eliminar ${item.extra.name}`}
                        onClick={() => onRemove(item.extra.id)}
                        disabled={disabled}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <p className="text-muted mt-3 mb-0">Aún no hay extras agregados.</p>
        )}
      </Card.Body>
    </Card>
  );
}
