import type {
    Element,
    Disableable,
    Lockable,
    Requirable,
    Typable,
    Valuable
} from "./elements/common";

import type { Input } from "./elements/input";
import type { Button } from "./elements/button";
import type { Select } from "./elements/select";
import type { TextArea } from "./elements/textarea";
import type { Meter } from "./elements/meter";
import type { Dialog } from "./elements/dialog";
import type { Image } from "./elements/image";

namespace Extended {
    interface ExtendedElements {
        "input": Input;
        "button": Button;
        "select": Select;
        "textarea": TextArea;
        "meter": Meter;
        "dialog": Dialog;
        "image": Image;
    }

    type ElementMap = {
        [K in keyof HTMLElementTagNameMap]: ExtendedElements[K] extends never
            ? HTMLElementTagNameMap[K]
            : ExtendedElements[K];
    };
}

declare global {
    namespace Reactive {
        export {
            Input,
            Button,
            Select,
            TextArea,
            Meter,
            Dialog,
            Image,
        };
    }

    // Define overload methods to stop having errors when doing things the cool new way
    interface Element extends Extended.Element {
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K,
            options?: ElementCreationOptions
        ): Extended.ElementMap[K];

        setAttribute(name: string, content: (() => string) | string);
    }

    interface Document {
        createTextNode(data: (() => string) | string): Text;
    }
}

export {};
