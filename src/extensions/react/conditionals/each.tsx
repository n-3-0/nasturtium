// TODO: Do we want to compute/memoize these?
// TODO: Fix types so it work really well with Tuple state!
import React, {
    type ReactNode,
    type ReactElement
} from "react";
import { getStateId } from "nasturtium/constants";
import { TupleState, isTupleState } from "nasturtium/types/tuple";

export type EachProps<T extends TupleState<any[]> | any[] = any[]> = {
    q: () => T;
} & ({
    children: ReactElement<{ item: T[number], index: number, array: T }>;
    run?: never;
} | {
    children?: never;
    run: (item: T[number], index: number, array: T) => ReactNode;
});

/**
 * Render children repeatedly from the results of an array
 */
export function Each<T extends TupleState<any[]> | any[] = any[]>({
    q, children, run
}: EachProps<T>) {
    const value = q();

    if(run) {
        return value?.map(run as any) as any[];
    }

    const child = React.Children.only(children);
    if(isTupleState(value)) return (
        <TupleEach tuple={value} child={child} />
    );

    return value?.map((item, index) => React.cloneElement(child, {
        item, index, array: value
    }));
}

function TupleEach({ tuple, child }: { tuple: TupleState, child: any }) {
    const tupleId = getStateId(tuple);

    return Array.from({ length: tuple.length }).map((_, i) => (
        <EachItem key={`each-${tupleId}-${i}`} tuple={tuple} index={i} child={child} />
    ));
}

// Used when it's a Tuple state
function EachItem({ tuple, index, child }: { tuple: TupleState, index: number, child: any }) {
    const item = tuple[index];

    return React.cloneElement(child, {
        item, index, array: tuple
    });
}
