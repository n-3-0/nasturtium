// The Manifold handles IO across states and subscriptions, and has an abstraction system so different UI libraries can
// use the same library (e.g. React, Vue, and plain DOM JS)

import { Agent, makeInertAgent } from "./agent";
import { implementation as basicImplementation } from "./implementations/basic";
import { PriorityLane, hasNext, queueNext, runNext } from "./queue";

// While Cleanup/Refresher are identical signatures, they are semantically different, so I define both.
export type Cleanup = () => void;
export type Refresher = () => void;
export type Reaction<T = any> = (value: T, stateId: number) => void;

const reactions = new Map<number, Set<Reaction>>();
let priorities = new WeakMap<any, PriorityLane>();

export function addReaction(id: number, reaction: Reaction, priority = PriorityLane.NORMAL) {
    const set = (reactions.get(id) || new Set()).add(reaction);
    reactions.set(id, set);
    priorities.set(reaction, priority);

    return () => {
        set.delete(reaction);
    };
}

export function clear(id: number) {
    reactions.delete(id);
}

export function trigger(id: number, value?: any) {
    if(_triggerCapture) {
        _triggerCapture[id] = value;
        return;
    }

    return propagate(id, value);
}

export function propagate(id: number, value?: any) {
    reactions.get(id)?.forEach(trigger => {
        queueNext(id, value, trigger, priorities.get(trigger) || PriorityLane.NORMAL);
    });

    if(!iterating) {
        iterating = true;
        processReactions();
    }
}

let iterating = false;
function processReactions() {
    while(hasNext()) {
        runNext();
    }

    iterating = false;
}

// TODO: Is there a way to do this in order? Does that matter?
let _triggerCapture: Record<number, any> | null = null;
type CommitBatch = () => void;

export function beginBatch(): CommitBatch {
    _triggerCapture = {};

    return () => {
        Object.entries(_triggerCapture!).forEach(([ id, value ]) => propagate(id as any, value));
        _triggerCapture = null;
    };
}

export function rejectBatch() {
    _triggerCapture = null;
}

export function isBatching() {
    return !!_triggerCapture;
}

export interface SubscriptionRequest {
    id: number;
    context?: any;
    override: Agent | null;
}

export type StateBridge<T = any> = {
    cleanup(): void;
    resolveTarget(context?: any): T;
    updateTarget(target: T): void;
    getSubscriptions(target: T): Map<number, Cleanup>;
    shouldRegisterReaction(target: T): boolean;
    getRefresher(target: T, subscriptions: Map<number, Cleanup>): Refresher | null;

} | {
    handleSubscription(req: SubscriptionRequest): void;
    cleanup(): void;
};

let bridge: StateBridge<any> = basicImplementation;

export function setBridge(implementation: StateBridge) {
    bridge = implementation;
}

export function cleanup() {
    bridge.cleanup();
    reactions.clear();
    priorities = new WeakMap();
}

const activeAgentStack: Agent[] = [];
export function useAgent(agent = makeInertAgent()) {
    activeAgentStack.push(agent);
    agent.before();

    return () => {
        agent.after();
        // An agent can be pushed multiple times, so we only want to strip the most recent invocation, hence lastIndexOf
        activeAgentStack.splice(activeAgentStack.lastIndexOf(agent), 1);
    };
}

export function resolveAgent() {
    return activeAgentStack.at(-1) || null;
}

export function processDependents(id: number, context?: any) {
    if('handleSubscription' in bridge) { // Type guard
        return bridge.handleSubscription({ id, context, override: resolveAgent() });
    }

    const target = resolveAgent() || bridge.resolveTarget(context);
    if(!target) return;

    const subscriptions = bridge.getSubscriptions(target);
    const refresher = bridge.getRefresher(target, subscriptions);

    if(refresher) {
        // Register the reaction / cleanup with the Manifold so state changes refresh the component by calling the
        // updater we defined in useReducer above
        // console.log(`Subscribing ${target.type.name} to ${id}`);
        subscriptions.set(id, addReaction(id, refresher));
    }

    // Set the current target AFTER initializing all the logic. This ensures every reactive target has only one
    // reducer/effect combo for React, even though it could react to any number of state instances
    bridge.updateTarget(target);
}
