import React, { ReactElement, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import DeleteModal from "@common/DeleteModal";
import { Card, Col, Row } from "react-bootstrap";
import { GetBrandsResponse, PromotionDetail } from "../../interfaces";
import { getBrands } from "../../api/services/brandService";
import {
  deletePromotionById,
  getPromotionById,
  updatePromotionById,
} from "../../api/services/promotionsService";
import PromotionForm, {
  PromotionFormValues,
} from "../../features/promotions/components/PromotionForm";
import PromotionTiersEditor from "../../features/promotions/components/PromotionTiersEditor";
import ToastMessage from "../../features/promotions/components/ToastMessage";
import {
  apiErrorMessage,
  detailToFormValues,
  formValuesToPayload,
} from "../../features/promotions/utils";

const PromotionsEdit = () => {
  const router = useRouter();
  const id = Number(router.query.id);
  const [brands, setBrands] = useState<GetBrandsResponse[]>([]);
  const [promotion, setPromotion] = useState<PromotionDetail | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" as "success" | "danger" });

  const notify = useCallback(
    (message: string, variant: "success" | "danger") => setToast({ show: true, message, variant }),
    []
  );

  useEffect(() => {
    getBrands().then(setBrands).catch((error) => console.error("Error fetching brands:", error));
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) return;
    getPromotionById(id)
      .then(setPromotion)
      .catch((error) => {
        console.error("Error fetching promotion:", error);
        notify("Error al cargar la promoción", "danger");
      });
  }, [router.isReady, id, notify]);

  const handleSubmit = async (values: PromotionFormValues) => {
    try {
      // brandId is locked in the UI; omit it so the API never re-validates it.
      const { brandId: _brandId, ...payload } = formValuesToPayload(values);
      await updatePromotionById(id, payload);
      setPromotion(await getPromotionById(id));
      notify("Promoción actualizada exitosamente", "success");
    } catch (error) {
      console.error("Error updating promotion:", error);
      notify(apiErrorMessage(error, "Error al actualizar la promoción"), "danger");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePromotionById(id);
      router.push("/promotions-list");
    } catch (error) {
      console.error("Error deleting promotion:", error);
      setShowDeleteModal(false);
      notify("Error al eliminar la promoción", "danger");
    }
  };

  return (
    <React.Fragment>
      <DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleDeleteId={handleDelete}
      />
      <BreadcrumbItem mainTitle="Promociones" subTitle="Editar promoción" />
      <ToastMessage {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <Row>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Datos de la promoción</h5>
            </Card.Header>
            <Card.Body>
              {promotion && (
                <PromotionForm
                  brands={brands}
                  brandLocked
                  initialValues={detailToFormValues(promotion)}
                  submitLabel="Actualizar promoción"
                  onSubmit={handleSubmit}
                  onDelete={() => setShowDeleteModal(true)}
                />
              )}
            </Card.Body>
          </Card>

          {promotion && (
            <Card>
              <Card.Header>
                <h5>Descuentos por paquete (tiers)</h5>
              </Card.Header>
              <Card.Body>
                <PromotionTiersEditor
                  promotionId={promotion.id}
                  brandId={promotion.brandId}
                  rows={promotion.promotionPackages}
                  onResult={notify}
                />
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </React.Fragment>
  );
};

PromotionsEdit.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PromotionsEdit;
