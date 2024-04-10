import {
    Element,
    Extend
} from "./common";

export type Dialog = Extend<HTMLMeterElement, ReactiveDialog>;
export interface ReactiveDialog implements Element {
    get open(): boolean | null;
    set open(value: (() => boolean) | boolean): void;
}
