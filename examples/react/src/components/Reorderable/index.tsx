import React, { ComponentProps, ElementType, useContext, useEffect, useMemo, useRef } from "react";
import { Axis, checkReorder, compareMin, mixNumber, useDefaultMotionValue } from "./utils";
import { DragControls, motion, Axis as Layout, useTransform, Box } from "framer-motion";

export interface ReorderableContext {
    order: any[];
    axis: Axis;
    registerItem(id: any, layout: Box): void;
    updateOrder(id: any, offset: number, velocity: any): void;
    startDragging(id: any): void;
    stopDragging(id: any): void;
}

export const ReorderContext = React.createContext<ReorderableContext>({
    order: [],
    axis: "y",
    registerItem: () => {},
    updateOrder: () => {},
    startDragging: () => {},
    stopDragging: () => {}
});

export type ReorderGroupProps<
    C extends ElementType = "ul"
> =  {
    axis?: Axis;
    id: any;
    as?: C;
} & ComponentProps<C>;

export function ReorderGroup<
    C extends ElementType = "ul"
>({
    as = "ul" as any,
    axis = "y" as any,
    children,
    onReorder,
    ...props
}: ReorderGroupProps<C>) {
    const Component = motion[as] as typeof motion["ul"];

    const lastIndex = useRef(-1);
    const dragTarget = useRef<any>(null);

    const boxes = useMemo(() => ({} as Record<any, Box>), []);
    const order = useMemo(() => ([] as string[]), []);

    const context = {
        order, axis,
        registerItem: (id, layout: Box) => {
            boxes[id] = layout;

            if (!order.includes(id)) {
                order.push(id)
            }

            order.sort((a,b) => boxes[a][axis].min - boxes[b][axis].min);
        },
        updateOrder: (id, offset, velocity) => {
            if(!velocity) return;

            const index = order.indexOf(id);
            if(index === -1) return;

            const increment = velocity > 0 ? 1 : -1;
            const nextIndex = index + increment;
            const nextId = order[nextIndex];
            if(!nextId) return;

            const itemBox = boxes[id];
            const otherBox = boxes[nextId];

            const nextItemCenter = mixNumber(itemBox[axis].min, otherBox[axis].max, 0.5)

            if(
                (increment > 0 && itemBox[axis].max + offset > nextItemCenter) ||
                (increment < 0 && itemBox[axis].min + offset < nextItemCenter)
            ) {
                const size = order.length;
                const startIndex = index < 0 ? size + index : index;

                if(startIndex >= 0 && startIndex < size) {
                    const endIndex = nextIndex < 0 ? size + nextIndex : nextIndex;

                    const [other] = order.splice(index, 1);
                    order.splice(endIndex, 0, other);

                    boxes[id] = otherBox;
                    boxes[nextId] = itemBox;

                    lastIndex.current = endIndex;
                    onReorder(index, endIndex, [...order]);
                }
            }
        },
        startDragging: id => {
            dragTarget.current = id;
            lastIndex.current = order.indexOf(id);
        },
        stopDragging: () => {
            dragTarget.current = null;
            lastIndex.current = -1;
        }
    } as ReorderableContext;

    useEffect(() => {
        lastIndex.current = -1;
        console.log(order)
    });

    return (
        <Component {...props} ignoreStrict>
            <ReorderContext.Provider value={context}>
                {children}
            </ReorderContext.Provider>
        </Component>
    );
}

export type ReorderItemProps<
    C extends ElementType = "li"
> = {
    as?: C;
    id: any;
    dragControls: DragControls;
} & ComponentProps<C>;

export function ReorderItem<C extends ElementType = "li">({
    as = "li" as any,
    id,
    style = {},
    layout = "position",
    onDrag,
    ...props
}: ReorderItemProps<C>) {
    const {
        axis,
        registerItem,
        updateOrder,
        startDragging,
        stopDragging
    } = useContext(ReorderContext);

    const point = {
        x: useDefaultMotionValue(style.x),
        y: useDefaultMotionValue(style.y),
    }

    const zIndex = useTransform([point.x, point.y], ([latestX, latestY]) =>
        latestX || latestY ? 1 : "unset"
    )

    const Component = motion[as] as typeof motion["li"];

    return (
        <Component {...props}
            drag={axis}
            dragListener={false}
            dragSnapToOrigin
            style={{ ...style, x: point.x, y: point.y, zIndex }}
            layout={layout}
            onLayoutMeasure={box => registerItem(id, box)}
            onDragStart={() => startDragging(id)}
            onDragEnd={() => stopDragging(id)}
            onDrag={(event, info) => {
                if(info.velocity[axis]) {
                    updateOrder(id, point[axis].get(), info.velocity[axis]);
                }

                onDrag?.(event, info);
            }} />
    );
}
