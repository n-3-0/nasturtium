import { addRoute } from "../../libraries/routing/router";
import { createLazy } from "nasturtium/extensions/react/deferred-component";

const { HomePage } = createLazy(() => import("./index"), "HomePage");

export const HOME = addRoute("/home", {
    element: <HomePage />
});
