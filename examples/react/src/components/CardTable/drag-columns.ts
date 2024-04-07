import type { BoxState } from "nasturtium/types/box";
import type { Column } from "./index";

export const MIN_SIZE = 50;

export function getDragProps(
    state: BoxState<number[]>,
    col: Column,
    i: number,
    cols: Column[]
) {
    let sx = 0, ex = 0;

    let startingWidth = 0;
    let ratioMultiplier = 1;

    const updateSize = () => {
        const delta = ex - sx;
        const newWidth = Math.max(50, startingWidth + delta);
        const ratio =  ratioMultiplier * newWidth;

        const columns = [...state.get()];

        const ratioDiff = columns[i] - ratio;

        if(i + 1 < columns.length) {
            for(let j = i + 1; j < columns.length; j++) {
                if(cols[j].resizeable === false || cols[j].size) continue;

                const nextRatio = columns[j] + ratioDiff;
                const nextWidth = nextRatio / ratioMultiplier;

                if(nextWidth < MIN_SIZE) continue;

                columns[i] = ratio;
                columns[j] = nextRatio;

                return state.set(columns);
            }

            return;
        }

        columns[i] = ratio;
        state.set(columns);
    }

    const onMouseMove = e => {
        ex = e.clientX;
        updateSize();
    };

    const onMouseUp = e => {
        ex = e.clientX;

        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        document.body.classList.remove("card-table-column-resizing");

        updateSize();
    };

    return {
        onMouseDown: e => {
            e.preventDefault();
            sx = ex = e.clientX;

            startingWidth = e.target.parentElement.getBoundingClientRect().width;
            ratioMultiplier = state.get()[i] / startingWidth;

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);

            document.body.classList.add("card-table-column-resizing");
        }
    };
}
