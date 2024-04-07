import React from "react";

import { createBox } from "../../types/box";

export type DeferredOptions = {
    eager?: boolean;
    fallback?: React.ReactNode;
}

type HasOwnFunc = (obj: any, key: string) => boolean;

const SKELETON = React.forwardRef(() => null);
const hasOwn: HasOwnFunc = Object["hasOwn"] ?? ((obj = {}, key = "") => !!obj?.hasOwnProperty(key));

/** Really simple wrapper for React.lazy for non-default exports */
export function createLazy<T, K extends keyof T>(
    provider: () => Promise<T>,
    ...names: K[]
) {
    return names.reduce((exports, name) => {
        exports[name] = React.lazy(() => provider().then(result => ({ default: result[name] }) as any)) as T[K];
        return exports;
    }, {} as Record<K, T[K]>);
}

export function createDeferredComponent<T = any>(
    provider: () => Promise<T>,
    {
        eager = false,
        fallback = null
    }: DeferredOptions = {}
): T {
    let cached = createBox<any>(SKELETON);

    if(eager) {
        provider().then(result => (cached.set(result), result));
    } else {
        const loader = () => provider().then(x => hasOwn(x, "default") ? x : ({ default: x })) as any;
        cached.set(React.lazy(loader));
    }

    if(fallback) {
        return React.forwardRef(function DeferredComponent(props, ref) {
            const Component = cached.use();

            return (
                <React.Suspense fallback={fallback}>
                    <Component ref={ref} {...props} />
                </React.Suspense>
            );
        }) as T;
    }

    return React.forwardRef(function DeferredComponent(props, ref) {
        const Component = cached.use();

        return (
            <Component ref={ref} {...props} />
        );
    }) as T;
}
