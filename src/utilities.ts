export function isPromise<T = any>(obj: any): obj is Promise<T> {
    return typeof obj?.["then"] === "function";
}

export type Wrapped<T = any, U = {}> = Readonly<U> & { readonly current: T };

export function wrap<T, U = {}>(get: () => T, other: U = {} as U): Wrapped<T, U> {
    const wrapper = { ...other } as Wrapped<T, U>;
    Object.defineProperty(wrapper, "current", { get });
    return Object.freeze(wrapper);
}

/** Delay an async scope by a specified number of milliseconds */
export function wait(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}
