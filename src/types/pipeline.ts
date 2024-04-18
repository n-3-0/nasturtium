import { addReaction, processDependents, trigger } from "../manifold";
import { COMPARATOR, IDENT, STATE, getNextId, type State } from "../constants";
import { ComputedState, createComputed } from "./computed";
import * as addons from "../addons";

import type { $Pipeline } from "./pipeline.extensions";

export type Pipeline<T extends Record<any, any> = Record<any, any>> = State & {
    readonly [STATE]: "pipeline";
    readonly [COMPARATOR]: null;

    emit<K extends keyof T>(input: K, value: T[K]): void;
    /** @reactive */
    use<K extends keyof T>(input: K): T[K];
    /** @inert */
    get(): T;

    observe<K extends keyof T>(input: K, reaction: (value: T[K]) => void): void;

    makeComputed<K extends keyof T, U = any>(
        key: K,
        func: (value: T[K]) => U,
        eager?: boolean,
        awaitPromise?: boolean
    ): ComputedState<U>;

    readonly lastValues: { [K in keyof T]?: T[K] | undefined; };
    readonly context: any;
} & $Pipeline<T>;

export function isPipeline(obj: any): obj is Pipeline {
    return obj?.[STATE] === "pipeline";
}

export function createPipeline<T extends Record<any, any> = Record<any, any>>(
    caller?: (
        emit: <K extends keyof T>(event: K, value?: T) => void,
        context: any
    ) => T
) {
    const eventIds = {} as any;
    const lastValues = {} as any;
    const context = {} as any;

    const emit = (key, value) => {
        if(!eventIds[key]) {
            eventIds[key] = getNextId();
        }

        lastValues[key] = value;
        trigger(eventIds[key], value);
    };

    caller?.(emit, context);

    const pipeline: Pipeline<T> = {
        [STATE]: "pipeline" as const,
        [COMPARATOR]: null,
        [IDENT]: -1,

        emit,
        get: () => lastValues,
        use: (key) => {
            if(!eventIds[key]) {
                eventIds[key] = getNextId();
            }

            processDependents(eventIds[key]);

            return lastValues[key];
        },

        observe: (key, reaction) => {
            if(!eventIds[key]) {
                eventIds[key] = getNextId();
            }

            return addReaction(eventIds[key], reaction);
        },

        makeComputed: (key, func, eager, awaitPromise) => createComputed(() => func(pipeline.use(key)), eager, awaitPromise),

        get lastValues() {
            return lastValues;
        },

        get context() {
            return context;
        }
    };

    addons.use("pipeline", pipeline, { caller, context });

    return pipeline;
}
