import { addReaction, processDependents, trigger } from "../manifold";
import { IDENT, STATE, COMPARATOR, State, getNextId } from "../constants";
import { createComputed, type ComputedState } from "./computed";
import * as addons from "../addons";

import type { $Timer } from "./timer.extensions";

export type Timer<T extends number> = State & {
    readonly [STATE]: "timer";
    readonly [COMPARATOR]: null;

    start(): void;
    stop(): void;
    toggle(): void;
    /** @reactive */
    use(): void;
    /** @inert */
    get(): any;

    /**
     * Subscribe an explicit trigger with a cleanup handler
     * @returns Cleanup function to unsubscribe
     */
    observe(trigger: () => void): () => void;

    makeComputed<U = any>(func: (previousValue?: U) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;

    /** @inert */
    readonly interval: T;
    /** @inert */
    readonly autostart: boolean;
    /** @inert */
    readonly immediate: boolean;
    /** @reactive */
    readonly running: boolean;

    isRunning(): boolean;
} & $Timer<T>;

export function isTimer(src: any): src is Timer<number> {
    return src?.[STATE] === "timer";
}

export function createTimer<T extends number>(
    interval: T,
    autostart = false,
    immediate = false
): Timer<T> {
    const id = getNextId();
    const pauseStateId = getNextId();

    const boost = () => trigger(id);
    let _interval;

    if(autostart) {
        _interval = setInterval(boost, interval);

        if(immediate) {
            boost();
        }
    }

    const timer = {
        [STATE]: "timer" as const,
        [IDENT]: id,
        [COMPARATOR]: null,

        interval,
        autostart,
        immediate,

        get running() {
            processDependents(pauseStateId);
            return !!_interval;
        },

        isRunning: () => !!_interval,
        get: () => interval,

        toggle: () => {
            if(_interval) return timer.stop();
            return timer.start();
        },

        start: () => {
            if(_interval) return;

            _interval = setInterval(boost, interval);
            if(immediate) boost();

            trigger(pauseStateId, true);
        },

        stop: () => {
            if(!_interval) return;
            clearInterval(_interval);
            trigger(pauseStateId, false);
        },

        use: () => processDependents(id),
        makeComputed: (func, eager, awaitPromise) => createComputed(previous => (timer.use(), func(previous)), eager, awaitPromise),
        observe: reaction => addReaction(id, reaction)
    };

    addons.use("timer", timer, {});

    return timer;
}
