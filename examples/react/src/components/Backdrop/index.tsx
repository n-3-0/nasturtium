import { rctv } from "nasturtium/extensions/react/react-domv2"

import type { PrimitiveState } from "nasturtium/types/primitive";

import "./style.scss";

export interface BackdropProps {
    target: PrimitiveState<HTMLElement>;
    children?: any;
}

export function Backdrop({ target, children }: BackdropProps) {
    const onCreate = (div: HTMLDivElement) => {
        console.log("Div!", div, target.value);
    };

    return (
        <rctv.div className="backdrop" $={onCreate}>
            <div className="inner">{children}</div>
        </rctv.div>
    );
}