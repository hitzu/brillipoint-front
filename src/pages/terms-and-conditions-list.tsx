import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import {
  GetBrandTermsResponse,
  GetPackageTermsResponse,
  GetTermsResponse,
} from "../interfaces";
import TableContainer from "@common/TableContainer";
import Link from "next/link";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Row } from "react-bootstrap";
import DeleteModal from "@common/DeleteModal";
import { deleteTermById, getTerms } from "../api/services/termsService";
import { termScopes } from "../features/terms/constants";

const TermsAndConditionsList = () => {
  const [terms, setTerms] = useState<GetTermsResponse[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [termScopeSelected, setTermScopeSelected] = useState<string>("global");
  const [deleteId, setDeleteId] = useState<number>(0);

  useEffect(() => {
    const fetchTerms = async () => {
      const response = (await getTerms({
        termScope: termScopeSelected,
      })) as GetTermsResponse[];
      setTerms(response);
    };
    fetchTerms();
  }, [termScopeSelected]);

  const handleDeleteId = async () => {
    if (deleteId) {
      try {
        await deleteTermById(deleteId);
        setTerms(terms.filter((currentTerm) => currentTerm.id !== deleteId));
      } catch (error) {
        console.error("Error deleting term:", error);
      }
    }
    handleClose();
  };

  const handleClose = () => {
    setShowDeleteModal(false);
    setDeleteId(0);
  };

  const handleDelete = useCallback((id: number) => {
    setShowDeleteModal(true);
    setDeleteId(id);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "Nombre",
        accessorKey: "title",
        enableColumnFilter: false,
      },
      {
        header: "Contenido",
        accessorKey: "content",
        enableColumnFilter: false,
        cell: (cellProps: any) => {
          const content = cellProps.row.original.content || "";
          return (
            <div>
              {content.length > 75 ? `${content.substring(0, 75)}...` : content}
            </div>
          );
        },
      },
      {
        header: "Paquetes",
        accessorKey: "packageTerms",
        enableColumnFilter: false,
        cell: (cellProps: any) => {
          return (
            <div>
              <ul>
                {cellProps.row.original.packageTerms
                  ?.filter(
                    (packageTerm: GetPackageTermsResponse) =>
                      packageTerm.package
                  )
                  .map((packageTerm: GetPackageTermsResponse) => (
                    <li key={packageTerm.id}>{packageTerm.package.name}</li>
                  ))}
              </ul>
            </div>
          );
        },
      },
      {
        header: "Marcas",
        accessorKey: "brandTerms",
        enableColumnFilter: false,
        cell: (cellProps: any) => {
          return (
            <div>
              <ul>
                {cellProps.row.original.brandTerms?.map(
                  (brandTerm: GetBrandTermsResponse) => (
                    <li key={brandTerm.id}>{brandTerm.brand.name}</li>
                  )
                )}
              </ul>
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
                  title="Edit"
                >
                  <Link
                    href={`/terms-and-conditions-edit/${cellProps.row.original.id}`}
                    className="avtar avtar-xs btn-link-success btn-pc-default"
                  >
                    <i className="ti ti-edit-circle f-18"></i>
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
    [handleDelete]
  );

  return (
    <React.Fragment>
      <DeleteModal
        show={showDeleteModal}
        handleClose={handleClose}
        handleDeleteId={handleDeleteId}
      />

      <BreadcrumbItem
        mainTitle="Terminos y condiciones"
        subTitle="Lista de terminos y condiciones"
      />
      <Row>
        <Col sm={12}>
          <Card className="table-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center p-sm-4 pb-sm-2">
                <select
                  className="form-select w-75"
                  value={termScopeSelected}
                  onChange={(e) => {
                    setTermScopeSelected(e.target.value);
                  }}
                >
                  {termScopes.map((termScope) => (
                    <option key={termScope.value} value={termScope.value}>
                      {termScope.label}
                    </option>
                  ))}
                </select>
                <Link
                  href="/terms-and-conditions-add"
                  className="btn btn-primary"
                >
                  <i className="ti ti-plus f-18"></i> Agregar termino y
                  condicion
                </Link>
              </div>
              <TableContainer
                columns={columns || []}
                data={terms || []}
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

TermsAndConditionsList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TermsAndConditionsList;
