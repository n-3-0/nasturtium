import React, { forwardRef, useEffect, useRef } from "react";
import { wrap } from "../../implementations/domv2";

export function useDOMElement<T extends keyof HTMLElementTagNameMap>(
    type: T,
    modifier: (element: HTMLElementTagNameMap[T]) => void
) {
    const ref = useRef<HTMLElementTagNameMap[T]>();

    useEffect(() => {
        const element = wrap(ref.current as HTMLElementTagNameMap[T], modifier);

        return () => {
            element?.["agent"].cleanup();
        };
    }, []);

    return React.createElement(type, { ref });
}

type ReactiveElementCaller<K, R> = (element: K extends keyof HTMLElementTagNameMap
    ? HTMLElementTagNameMap[K]
    : HTMLElement
) => R;

type ReactiveElements = {
    <K extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>>(
        element: K,
        caller: ReactiveElementCaller<K, void>,
        children?: any
    ): React.ReactNode;
} & {
    [K in keyof HTMLElementTagNameMap]: ReactiveElement<K>
};

type ReactiveElement<K extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>> = React.ComponentType<
    React.ComponentProps<K> & { $: ReactiveElementCaller<K, React.ElementType | void> }
>

const makeReactiveElement = (Element: any) => {
    function ReactiveElement({ $, ...props }, ref: any) {
        let dom = useRef();

        useEffect(() => {
            const element = wrap(dom.current as any, $);

            return () => {
                element?.["agent"].cleanup();
            };
        }, []);

        return (
            <Element {...props} ref={(r: any) => {
                if(typeof ref === "function") ref(r);
                else if(ref && Object.hasOwn(ref, "current")) ref.current = r;

                dom.current = r;
            }} />
        );
    }

    // TODO: Do some magic to name the function after the Element
    const name = typeof Element === "function" ? Element.name : String(Element);
    Object.defineProperty(ReactiveElement, "name", {
        value: `rctv$${name}`
    });

    return ReactiveElement;
}

const rctvCache: Record<any, React.ForwardRefExoticComponent<any>> = {};
// Supply the Proxy with a function so both get() and apply() work
const _proxyTarget: any = (() => {});
export const rctv: ReactiveElements = new Proxy(_proxyTarget, {
    get(_, Element: any) {
        if(rctvCache[Element]) return rctvCache[Element];
        const component = makeReactiveElement(Element);

        rctvCache[Element] = forwardRef(component);
        return rctvCache[Element];
    },
    apply(_1, _2, [ Element, func, children ] = []) {
        if(!rctvCache[Element]) {
            const component = makeReactiveElement(Element);
            rctvCache[Element] = forwardRef(component);
        }

        return React.createElement(rctvCache[Element], { $: func }, ...(Array.isArray(children) ? children : [children]));
    },
});

export interface RootProps {
    selector?: string;
    children?: any;
    $: ReactiveElementCaller<any, void>;
}

export function Root({ selector = "#root", $, children }: RootProps) {
    useEffect(() => {
        const element: HTMLElement = document.querySelector(selector)!;
        const wrapped = wrap(element, $);

        return () => {
            wrapped.agent.cleanup();
        };
    }, [ selector ]);

    return children;
}
