import React from "react";
const { ReactCurrentOwner } = React["__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"];

type ReactFiber = {} & any;

export function resolveFiber(): ReactFiber {
    return ReactCurrentOwner.current;
}
