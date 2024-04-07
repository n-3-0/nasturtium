import { createPrimitive } from "../../types/primitive";

export type Size = `${number}px` | `${number}rem`;

/**
 * Provide a key-value pair of breakpoints and it'll give you a primitive to observe the current breakpoint key
 */
export function createBreakpoints<S extends Record<string, Size>>(sizes: S) {
    const converted = Object.entries(sizes).map(([ label, size ]) => ({
        label,
        width: Number(size.slice(0, -2)) * (size.endsWith("px") ? 1 : 16)
    })).sort((a,b) => a.width - b.width);

    const min = converted.at(0)!;
    const max = converted.at(-1)!;

    const s = converted.length;

    const recalculate = () => {
        const width = document.documentElement.clientWidth;

        if(width < min.width) return min.label as keyof S;
        if(width >= max.width) return max.label as keyof S;

        let option: typeof converted[number];
        for(let i = 1; i < s - 1; i++) {
            option = converted[i];
            if(width <= option.width) {
                return option.label as keyof S;
            }
        }

        return option!.label as keyof S;
    };

    const state = createPrimitive(recalculate());

    window.addEventListener("resize", () => void(state.value = recalculate()));

    return state;
}
