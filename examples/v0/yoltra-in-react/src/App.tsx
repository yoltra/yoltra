import { createBrowserRouter, RouterProvider } from "react-router";

import { YoltraTodoPage } from "./components/yoltra/YoltraTodoPage";

import { Provider as RtkProvider } from "react-redux";
import { Layout } from "./components/layout/Layout.component";
import { ReduxTodoPage } from "./components/redux/ReduxTodoPage";
import { Home } from "./pages/Home.page";
import { store as rtkStore } from "./state/redux";

function YoltraRoute() {
  // No Provider — createYoltra's hooks default to the store.
  return <YoltraTodoPage />;
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
      { path: "/yoltra", element: <YoltraRoute /> },
      { path: "/redux", element: <RtkRoute /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
