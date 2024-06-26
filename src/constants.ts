import type { Comparator } from "./comparator";

let _stateId = 0;
export function getNextId() {
    return ++_stateId;
}

// Please be gentle
export const STATE = Symbol("state");
export const IDENT = Symbol("identity");
export const INTERNALS = Symbol("internals");
export const COMPARATOR = Symbol("comparator");

export interface State {
    readonly [STATE];
    readonly [IDENT];
}

export function isStateful(src: any): src is State {
    return !!src?.[STATE];
}

export function getStateType(src: any): string | null {
    if(!isStateful(src)) return null;

    return src[STATE];
}

export function getStateId(src: any): number | null {
    if(!isStateful(src)) return null;

    return src[IDENT];
}

export function setComparator<S extends State, T = any>(state: S, comparator: Comparator<T>) {
    state[COMPARATOR] = comparator;
    return state;
}
