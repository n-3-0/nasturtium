import type { Cleanup } from "./manifold";

export type Extender = (state: any, internals: any) => void;

const addons = new Map<string, Set<Extender>>();

/**
 * Add a function that gets called on state create, giving you the ability to extend state behavior app-wide
 */
export function extend(type: string, extension: Extender): Cleanup {
    const repo = (addons.get(type) ?? new Set()).add(extension);
    addons.set(type, repo);

    return () => {
        repo.delete(extension);
    };
}

export function use(type: string, state: any, internals: any) {
    addons.get(type)?.forEach(handler => handler(state, internals));
}
