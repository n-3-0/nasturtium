import {
    Element,
    Extend
} from "./common";

export type Meter = Extend<HTMLMeterElement, ReactiveMeter>;
export interface ReactiveMeter implements Element {
    get min(): string | null;
    set min(value: (() => string) | string): void;

    get max(): string | null;
    set max(value: (() => string) | string): void;

    get low(): string | null;
    set low(value: (() => string) | boolean): void;

    get high(): string | null;
    set high(value: (() => string) | string): void;

    get optimum(): string | null;
    set optimum(value: (() => string) | string): void;
}