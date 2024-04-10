import {
    Element,
    Extend,
    Disableable,
    Typable
} from "./common";

export type Button = Extend<HTMLButtonElement, ReactiveButton>;

export interface ReactiveButton implements Element, Disableable, Typable {}
