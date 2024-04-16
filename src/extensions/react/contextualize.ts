import "./contextualize.globals.d.ts";
import * as addons from "nasturtium/addons";

import React from "react";

const injectCtxViaState = (stateType: string) => addons.extend(stateType, state => {
    const context = React.createContext(state);
    Object.defineProperty(state, "context", { value: context, configurable: false });
});

const injectStateViaInternals = (stateType: string) => addons.extend(stateType, (state, internals) => {
    const context = React.createContext(state);
    Object.defineProperty(internals, "context", { value: context, configurable: false });
});

injectCtxViaState("primitive");
injectCtxViaState("computed");
injectCtxViaState("box");
injectCtxViaState("pipeline");
injectCtxViaState("resource");
injectCtxViaState("semaphore");
injectCtxViaState("signal");
injectCtxViaState("stator");
injectCtxViaState("timer");
injectStateViaInternals("object");
injectStateViaInternals("map");
injectStateViaInternals("tuple");
