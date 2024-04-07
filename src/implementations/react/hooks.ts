import { useEffect, useMemo } from "react";
import { InferPrimitive, PrimitiveState, createPrimitive, isPrimitiveState } from "../../types/primitive";
import { ObjectState, createObject, isObjectState } from "../../types/object";
import { TupleState, createTuple } from "../../types/tuple";
import { createComputed } from "../../types/computed";
import { createBox } from "../../types/box";
import { Signal } from "../../types/signal";
import { Timer } from "../../types/timer";
import { reactive } from "../../reactive";

/** @reactive */
export function usePrimitive<T = any>(
    initialValue?: T
): T extends PrimitiveState ? InferPrimitive<T> : PrimitiveState<T> {
    if(isPrimitiveState(initialValue)) {
        return initialValue.value;
    }

    return useMemo(() => createPrimitive(initialValue) as any, []);
}

/** @reactive */
export function useObject<T extends object = {}>(
    initialValue?: T
): T extends ObjectState ? T["_type"] : T {
    if(isObjectState(initialValue)) {
        return initialValue.use() as any;
    }

    return useMemo(() => createObject(initialValue || {}) as any, []);
}

export type Toggle = PrimitiveState<boolean> & { toggle(): boolean };

/**
 * Creates a simple stateful toggle
 * @reactive
 */
export function useToggle(initialValue = false) {
    return useMemo(() => {
        const primitive = createPrimitive(initialValue) as Toggle;
        primitive.toggle = () => primitive.set(value => !value);
        return Object.freeze(primitive);
    }, []);
}

type Effect = () => (() => void) | void;
/**
 * React's useEffect() with reactivity to state
 * @reactive
 */
export function useEffective(effect: Effect, deps: any[]) {
    useEffect(() => {
        const hook = reactive(effect);

        return () => {
            hook.current?.();
            hook.agent.cleanup();
        };
    }, [deps]);
}

/**
 * Subscribes a React component to a given Signal
 * @reactive
 */
export function useSignal<T = any>(signal: Signal<T>) {
    return signal.use();
}

/**
 * Subscribes a React component to a given Timer
 * @reactive
 */
export function useTimer<T extends number = -1>(timer: Timer<T>) {
    timer.use();
}

export function useBox<T = any>(initialValue?: (() => T) | T) {
    return useMemo(() => createBox<T>(typeof initialValue === "function" ? (initialValue as any)() : initialValue), []);
}

export function useComputed<T = any>(memo: () => T, deps: any[] = []) {
    return useMemo(() => createComputed(memo, true), deps);
}

/** Almost always, you'll actually want a Tuple in a React context */
export function useArray<T extends any[] = any[]>(
    initialValue?: (() => T) | T
) {
    return useMemo<TupleState<T>>(() => createTuple(
        typeof initialValue === "function" ? initialValue() : initialValue
    ), []);
}
