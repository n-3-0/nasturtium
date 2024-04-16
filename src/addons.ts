const addons = new Map<string, Set<Extender>>();

export type Extender = (state: any, internals: any) => void;

/**
 * Add a function that gets called on state create, giving you the ability to extend state behavior app-wide
 */
export function extend(type: string, extension: Extender) {
    addons.set(type, (addons.get(type) ?? new Set()).add(extension));
}

export function use(type: string, state: any, internals: any) {
    addons.get(type)?.forEach(handler => handler(state, internals));
}
