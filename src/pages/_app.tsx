import "@assets/scss/custom.scss";
import "flatpickr/dist/flatpickr.min.css";

import Head from "next/head";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";

import { wrapper } from "../toolkit";

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function MyApp({ Component, pageProps, ...rest }: AppPropsWithLayout) {
  const { store } = wrapper.useWrappedStore(rest);
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>brillipoint.com</title>
      </Head>
      <Provider store={store}>{getLayout(<Component {...pageProps} />)}</Provider>
    </>
  );
}

