import { addReaction, handleSubscription, trigger } from "../manifold";
import { COMPARATOR, IDENT, STATE, getNextId, type State } from "../constants";
import { ComputedState, createComputed } from "./computed";

export interface Pipeline<T extends Record<any, any> = Record<any, any>> extends State {
    readonly [STATE]: "pipeline";

    emit<K extends keyof T>(input: K, value: T[K]): void;
    /** @reactive */
    use<K extends keyof T>(input: K): T[K];

    observe<K extends keyof T>(input: K, reaction: (value: T[K]) => void): void;

    makeComputed<K extends keyof T, U = any>(
        key: K,
        func: (value: T[K]) => U,
        eager?: boolean,
        awaitPromise?: boolean
    ): ComputedState<U>;

    readonly lastValues: { [K in keyof T]?: T[K] | undefined; };
    readonly context: any;
}

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
        [STATE]: "pipeline",
        [IDENT]: -1,
        [COMPARATOR]: null,

        emit,
        get: () => lastValues,
        use: (key) => {
            if(!eventIds[key]) {
                eventIds[key] = getNextId();
            }

            handleSubscription(eventIds[key], {
                stateContainer: pipeline,
                id: eventIds[key],
                get: () => lastValues[key],
            });

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

    return pipeline;
}
