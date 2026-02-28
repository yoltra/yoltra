import { createBrowserRouter, RouterProvider } from "react-router";

import { StoreProvider as QuoProvider } from "@yoltra/react";
import { YoltraTodoPage } from "./components/yoltra/YoltraTodoPage";
import { store as duxStore } from "./state/yoltra";

import { Provider as RtkProvider } from "react-redux";
import { Layout } from "./components/layout/Layout.component";
import { ReduxTodoPage } from "./components/redux/ReduxTodoPage";
import { Home } from "./pages/Home.page";
import { store as rtkStore } from "./state/redux";

function QuoRoute() {
  return (
    <QuoProvider store={duxStore}>
      <YoltraTodoPage />
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
