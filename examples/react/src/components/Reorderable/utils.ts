import { isMotionValue, useMotionValue, type Axis as Layout } from "framer-motion";

export type Axis = "x" | "y";

export function moveItem(
    order: ItemData[],
    fromIndex: number,
    toIndex: number
) {
    const size = order.length;

    const startIndex = fromIndex < 0 ? size + fromIndex : fromIndex;

    if(startIndex >= 0 && startIndex < size) {
        const endIndex = toIndex < 0 ? size + toIndex : toIndex;

        const [other] = order.splice(fromIndex, 1);
        order.splice(endIndex, 0, other);

        return { fromIndex, endIndex };
    }
}

export function compareMin(a: ItemData, b: ItemData) {
    return a.layout.min - b.layout.min;
}

export interface ItemData {
    id: any;
    layout: Layout;
}

export function useDefaultMotionValue(value: any, defaultValue: number = 0) {
    // eslint-disable-next-line
    return isMotionValue(value) ? value : useMotionValue(defaultValue)
}

export const mixNumber = (
    from: number,
    to: number,
    progress: number
) => from + (to - from) * progress;

export function checkReorder(
    order: ItemData[],
    id: any,
    offset: number,
    velocity: number
) {
    if (!velocity) return;

    const index = order.findIndex((item) => item.id === id)

    if (index === -1) return;

    const nextOffset = velocity > 0 ? 1 : -1;
    const nextItem = order[index + nextOffset];

    if (!nextItem) return;

    const item = order[index]

    const nextLayout = nextItem.layout
    const nextItemCenter = mixNumber(nextLayout.min, nextLayout.max, 0.5)

    if (
        (nextOffset === 1 && item.layout.max + offset > nextItemCenter) ||
        (nextOffset === -1 && item.layout.min + offset < nextItemCenter)
    ) {
        return moveItem(order, index, index + nextOffset);
    }
}