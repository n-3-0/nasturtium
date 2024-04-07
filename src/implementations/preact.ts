import { options } from "preact";
import { Cleanup, Refresher, StateBridge, setBridge } from "../manifold";
import { Agent, isAgent } from "../agent";

type VNode = {};

let _currentVnode: VNode = null as any;
let _currentTarget: VNode | null = null;
let _vnodeId = 0;

const oldBeforeDiff = options["_diff"];
const oldAfterDiff = options["diffed"];
const oldBeforeUnmount = options["unmount"];

options["_diff"] = vnode => {
    _currentVnode = vnode;
    oldBeforeDiff?.(vnode);
};

options["diffed"] = vnode => {
    oldAfterDiff?.(vnode);
    _currentVnode = null as any;
};

options["unmount"] = vnode => {
    oldBeforeUnmount?.(vnode);
    vnode[SUBSCRIPTIONS]?.forEach(cleanup => cleanup());
};

const SUBSCRIPTIONS = Symbol("subscriptions");
const REFRESHER = Symbol("refresher");
const ID = Symbol("elementid");
// Handle agents different since they are Object.freeze()'d
let agentRefreshers = new WeakMap<Agent, Refresher>();
let agentSubscriptions = new WeakMap<Agent, Map<number, Cleanup>>();

function shouldRegisterReaction(vnode) {
    return !!vnode && vnode !== _currentTarget;
}

export const implementation: StateBridge<VNode> = {
    cleanup: () => {
        // Dereference the old weak maps so they GC
        agentRefreshers = new WeakMap();
        agentSubscriptions = new WeakMap();
    },
    resolveTarget: () => _currentVnode,
    updateTarget: vnode => _currentTarget = vnode,
    shouldRegisterReaction,
    getSubscriptions: vnode => {
        if(isAgent(vnode)) {
            const subscriptions = agentSubscriptions.get(vnode) ?? new Map<number, Cleanup>();

            // TODO: Is this less performant than an if-then-set?
            agentSubscriptions.set(vnode, subscriptions);
            return subscriptions;
        }

        const subscriptions = vnode[SUBSCRIPTIONS] ?? new Map<number, Cleanup>();
        vnode[SUBSCRIPTIONS] = subscriptions;
        return subscriptions;
    },
    getRefresher: vnode => {
        const shouldUpdate = shouldRegisterReaction(vnode);

        if(isAgent(vnode)) {
            if(!shouldUpdate) return null;
            agentRefreshers.set(vnode, vnode.refresh);
            return vnode.refresh;
        }

        // TODO: Should we return a refresher?
        if(!shouldUpdate) {
            return vnode[REFRESHER] || null;
        }

        vnode[ID] = --_vnodeId;

        // TODO: Finish it lol

        return null;
    }
};

setBridge(implementation);
