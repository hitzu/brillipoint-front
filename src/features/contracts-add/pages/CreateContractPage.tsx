import { type FormEvent } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { ClientSection } from "../components/ClientSection";
import { ScheduleSection } from "../components/ScheduleSection";
import { PackagesSection } from "../components/PackagesSection";
import { ExtrasSection } from "../components/ExtrasSection";
import { PaymentSection } from "../components/PaymentSection";
import { NotesSection } from "../components/NotesSection";
import { SuccessSection } from "../components/SuccessSection";
import { useCreateContractForm } from "../hooks/useCreateContractForm";

/**
 * NOTE on the post-submit destination: the app has no single-contract detail
 * route yet (no `src/pages/contracts/[sku].tsx` or equivalent), so "Ir a
 * contratos" on the success view navigates to the existing `/contracts` list
 * rather than inventing an undocumented route. Revisit once a detail page
 * exists.
 */
const CONTRACTS_LIST_ROUTE = "/contracts";

export function CreateContractPage() {
  const router = useRouter();
  const vm = useCreateContractForm();

  const goToContractsList = () => router.push(CONTRACTS_LIST_ROUTE);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void vm.handleSubmit();
  };

  if (vm.contract) {
    return (
      <>
        <BreadcrumbItem mainTitle="Contratos" subTitle="Agregar contrato" />
        <Row>
          <Col sm={12}>
            <SuccessSection
              clientName={vm.clientName}
              contractLink={vm.contractLink}
              bookingWarning={vm.bookingWarning}
              onReset={vm.resetForm}
              onGoToContracts={goToContractsList}
            />
          </Col>
        </Row>
      </>
    );
  }

  return (
    <>
      <BreadcrumbItem mainTitle="Contratos" subTitle="Agregar contrato" />
      <Row>
        <Col sm={12}>
          <Form onSubmit={onSubmit}>
            <ClientSection
              users={vm.users}
              brands={vm.brands}
              selectedUserId={vm.selectedUserId}
              onUserChange={vm.setSelectedUserId}
              selectedBrandId={vm.selectedBrandId}
              onBrandChange={vm.setSelectedBrandId}
              clientName={vm.clientName}
              onClientNameChange={vm.setClientName}
              clientPhone={vm.clientPhone}
              onClientPhoneChange={vm.setClientPhone}
              clientEmail={vm.clientEmail}
              onClientEmailChange={vm.setClientEmail}
              disabled={vm.isSubmitting}
            />
            <ScheduleSection
              eventDate={vm.eventDate}
              onEventDateChange={vm.setEventDate}
              startTime={vm.startTime}
              onStartTimeChange={vm.setStartTime}
              endDate={vm.endDate}
              onEndDateChange={vm.setEndDate}
              endTime={vm.endTime}
              onEndTimeChange={vm.setEndTime}
              onApplyAllDay={vm.applyAllDay}
              venueName={vm.venueName}
              onVenueNameChange={vm.setVenueName}
              mapsUrl={vm.mapsUrl}
              onMapsUrlChange={vm.setMapsUrl}
              disabled={vm.isSubmitting}
            />
            <PackagesSection
              packages={vm.packages}
              cart={vm.cart}
              brandSelected={!!vm.selectedBrandId}
              onAdd={vm.addPackageToCart}
              onRemove={vm.removePackageFromCart}
              onQuantityChange={vm.setCartItemQuantity}
              disabled={vm.isSubmitting}
            />
            <ExtrasSection
              extras={vm.extrasCatalog}
              cart={vm.cart}
              extraCart={vm.extraCart}
              onAdd={vm.addExtraToCart}
              onRemove={vm.removeExtraFromCart}
              onQuantityChange={vm.setExtraCartItemQuantity}
              disabled={vm.isSubmitting}
            />
            <PaymentSection
              subtotal={vm.subtotal}
              depositAmount={vm.depositAmount}
              onDepositAmountChange={vm.setDepositAmount}
              balance={vm.balance}
              paymentMethod={vm.paymentMethod}
              onPaymentMethodChange={vm.setPaymentMethod}
              disabled={vm.isSubmitting}
            />
            <NotesSection
              publicNote={vm.publicNote}
              onPublicNoteChange={vm.setPublicNote}
              disabled={vm.isSubmitting}
            />

            {vm.errorMsg ? (
              <Alert variant="danger" role="alert">
                {vm.errorMsg}
              </Alert>
            ) : null}

            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                variant="light"
                onClick={goToContractsList}
                disabled={vm.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={vm.isSubmitting}>
                {vm.isSubmitting ? "Guardando…" : "Crear contrato"}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </>
  );
}
