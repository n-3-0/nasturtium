import { addReaction, handleSubscription, trigger } from "../manifold";
import { IDENT, STATE, COMPARATOR, State, getNextId } from "../constants";
import { createComputed, type ComputedState } from "./computed";

export interface Timer<T extends number> extends State {
    start(): void;
    stop(): void;
    toggle(): void;
    /** @reactive */
    use(): void;
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
}

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

    const timer = Object.freeze({
        [STATE]: "timer",
        [IDENT]: id,
        [COMPARATOR]: null,

        interval,
        autostart,
        immediate,

        get running() {
            handleSubscription(pauseStateId, {
                stateContainer: timer,
                id: pauseStateId,
                get: () => !!_interval,
            });

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

        use: () => {
            handleSubscription(id, {
                stateContainer: timer,
                id,
                get: () => {},
            });
        },

        makeComputed: (func, eager, awaitPromise) => createComputed(previous => (timer.use(), func(previous)), eager, awaitPromise),
        observe: reaction => addReaction(id, reaction)
    });

    return timer;
}
