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
import { Card, Col, Row } from "react-bootstrap";
import DeleteModal from "@common/DeleteModal";
import { Promotion } from "../interfaces";
import { deletePromotionById, getPromotions } from "../api/services/promotionsService";

const PromotionsList = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number>(0);

  useEffect(() => {
    const fetchPromotions = async () => {
      const response = (await getPromotions()) as Promotion[];
      setPromotions(response);
    };
    fetchPromotions();
  }, []);

  const handleClose = () => {
    setShowDeleteModal(false);
    setDeleteId(0);
  };

  const handleDeleteId = async () => {
    if (deleteId) {
      try {
        await deletePromotionById(deleteId);
        setPromotions((current) => current.filter((promotion) => promotion.id !== deleteId));
      } catch (error) {
        console.error("Error deleting promotion:", error);
      }
    }
    handleClose();
  };

  const handleDelete = useCallback((id: number) => {
    setShowDeleteModal(true);
    setDeleteId(id);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "nombre",
        accessorKey: "name",
        enableColumnFilter: false,
      },
      {
        header: "Estado",
        enableColumnFilter: false,
        accessorKey: "status",
      },
      {
        header: "Descuento paquetes",
        enableColumnFilter: false,
        accessorFn: (row: Promotion) =>
          row.type === "percentage" ? `${row.value}%` : `$${row.value}`,
      },
      {
        header: "Paquetes con tiers",
        enableColumnFilter: false,
        accessorFn: (row: Promotion) => row.packages?.length ?? 0,
      },
      {
        header: "Acciones",
        enableColumnFilter: false,
        cell: (cellProps: any) => (
          <ul className="list-inline me-auto mb-0">
            <li className="list-inline-item align-bottom" title="Editar">
              <Link
                href={`/promotions-edit/${cellProps.row.original.id}`}
                className="avtar avtar-xs btn-link-success btn-pc-default"
              >
                <i className="ti ti-edit-circle f-18"></i>
              </Link>
            </li>
            <li className="list-inline-item align-bottom" title="Eliminar">
              <Link
                href="#!"
                className="avtar avtar-xs btn-link-danger btn-pc-default"
                onClick={() => handleDelete(cellProps.row.original.id)}
              >
                <i className="ti ti-trash f-18"></i>
              </Link>
            </li>
          </ul>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <React.Fragment>
      <DeleteModal
        show={showDeleteModal}
        handleClose={handleClose}
        handleDeleteId={handleDeleteId}
      />
      <BreadcrumbItem mainTitle="Promociones" subTitle="Lista de promociones" />
      <Row>
        <Col sm={12}>
          <Card className="table-card">
            <Card.Body>
              <div className="d-flex justify-content-end p-sm-4 pb-sm-2">
                <Link href="/promotions-add" className="btn btn-primary">
                  Nueva promoción
                </Link>
              </div>
              <TableContainer
                columns={columns || []}
                data={promotions || []}
                isGlobalFilter={true}
                isBordered={false}
                customPageSize={50}
                tableClass="table table-hover tbl-product datatable-table"
                theadClass="table-light"
                isPagination={true}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

PromotionsList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PromotionsList;
