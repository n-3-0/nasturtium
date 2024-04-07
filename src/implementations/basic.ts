import { Agent, isAgent } from "../agent";
import { StateBridge, SubscriptionRequest, addReaction } from "../manifold";

let _target: any = null;

// By default, if there is no agent, this will be called, so just return nothing
function resolveTarget() {
    return _target;
}

// TODO: Second condition might not be necessary for default reactivity
function shouldRegisterReaction(target) {
    return isAgent(target) && target !== _target;
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

    const target = resolveTarget() as Agent;
    const shouldUpdate = shouldRegisterReaction(target);

    if(!shouldUpdate) {
        target?.addCleanup(id, addReaction(id, target.refresh, target.priority));
        return;
    }

    target.addCleanup(id, addReaction(id, target.refresh, target.priority));
    _target = target;
}

// Just enough to prevent errors and support agents
export const implementation: StateBridge<Agent> = {
    cleanup() {
        _target = null;
    },
    handleSubscription,
};
