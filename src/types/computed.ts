import { makeAgent } from "../agent";
import { IDENT, STATE, INTERNALS, COMPARATOR, State, getNextId } from "../constants";
import { Reaction, addReaction, handleSubscription, useAgent, trigger } from "../manifold";
import * as comparators from "../comparator";
import { PriorityLane } from "../queue";
import { isPromise } from "../utilities";

export interface ComputedState<T = any> extends State {
    readonly [STATE]: "computed";

    /** @reactive */
    get value(): T;

    get(): T;

    observe(reaction: Reaction<T>): () => void;

    /** @reactive Will be reactive if no reaction func is provided */
    use(): T;
    use(reaction?: Reaction<T>): void;

    refresh(): T;

    makeComputed<U = any>(func: (value: T) => U, eager?: boolean, awaitPromise?: boolean): ComputedState<U>;
}

export function isComputedState(obj: any): obj is ComputedState {
    return obj?.[STATE] === "computed";
}

export function getComputedInternals(state: ComputedState<any>) {
    return state[INTERNALS];
}

export const ComputedAccessor = {
    inert: <T = any>(state: ComputedState<T>) => state.get(),
    reactive: <T = any>(state: ComputedState<T>) => state.value
};

export type Computer<T> = PromiseMemoizer<T> | Memoizer<T> | DeferredMemoizer<T>;
export type Memoizer<T> = (previousValue?: T) => T;
export type DeferredMemoizer<T> = (resolve: (value: T) => void, previousValue?: T) => void;
export type PromiseMemoizer<T> = (previousValue?: T) => Promise<T>;

export function isDeferredMemoizer(obj: any): obj is DeferredMemoizer<any> {
    return typeof obj === "function" && obj.length === 2;
}

// TODO: Recalculate in parallel, not in sequence, with dependency changes
// This would allow a chain of computed values to recalculate all "at the same time", leading to only one update for one dependency change
export function createComputed<T = any>(memoizer: Computer<T>, eager = false, awaitPromise = true): ComputedState<T> {
    const id = getNextId();
    let _value, first = true;
    let comparator = comparators.eqeqeq<T>;

    const memoized = wrapMemoizer();

    const agent = makeAgent(() => memoized(), {
        priority: PriorityLane.COMPUTED
    });

    function wrapMemoizer() {
        if(isDeferredMemoizer(memoizer)) {
            return () => {
                const cleanup = useAgent(agent);
                memoizer(result => {
                    cleanup();

                    if(comparator(_value, result)) return;

                    _value = result;
                    if(first) return;

                    trigger(id, result);
                }, _value);
            }
        }

        return () => {
            const cleanup = useAgent(agent);
            const result: any = memoizer(_value);

            if(!isPromise(result) || !awaitPromise) {
                cleanup();
                if(comparator(_value, result)) return;

                _value = result;
                if(first) return;

                trigger(id, result);
                return ;
            }

            result.then(result => {
                cleanup();
                if(comparator(_value, result)) return;

                _value = result;
                if(first) return;

                trigger(id, result);
            });
        };
    }

    if(eager) {
        memoized();
        first = false;
    }

    const computed: any = Object.freeze({
        [STATE]: "computed",
        [IDENT]: id,
        [INTERNALS]: { id, agent, callMemoizer: memoized },

        get [COMPARATOR]() { return comparator },
        set [COMPARATOR](func) { comparator = func },

        get() {
            if(first) {
                memoized();
                first = false;
            }

            return _value;
        },

        get value() {
            if(first) {
                memoized();
                first = false;
            }

            handleSubscription(id, {
                stateContainer: computed,
                id,
                get: () => _value
            });

            return _value;
        },

        observe(reaction: Reaction<T>) {
            if(first) {
                memoized();
                first = false;
            }

            return addReaction(id, reaction);
        },

        // TODO: Is this good enough?
        use(reaction?: Reaction<T>) {
            if(first) {
                memoized();
                first = false;
            }

            if(!reaction) {
                handleSubscription(id, {
                    stateContainer: computed,
                    id,
                    get: () => _value,
                });

                return _value;
            }

            reaction(_value, id);
            handleSubscription(id, {
                stateContainer: computed,
                id,
                get: () => _value
            });
        },

        makeComputed: (func, eager, awaitPromise) => createComputed(() => func(computed.value), eager, awaitPromise)
    });

    return computed;
}
