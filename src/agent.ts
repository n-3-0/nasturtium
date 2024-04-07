import { PriorityLane } from "./queue";
import type { Cleanup } from "./manifold";

const IS_AGENT = Symbol("agent");

export interface Agent {
    readonly [IS_AGENT]: true;

    readonly id: number;
    readonly cleanups: Map<number, Cleanup>;
    readonly priority: PriorityLane;

    before(): void;
    after(): void;

    refresh(): void;
    /** Note: This is not called automatically for agents */
    cleanup(): void;
    addCleanup(id: number, cleanup: Cleanup): void;
}

export const makeInertAgent = () => makeAgent(() => {}, { priority: PriorityLane.NORMAL });

type AgentOptions = {
    priority?: PriorityLane
    before: () => void;
    after: () => void;
    cleanup: () => void;
};

let _agentId = 0;
export function makeAgent<T = void>(refresh: () => T, options: Partial<AgentOptions> = {}) {
    const id = ++_agentId;

    const agent: Agent = {
        [IS_AGENT]: true,

        id: id,
        cleanups: new Map(),
        priority: options.priority || PriorityLane.NORMAL,

        refresh,

        addCleanup: (id, cleanup) => {
            agent.cleanups.set(id, cleanup);
        },

        before: () => { options.before?.() },
        after: () => { options.after?.() },
        cleanup: () => {
            agent.cleanups.forEach(cleanup => cleanup());
            agent.cleanups.clear();
            options.cleanup?.();
        }
    };

    return agent;
}

export function isAgent(obj: any): obj is Agent {
    return obj?.[IS_AGENT] === true;
}
