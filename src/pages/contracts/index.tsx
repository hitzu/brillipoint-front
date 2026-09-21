import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import TableContainer from "@common/TableContainer";
import Link from "next/link";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Row, Form } from "react-bootstrap";
import DeleteModal from "@common/DeleteModal";
import FinalizeModal from "@common/FinalizeModal";
import {
  CreateNoteModal,
  PaymentsModal,
  ScheduleBookingModal,
} from "../../features/contracts";
import { toYMD } from "../../features/booking-agenda/utils/businessDate";
import type { ContractOption } from "../../features/booking-agenda/types";
import {
  deleteContractById,
  finalizeContract,
  getContracts,
} from "../../api/services/contractService";
import { Contract } from "../../interfaces";

const ContractsListPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number>(0);
  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);
  const [finalizeId, setFinalizeId] = useState<number>(0);
  const [showPaymentsModal, setShowPaymentsModal] = useState<boolean>(false);
  const [paymentsContractId, setPaymentsContractId] = useState<number>(0);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [noteContractId, setNoteContractId] = useState<number>(0);
  const [includeFinalized, setIncludeFinalized] = useState<boolean>(false);
  const [scheduleContract, setScheduleContract] =
    useState<ContractOption | null>(null);

  const fetchContracts = useCallback(async () => {
    const response = (await getContracts({
      includeFinalized,
    })) as Contract[];
    setContracts(response);
  }, [includeFinalized]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleClose = () => {
    setShowDeleteModal(false);
    setDeleteId(0);
  };

  const handleDeleteId = async () => {
    if (deleteId) {
      try {
        await deleteContractById(deleteId);
        setContracts(contracts.filter((contract) => contract.id !== deleteId));
      } catch (error) {
        console.error("Error deleting contract:", error);
      }
    }
    handleClose();
  };

  const handleDelete = useCallback((id: number) => {
    setShowDeleteModal(true);
    setDeleteId(id);
  }, []);

  const handleFinalizeClose = () => {
    setShowFinalizeModal(false);
    setFinalizeId(0);
  };

  const handleFinalizeConfirm = async () => {
    if (finalizeId) {
      try {
        await finalizeContract(finalizeId);
        await fetchContracts();
      } catch (error) {
        console.error("Error finalizing contract:", error);
      }
    }
    handleFinalizeClose();
  };

  const handleFinalize = useCallback((id: number) => {
    setShowFinalizeModal(true);
    setFinalizeId(id);
  }, []);

  const handlePayments = useCallback((id: number) => {
    setPaymentsContractId(id);
    setShowPaymentsModal(true);
  }, []);

  const handlePaymentsClose = () => {
    setShowPaymentsModal(false);
    setPaymentsContractId(0);
  };

  const handleSchedule = useCallback((contract: Contract) => {
    setScheduleContract({
      id: contract.id,
      sku: contract.sku ?? "",
      clientName: contract.clientName ?? "",
    });
  }, []);

  const handleScheduleClose = () => setScheduleContract(null);

  const handleCreateNote = useCallback((id: number) => {
    setNoteContractId(id);
    setShowNoteModal(true);
  }, []);

  const handleNoteClose = () => {
    setShowNoteModal(false);
    setNoteContractId(0);
  };

  const columns = useMemo(
    () => [
      {
        header: "sku",
        accessorKey: "sku",
        enableColumnFilter: false,
      },
      {
        header: "Nombre del cliente",
        enableColumnFilter: false,
        accessorKey: "clientName",
      },
      {
        header: "Telefono del cliente",
        enableColumnFilter: false,
        accessorKey: "clientPhone",
      },
      {
        header: "token",
        enableColumnFilter: false,
        accessorKey: "token",
        cell: (cellProps: any) => {
          return (
            <div>
              <Link
                href={`/reserva/${cellProps.row.original.token}`}
                target="_blank"
              >
                {cellProps.row.original.token}
              </Link>
            </div>
          );
        },
      },
      {
        header: "Acciones",
        enableColumnFilter: false,
        cell: (cellProps: any) => {
          return (
            <React.Fragment>
              <ul className="list-inline me-auto mb-0">
                <li
                  className="list-inline-item align-bottom"
                  data-bs-toggle="tooltip"
                  title="Agendar"
                >
                  <Link
                    href="#!"
                    className="avtar avtar-xs btn-link-info btn-pc-default"
                    onClick={() => handleSchedule(cellProps.row.original)}
                    aria-label="Agendar evento del contrato"
                  >
                    <i className="ti ti-calendar-plus f-18"></i>
                  </Link>
                </li>
                <li
                  className="list-inline-item align-bottom"
                  data-bs-toggle="tooltip"
                  title="Pagos"
                >
                  <Link
                    href="#!"
                    className="avtar avtar-xs btn-link-primary btn-pc-default"
                    onClick={() => handlePayments(cellProps.row.original.id)}
                    aria-label="Pagos del contrato"
                  >
                    <i className="ti ti-cash f-18"></i>
                  </Link>
                </li>
                <li
                  className="list-inline-item align-bottom"
                  data-bs-toggle="tooltip"
                  title="Finalizar"
                >
                  <Link
                    href="#!"
                    className="avtar avtar-xs btn-link-success btn-pc-default"
                    onClick={() => handleFinalize(cellProps.row.original.id)}
                    aria-label="Finalizar contrato"
                  >
                    <i className="ti ti-check f-18"></i>
                  </Link>
                </li>
                <li
                  className="list-inline-item align-bottom"
                  data-bs-toggle="tooltip"
                  title="Crear nota"
                >
                  <Link
                    href="#!"
                    className="avtar avtar-xs btn-link-warning btn-pc-default"
                    onClick={() => handleCreateNote(cellProps.row.original.id)}
                    aria-label="Crear nota para el evento"
                  >
                    <i className="ti ti-note f-18"></i>
                  </Link>
                </li>
                <li
                  className="list-inline-item align-bottom"
                  data-bs-toggle="tooltip"
                  title="Delete"
                >
                  <Link
                    href="#!"
                    className="avtar avtar-xs btn-link-danger btn-pc-default"
                    onClick={() => handleDelete(cellProps.row.original.id)}
                    aria-label="Eliminar contrato"
                  >
                    <i className="ti ti-trash f-18"></i>
                  </Link>
                </li>
              </ul>
            </React.Fragment>
          );
        },
      },
    ],
    [
      handleDelete,
      handleFinalize,
      handlePayments,
      handleCreateNote,
      handleSchedule,
    ],
  );

  return (
    <React.Fragment>
      <DeleteModal
        show={showDeleteModal}
        handleClose={handleClose}
        handleDeleteId={handleDeleteId}
      />
      <FinalizeModal
        show={showFinalizeModal}
        handleClose={handleFinalizeClose}
        handleConfirm={handleFinalizeConfirm}
      />
      <PaymentsModal
        show={showPaymentsModal}
        handleClose={handlePaymentsClose}
        contractId={paymentsContractId}
      />
      <CreateNoteModal
        show={showNoteModal}
        handleClose={handleNoteClose}
        contractId={noteContractId}
      />
      <ScheduleBookingModal
        show={scheduleContract !== null}
        contract={scheduleContract}
        initialDate={toYMD(new Date())}
        handleClose={handleScheduleClose}
      />

      <BreadcrumbItem mainTitle="Contratos" subTitle="Lista de contratos" />
      <Row>
        <Col sm={12}>
          <Card className="table-card">
            <Card.Body>
              <TableContainer
                columns={columns || []}
                data={contracts || []}
                isGlobalFilter={true}
                isBordered={false}
                customPageSize={50}
                tableClass="table table-hover tbl-product datatable-table"
                theadClass="table-light"
                isPagination={true}
                topRightContent={
                  <Form.Check
                    type="checkbox"
                    id="includeFinalized"
                    label="Incluir finalizados"
                    checked={includeFinalized}
                    onChange={(e) => setIncludeFinalized(e.target.checked)}
                    className="mb-0 ps-3"
                  />
                }
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

ContractsListPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContractsListPage;
