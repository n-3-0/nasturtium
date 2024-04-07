// This file is the only reason why we use React internals. It will magically subscribe components to any changes in the
// state instances by using WeakMaps between fibers and various elements of a subscription state.
// The internals we use have been stable for seven years, and if they change, it should be trivial to update

/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useReducer } from "react";
import { StateBridge, SubscriptionRequest, addReaction, setBridge } from "../manifold";
import { Agent, makeAgent } from "../agent";

// TODO: Investigate if there's a similar, React-y way to do what we do in this file
const { ReactCurrentOwner } = React["__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED"];

// I prefer to have well-named types for generic substitution
export type ReactFiber = {
    /**
     * Class components have a stateNode, function components do not
     */
    stateNode?: any;
    type: any;
};

// We have to do WeakMap association between FiberNodes and stateful data, since fibers get Object.freeze(). Using a
// WeakMap allows the fiber to be garbage collected without special care on our end, preventing memory leaks.
let fiberAgents = new WeakMap<ReactFiber, Agent>();

let _target: ReactFiber | Agent | null = null;

function cleanup() {
    // Dereference the old weak maps so they GC
    fiberAgents = new WeakMap();
}

function resolveTarget() {
    return ReactCurrentOwner.current;
}

// Register the reducer/effect only if there is a fiber, and it hasn't yet been processed by a previous state getter.
// This prevents multiple reducer/effects per component, which is overall better for performance than all the logic we
// create with this state library... hopefully.
function shouldRegisterReaction(fiber) {
    return !!fiber && _target !== fiber;
}

function handleFunctionComponent(id: number, fiber: any, agent?: Agent) {
    const refresher = useReducer(() => ({}), {})[1];
    useEffect(() => {
        // Reset currentFiber in case we do any weird stuff
        _target = null;

        // Call all the cleanup functions for this fiber's subscriptions since updated fibers get recreated instead
        // of reused.
        return () => {
            agent?.cleanup();
        };
    }, []);

    if(!agent) {
        agent = makeAgent(() => {
            // I hate that these !'s are required, because they are defined ONE LINE ABOVE THEIR REFERENCE
            agent!.cleanup();
            agent!["hook"]();
        });

        fiberAgents.set(fiber, agent);
    }

    // Always set the refresher to latest, just in case!
    agent["hook"] = refresher;
    agent.addCleanup(id, addReaction(id, agent.refresh, agent.priority));
}

function handleClassComponent(id: number, fiber: any, agent?: Agent) {
    if(!agent) {
        agent = makeAgent(() => fiber.stateNode.forceUpdate());
        fiberAgents.set(fiber, agent);
    }

    const didMount = fiber.stateNode.componentDidMount?.bind(fiber.stateNode);
    const willUnmount = fiber.stateNode.componentWillUnmount?.bind(fiber.stateNode);

    // TODO: See if class components need special refresher treatment like function components
    fiber.stateNode.componentDidMount = () => {
        _target = null;
        didMount?.();
    };

    fiber.stateNode.componentWillUnmount =  () => {
        agent?.cleanup();
        willUnmount?.();
    };

    agent?.addCleanup(id, addReaction(id, agent.refresh, agent.priority));
}

function handleSubscription({
    id, override // TODO: Context arg?
}: SubscriptionRequest) {
    if(override) {
        if(_target === override) return null;

        override.addCleanup(id, addReaction(id, override.refresh, override.priority));

        _target = override;
        return;
    }

    const fiber = resolveTarget();
    let agent = fiberAgents.get(fiber)!;
    const shouldUpdate = shouldRegisterReaction(fiber);

    if(!shouldUpdate) {
        agent?.addCleanup(id, addReaction(id, agent.refresh, agent.priority));
        return;
    }

    _target = fiber;

    // Class component
    if(fiber.stateNode) {
        return handleClassComponent(id, fiber, agent);
    }

    // Function component
    return handleFunctionComponent(id, fiber, agent);
}

(window as any).fiberAgents = fiberAgents;

// TODO: Support Suspense, StrictMode
export const implementation: StateBridge<ReactFiber> = {
    cleanup,
    handleSubscription,
}

setBridge(implementation);
