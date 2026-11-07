import React, { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Row } from "react-bootstrap";
import { GetBrandsResponse } from "../interfaces";
import { getBrands } from "../api/services/brandService";
import { createPromotion } from "../api/services/promotionsService";
import PromotionForm, {
  PromotionFormValues,
} from "../features/promotions/components/PromotionForm";
import ToastMessage from "../features/promotions/components/ToastMessage";
import { apiErrorMessage, formValuesToPayload } from "../features/promotions/utils";

const PromotionsAdd = () => {
  const router = useRouter();
  const [brands, setBrands] = useState<GetBrandsResponse[]>([]);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" as "success" | "danger" });

  useEffect(() => {
    getBrands().then(setBrands).catch((error) => console.error("Error fetching brands:", error));
  }, []);

  const handleSubmit = async (values: PromotionFormValues) => {
    try {
      const created = await createPromotion(formValuesToPayload(values));
      router.push(`/promotions-edit/${created.id}`);
    } catch (error) {
      console.error("Error creating promotion:", error);
      setToast({
        show: true,
        message: apiErrorMessage(error, "Error al crear la promoción"),
        variant: "danger",
      });
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Promociones" subTitle="Agregar promoción" />
      <ToastMessage {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <Row>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <h5>Datos de la promoción</h5>
            </Card.Header>
            <Card.Body>
              <PromotionForm brands={brands} submitLabel="Crear promoción" onSubmit={handleSubmit} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

PromotionsAdd.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PromotionsAdd;
