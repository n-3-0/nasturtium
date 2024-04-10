import {
    Element,
    Extend,
    Disableable,
    Lockable,
    Requirable,
    Valuable
} from "./common";

export type TextArea = Extend<HTMLTextAreaElement, ReactiveTextArea>;
export interface ReactiveTextArea implements Element, Valuable, Disableable, Lockable, Requirable {
    get cols(): string | null;
    set cols(value: (() => string) | string): void;
}
