import React from "react";
import { PrimitiveState, createPrimitive } from "../../types/primitive";
// import ReactDOM from "react-dom/client"

let implementation;

export function setReconciler(reconciler) {
    implementation = reconciler;
}

// const root = ReactDOM.createRoot(document.body);

/**
 * Run a function allowing for all standard React hooks to work
 * Essentially emulates a function component and behaves like a computed
 */
export function runHooks<T = any>(handler: () => T) {
    if(!implementation) throw new Error("React Reconciler required! Call setReconciler first!");

    const root = implementation.createRoot({
        nodeType: 11,
        addEventListener: () => {},
        ownerDocument: null,
    });

    const state = createPrimitive<T>() as PrimitiveState<T> & { dispose(): void };
    state.dispose = () => {
        console.log(root);
    }

    function FakeComponent() {
        state.value = handler();
        return null;
    }

    const frag = React.createElement(FakeComponent, {});
    root.render(frag);

    return state;
}

// export function useHook<T = any>(root: ReactDOM.Root, handler: () => T) {}
