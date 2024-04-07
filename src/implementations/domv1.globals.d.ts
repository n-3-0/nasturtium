declare global {
    // Define overload methods to stop having errors when doing things the cool new way
    interface HTMLElement {
        setAttribute(name: string, value: string);
        setAttribute(name: string, value: any);
        appendChild<T extends Node>(node: T): T;
        appendChild(node: any): any;
    }
}

export {};
