import {
    Element,
    Extend,
    Disableable,
    Lockable,
    Requirable,
    Valuable
} from "./common";

export type Select = Extend<HTMLSelectElement, ReactiveSelect>;
export interface ReactiveSelect implements Element, Disableable, Valuable, Lockable, Requirable {
    get multiple(): boolean | null;
    set multiple(value: (() => boolean) | boolean): void;
}
