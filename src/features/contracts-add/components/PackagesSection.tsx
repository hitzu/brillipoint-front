import { useState } from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import type { GetPackagesResponse } from "../../../interfaces/packages";
import { clampQuantity } from "../../expo-bebe/utils/quantity";
import type { CartItem } from "../utils/validation";

export interface PackagesSectionProps {
  packages: GetPackagesResponse[];
  cart: CartItem[];
  /** Packages are scoped to one brand; show a hint until one is picked. */
  brandSelected: boolean;
  onAdd: (packageId: number) => void;
  onRemove: (packageId: number) => void;
  onQuantityChange: (packageId: number, quantity: number) => void;
  disabled?: boolean;
}

const fmtPrice = (value: number) => value.toLocaleString("es-MX");

export function PackagesSection({
  packages,
  cart,
  brandSelected,
  onAdd,
  onRemove,
  onQuantityChange,
  disabled,
}: PackagesSectionProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<number | "">("");

  const handleAdd = () => {
    if (!selectedPackageId) return;
    onAdd(Number(selectedPackageId));
    setSelectedPackageId("");
  };

  if (!brandSelected) {
    return (
      <Card className="mb-3">
        <Card.Header as="h5">Paquetes</Card.Header>
        <Card.Body>
          <p className="text-muted mb-0">
            Selecciona una marca para ver los paquetes disponibles.
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Header as="h5">Paquetes</Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col xs={12}>
            <Form.Group controlId="contract-package-picker">
              <Form.Label>Paquete</Form.Label>
              <Form.Select
                aria-label="Paquete"
                value={selectedPackageId}
                onChange={(event) =>
                  setSelectedPackageId(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
                disabled={disabled}
              >
                <option value="">Selecciona un paquete</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — {pkg.brand?.name} — ${fmtPrice(pkg.basePrice)}
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
              disabled={disabled || !selectedPackageId}
            >
              Agregar
            </Button>
          </Col>
        </Row>

        {cart.length > 0 ? (
          <Table responsive className="mt-3 mb-0" aria-label="Carrito">
            <thead>
              <tr>
                <th>Paquete</th>
                <th>Marca</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.pkg.id}>
                  <td>{item.pkg.name}</td>
                  <td>{item.pkg.brand?.name}</td>
                  <td>${fmtPrice(item.pkg.basePrice)}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        aria-label={`Quitar una unidad de ${item.pkg.name}`}
                        onClick={() =>
                          onQuantityChange(
                            item.pkg.id,
                            clampQuantity(item.quantity - 1),
                          )
                        }
                        disabled={disabled}
                      >
                        −
                      </Button>
                      <span aria-label={`Cantidad de ${item.pkg.name}`}>
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-secondary"
                        aria-label={`Agregar una unidad de ${item.pkg.name}`}
                        onClick={() =>
                          onQuantityChange(
                            item.pkg.id,
                            clampQuantity(item.quantity + 1),
                          )
                        }
                        disabled={disabled}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td>${fmtPrice(item.pkg.basePrice * item.quantity)}</td>
                  <td>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline-danger"
                      aria-label={`Eliminar ${item.pkg.name}`}
                      onClick={() => onRemove(item.pkg.id)}
                      disabled={disabled}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-muted mt-3 mb-0">Aún no hay paquetes agregados.</p>
        )}
      </Card.Body>
    </Card>
  );
}
