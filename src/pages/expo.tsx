import type { ReactElement } from "react";
import NonLayout from "@layout/NonLayout";
import { ExpoBebePage } from "../features/expo-bebe/pages/ExpoBebePage";

const Expo = () => <ExpoBebePage />;

Expo.getLayout = (page: ReactElement) => <NonLayout>{page}</NonLayout>;

export default Expo;
