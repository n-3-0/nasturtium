import { addRoute } from "../../libraries/routing/router";
import { createLazy } from "nasturtium/extensions/react/deferred-component";

const { EachTupleDemo } = createLazy(() => import("./index"), "EachTupleDemo");

export const EACH_TUPLE_DEMO = addRoute("/each-tuple", {
    element: <EachTupleDemo />
});
