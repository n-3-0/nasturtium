import {
    Element,
    Extend,
    Disableable,
    Lockable,
    Requirable,
    Typable,
    Valuable
} from "./common";

export type Input = Extend<HTMLInputElement, ReactiveInput>;

export interface ReactiveInput extends Element, Disableable, Valuable, Typable, Requirable, Lockable {
    get checked(): boolean | null;
    set checked(value: (() => boolean) | boolean): void;

    get step(): string | null;
    set step(value: (() => string) | string): void;
}
