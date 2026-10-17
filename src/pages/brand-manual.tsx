import type { ReactElement } from "react";
import type { NextPage } from "next";
import NonLayout from "@layout/NonLayout";
import withAuth from "../middleware/authGuard";
import { BrandManualPage } from "../features/brand-manual/pages/BrandManualPage";

// Full screen to review the manual comfortably, but still behind the session
// guard the admin layout normally provides.
const PrivateFullScreen = withAuth(NonLayout);

const BrandManualRoute: NextPage & {
  getLayout: (page: ReactElement) => ReactElement;
} = () => <BrandManualPage />;
BrandManualRoute.getLayout = (page) => <PrivateFullScreen>{page}</PrivateFullScreen>;
export default BrandManualRoute;
