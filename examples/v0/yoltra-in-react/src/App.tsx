import { createBrowserRouter, RouterProvider } from "react-router";

import { StoreProvider as QuoProvider } from "@yoltra/react";
import { store as duxStore } from "./state/yoltra";
import { yoltraTodoPage } from "./components/yoltra/yoltraTodoPage";

import { Provider as RtkProvider } from "react-redux";
import { store as rtkStore } from "./state/redux";
import { ReduxTodoPage } from "./components/redux/ReduxTodoPage";
import { Layout } from "./components/layout/Layout.component";
import { Home } from "./pages/Home.page";

function QuoRoute() {
  return (
    <QuoProvider store={duxStore}>
      <yoltraTodoPage />
    </QuoProvider>
  );
}

function RtkRoute() {
  return (
    <RtkProvider store={rtkStore}>
      <ReduxTodoPage />
    </RtkProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/yoltra", element: <QuoRoute /> },
      { path: "/redux", element: <RtkRoute /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
