// Adds reactivity to DOM elements, pretty neat!
// TODO: Hook into replaceChild, replaceChildren, etc.

import "./globals.d.ts";

import { Agent, makeAgent } from "../../agent";
import { useAgent } from "../../manifold";

import "./elements/select";
import "./elements/textarea";

const _setAttribute = Element.prototype.setAttribute;
const _removeAttribute = Element.prototype.removeAttribute;
const _createTextNode = document.createTextNode;

const TEXT_CONTENT = Symbol("#textContent");

type ElementWithAgent = Element & {
    agents: {
        [key: string]: Agent;
        [TEXT_CONTENT]?: Agent;
    };
};

type TextWithAgent = Text & {
    agent: Agent;
};

document.createTextNode = (content) => {
    if(typeof content !== "function") return _createTextNode.call(document, content);

    const textNode = _createTextNode.call(document, "") as TextWithAgent;
    const agent = makeAgent(() => update());
    const update = () => {
        const cleanup = useAgent(agent);
        textNode.textContent = content();
        cleanup();
    };

    // Eager evaluate to match vanilla behavior
    update();

    textNode.agent = agent;
    return textNode;
}

const knownControlledAttributes = new Map<any, string[]>([
    [ "*", [] ],
    [ HTMLElement, ["contentEditable", "draggable", "hidden", "style", "title"] ],
    [ HTMLButtonElement, ["disabled", "type"] ],
    [ HTMLInputElement, ["disabled", "checked", "type", "value", "step", "required", "readOnly"] ],
    [ HTMLImageElement, ["src", "alt", "width", "height"] ],
    [ HTMLTextAreaElement, ["cols", "disabled", "readonly", "required", "value"] ], // Value polyfilled in elements/textarea.ts
    [ HTMLSelectElement, ["disabled", "multiple", "required", "value"] ], // Value polyfilled in elements/select.ts
    [ HTMLMeterElement, ["min", "max", "low", "high", "optimum", "value"] ],
    [ HTMLDialogElement, ["open"] ]
]);

knownControlledAttributes.forEach((props, element) => {
    const proto = element === "*" ? Element.prototype : element.prototype;

    for(const prop of props) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        if(!descriptor) continue;

        const { get, set } = descriptor;
        if(!get || !set) continue;

        Object.defineProperty(proto, prop, {
            get() {
                return get.call(this);
            },

            set(value) {
                if(typeof value !== "function")
                    return set.call(this, value);

                const self = this;
                const agent = makeAgent(() => update());
                const update = () => {
                    const cleanup = useAgent(agent);
                    self[prop] = value();
                    cleanup();
                };

                self.agents ??= {} as any;

                if(self.agents[prop]) {
                    self.agents[prop].cleanup();
                }

                self.agents[prop] = agent;
                update();
            }
        })
    }
});

Element.prototype.setAttribute = function(
    this: ElementWithAgent,
    attribute: string,
    content: (() => string) | string
) {
    if(typeof content !== "function") return _setAttribute.call(this, attribute, content);

    const self = this;
    const agent = makeAgent(() => update());
    const update = () => {
        const cleanup = useAgent(agent);
        self.setAttribute(attribute, content());
        cleanup();
    };

    self.agents ??= {} as any;

    if(self.agents[attribute]) {
        self.agents[attribute].cleanup();
    }

    self.agents[attribute] = agent;

    update();
}

Element.prototype.removeAttribute = function(
    this: ElementWithAgent,
    attribute: string
) {
    if(this.agents?.[attribute]) {
        this.agents[attribute].cleanup();
        delete this.agents[attribute];
    }

    return _removeAttribute.call(this, attribute);
};

Object.defineProperty(Element.prototype, "textContent", {
    get() {
        return this.nodeValue;
    },
    set(content) {
        const self = this as ElementWithAgent;
        if(typeof content !== "function") {
            if(self.agents?.[TEXT_CONTENT]) {
                self.agents[TEXT_CONTENT].cleanup();
                delete self.agents[TEXT_CONTENT];
            }

            self.nodeValue = content;
            return;
        }

        self.agents ??= {} as any;

        if(self.agents[TEXT_CONTENT]) {
            self.agents[TEXT_CONTENT].cleanup();
        }

        const textNode = document.createTextNode(content) as TextWithAgent;
        self.agents[TEXT_CONTENT] = textNode.agent;
        self.replaceChildren(textNode);
    }
});
