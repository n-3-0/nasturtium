import { Cleanup } from "nasturtium/manifold";
import { createPrimitive, PrimitiveState } from "nasturtium/types/primitive";
import { isWorker, type Disposable } from "./_internal";

export function syncPrimitive<T>(name: string): Promise<Disposable<PrimitiveState<T>>>
export function syncPrimitive<T>(name: string, state: PrimitiveState<T>, worker: Worker): Cleanup
export function syncPrimitive<T>(name: string, state?: PrimitiveState<T>, worker?: Worker) {
    if(isWorker && state) {
        throw new Error("Primitives can only be synced from main thread to workers!");
    }

    const messageKey = `$state:primitive:${name}`;
    let cached: T, timeout, next;

    function onReceiveMessage(e: MessageEvent) {
        if(typeof e.data !== "object") return;
        if(!Object.hasOwn(e.data, messageKey)) return;

        if(next) {
            return next(e.data[messageKey], e);
        }

        e.preventDefault();
        e.stopImmediatePropagation();
        state!.value = (cached = e.data[messageKey]);
    }

    if(state && worker) {
        cached = state.get();
        worker.addEventListener("message", onReceiveMessage);

        const cleanup = state.observe(value => {
            if(value === cached) return;

            cached = value;
            worker.postMessage({ [messageKey]: value });
        });

        worker.postMessage({
            [messageKey]: { name, initialValue: cached }
        });

        return cleanup;
    }

    addEventListener("message", onReceiveMessage);

    if(!worker) {
        return new Promise((resolve, reject) => {
            timeout = setTimeout(() => reject("Could not sync primitive"), 5000);
            next = payload => {
                if(payload.name !== name) return;
                next = null;

                clearTimeout(timeout);
                state = createPrimitive(payload.initialValue);

                const cleanup = state.observe(value => {
                    if(value === cached) return;

                    cached = value;
                    postMessage({ [messageKey]: value });
                });

                state["cleanup"] = cleanup;

                return resolve(state);
            };
        });
    }
}
