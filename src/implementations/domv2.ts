// A non-prototype-polluting version of dom.ts

import { Agent, makeAgent } from "../agent";
import { useAgent } from "../manifold"

export type ReactiveText = Text & {
    agent: Agent;
};

export type ReactiveElement<T extends HTMLElement> = T & {
    agent: Agent;
};

/**
 * Creates a reactive TextNode
 * @reactive
 */
export function text(value: () => any) {
    const agent = makeAgent(() => updateValue());
    const node = document.createTextNode("") as ReactiveText;
    node.agent = agent;

    function updateValue() {
        const cleanup = useAgent(agent);
        node.textContent = value();
        cleanup();
    }

    updateValue();

    return node;
}

const jsControlledAttributes = new Set(["checked", "type", "value", "textContent", "innerText"]);

/**
 * Reactively sets an element's attribute
 * @reactive
 */
export function attr(element: HTMLElement, attribute: string, value: () => any) {
    const agent = makeAgent(() => updateValue());

    const useDom = !jsControlledAttributes.has(attribute);
    function updateValue() {
        const cleanup = useAgent(agent);
        const newValue = value();

        if(useDom) {
            element.setAttribute(attribute, newValue);
        } else {
            element[attribute] = newValue;
        }

        cleanup();
    }

    updateValue();
    return agent;
}
/**
 * Create an element with a reactive callback to modify it
 */
export function elem<T extends keyof HTMLElementTagNameMap>(
    type: T,
    modifier: (element: HTMLElementTagNameMap[T]) => void
) {
    const element = document.createElement(type) as ReactiveElement<HTMLElementTagNameMap[T]>;
    const agent = makeAgent(() => callModifier());

    element.agent = agent;

    function callModifier() {
        const cleanup = useAgent(agent);
        modifier(element);
        cleanup();
    }

    callModifier();
    return element;
}

/**
 * Execute reactive code upon an existing element
 */
export function wrap<T extends HTMLElement>(
    element: T,
    modifier: (element: T) => void
): ReactiveElement<T> {
    if(!element) return element;

    const elem = element as ReactiveElement<T>;
    const agent = makeAgent(() => callModifier());
    elem.agent = agent;

    function callModifier() {
        const cleanup = useAgent(agent);
        modifier(element);
        cleanup();
    }

    callModifier();
    return elem;
}
