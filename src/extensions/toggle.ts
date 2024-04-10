import { createPrimitive, type PrimitiveState } from "../types/primitive";

export type Toggle = PrimitiveState<boolean> & { toggle(): void };

export function createToggle(initialValue?: boolean) {
    const primitive = createPrimitive(initialValue ?? false) as Toggle;
    primitive.toggle = () => primitive.set(value => !value);
    return primitive;
}
