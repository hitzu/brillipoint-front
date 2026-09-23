import { ReactElement } from "react";
import Layout from "@layout/index";
import { CreateContractPage } from "../features/contracts-add/pages/CreateContractPage";

const ContractsAddPage = () => <CreateContractPage />;

ContractsAddPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContractsAddPage;
