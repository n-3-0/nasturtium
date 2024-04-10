import {
    Element,
    Extend
} from "./common";

export type Image = Extend<HTMLImageElement, ReactiveImage>;
export interface ReactiveImage implements Element {
    get src(): string | null;
    set src(value: (() => string) | string): void;

    get alt(): string | null;
    set alt(value: (() => string) | string): void;

    get width(): string | null;
    set width(value: (() => string) | string): void;

    get height(): string | null;
    set height(value: (() => string) | string): void;
}