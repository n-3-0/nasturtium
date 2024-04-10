export type Extend<A, B> = {
    [K in keyof A]: K extends keyof B ? B[K] : A[K]
} & {
    [K in keyof B]: B[K]
};

export interface Element {
    get textContent(): string | null;
    set textContent(value: (() => string) | string): void;

    get contentEditable(): boolean | null;
    set contentEditable(value: (() => boolean) | boolean): void;

    get draggable(): boolean | null;
    set draggable(value: (() => boolean) | boolean): void;

    get hidden(): boolean | null;
    set hidden(value: (() => boolean) | boolean): void;

    get style(): string | null;
    set style(value: (() => string) | string): void;

    get title(): string | null;
    set title(value: (() => string) | string): void;
}

export interface Disableable {
    get disabled(): boolean | null;
    set disabled(value: (() => boolean) | boolean): void;
}

export interface Valuable {
    get value(): string | null;
    set value(value: (() => string) | string): void;
}

export interface Typable {
    get type(): string | null;
    set type(type: (() => string) | string): void;
}

export interface Requirable {
    get required(): boolean | null;
    set required(value: (() => boolean) | boolean): void;
}

export interface Lockable {
    get readOnly(): boolean | null;
    set readOnly(value: (() => boolean) | boolean): void;
}
