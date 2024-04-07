import { MainLayout } from "./components/layout/MainLayout";
import { Redirect, addRoute } from "./libraries/routing/router";

export * from "./pages/home/routes";

export const ROOT = addRoute("/", {
    template: (
        <MainLayout />
    ),
    element: (
        <Redirect to="/home" replace />
    )
});
