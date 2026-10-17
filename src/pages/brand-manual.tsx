import type { ReactElement } from "react";
import type { NextPage } from "next";
import Layout from "@layout/index";
import { BrandManualPage } from "../features/brand-manual/pages/BrandManualPage";

const BrandManualRoute: NextPage & {
  getLayout: (page: ReactElement) => ReactElement;
} = () => <BrandManualPage />;
BrandManualRoute.getLayout = (page) => <Layout>{page}</Layout>;
export default BrandManualRoute;
