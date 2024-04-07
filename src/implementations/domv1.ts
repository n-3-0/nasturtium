//! This is more a proof of concept than an actual implementation, do not trust it for production apps.
// Adds reactivity to DOM elements, pretty neat!
import { Agent, isAgent } from "../agent";
import { Cleanup, Refresher, StateBridge, setBridge } from "../manifold";

const _setAttribute = HTMLElement.prototype.setAttribute;
const _appendChild = HTMLElement.prototype.appendChild;

HTMLElement.prototype["_setAttribute"] = _setAttribute;
HTMLElement.prototype["_appendChild"] = _appendChild;

let _currentElement: any = null;
let _targetElement: any = null;
let _targetContext: any = null;

// Really hacky way through access pattern:
// 1. setAttribute
// 2. access state
// 3. call setAttribute
Object.defineProperty(HTMLElement.prototype, "setAttribute", {
    get() {
        _targetElement = this;
        return this["_setAttribute"];
    },
    set(v) {
        this["_setAttribute"] = v;
    }
});

Object.defineProperty(HTMLElement.prototype, "appendChild", {
    get() {
        _targetElement = this;
        return this["_appendChild"];
    },
    set(v) {
        this["_appendChild"] = v;
    }
});

HTMLElement.prototype.setAttribute = function(key, value) {
    if(_currentElement === this) {
        if(!this["reactiveProps"]) {
            this["reactiveProps"] = new Map<string, any>();
        }

        if(!this["reactiveProps"].has(key)) {
            this["reactiveProps"].set(key, _targetContext);
        }
    }

    _targetElement = null;
    _currentElement = null;
    _targetContext = null;

    return _setAttribute.call(this, key, value);
};

HTMLElement.prototype.appendChild = function(child) {
    if(_currentElement !== this) {
        _targetElement = null;
        _currentElement = null;
        _targetContext = null;

        return _appendChild.call(this, child);
    }

    const container = document.createTextNode(child);
    this["statefulChild"] = container;
    this["statefulChildContext"] = _targetContext;

    _targetElement = null;
    _currentElement = null;
    _targetContext = null;

    return _appendChild.call(this, container);
};

const SUBSCRIPTIONS = Symbol("state");
const REFRESHER = Symbol("refresher");
const ID = Symbol("elementid");
// Handle agents different since they are Object.freeze()'d
let agentRefreshers = new WeakMap<Agent, Refresher>();
let agentSubscriptions = new WeakMap<Agent, Map<number, Cleanup>>();
let _elementId = 0;

function shouldRegisterReaction(element) {
    return !!element && _currentElement !== element;
}

export const implementation: StateBridge<HTMLElement> = {
    cleanup: () => {
        // TODO: Clean up DOM elements with subscriptions
        // Dereference the old weak maps so they GC
        agentRefreshers = new WeakMap();
        agentSubscriptions = new WeakMap();
    },
    resolveTarget: context => {
        if(context) {
            _targetContext = context;
        }

        return _targetElement;
    },
    shouldRegisterReaction,
    getRefresher: element => {
        const shouldUpdate = shouldRegisterReaction(element);

        if(isAgent(element)) {
            if(!shouldUpdate) return null;
            agentRefreshers.set(element, element.refresh);
            return element.refresh;
        }

        // TODO: Should we return a refresher?
        if(!shouldUpdate) {
            return element[REFRESHER] || null;
        }

        element[ID] = --_elementId;

        element[REFRESHER] = (_, stateId) => {
            // React Fibers get replaced on every change, elements do not.
            // subscriptions.forEach(cleanup => cleanup());

            if(element["statefulChildContext"]?.id === stateId) {
                const { get } = element["statefulChildContext"];
                if(!get) {
                    console.warn("Stateful child context does not have getter!");
                }

                element["statefulChild"].textContent = get?.();
                return;
            }

            for(const [ key, { get } ] of element["reactiveProps"]) {
                if(!get) {
                    console.warn("Reactive prop context does not have getter!");
                }

                element.setAttribute(key, get?.());
            }
        };

        return element[REFRESHER];
    },
    getSubscriptions: element => {
        if(isAgent(element)) {
            const subscriptions = agentSubscriptions.get(element) ?? new Map<number, Cleanup>();

            // TODO: Is this less performant than an if-then-set?
            agentSubscriptions.set(element, subscriptions);
            return subscriptions;
        }

        if(!element[SUBSCRIPTIONS]) {
            element[SUBSCRIPTIONS] = new Map<number, Cleanup>();
        }

        return element[SUBSCRIPTIONS];
    },
    updateTarget: element => {
        _currentElement = element;
    },
};

setBridge(implementation);
