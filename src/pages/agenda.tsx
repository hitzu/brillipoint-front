import type { ReactElement } from "react";
import type { NextPage } from "next";
import Layout from "@layout/index";
import { AgendaPage } from "../features/booking-agenda/pages/AgendaPage";

const AgendaRoute: NextPage & {
  getLayout: (page: ReactElement) => ReactElement;
} = () => <AgendaPage />;
AgendaRoute.getLayout = (page) => <Layout>{page}</Layout>;
export default AgendaRoute;
