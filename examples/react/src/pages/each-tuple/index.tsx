import { useArray } from "nasturtium/implementations/react/hooks";
// or "nasturtium/extensions/react/conditionals/each"
import { Each } from "nasturtium/extensions/react/conditionals";

import { PageBody } from "../../components/PageBody";
import { MouseEvent } from "react";

type ListItemProps = { item: string; index: number; array: any; };
function ListItem({ item, index, array }: ListItemProps) {
    console.log(`List item ${index} re-rendered`);

    const onBlur = e => {
        array[index] = e.target.textContent;
    }

    return (
        <li contentEditable onBlur={onBlur} dangerouslySetInnerHTML={{ __html: item }} />
    );
}

export function EachTupleDemo() {
    const notes = useArray<string[]>([]);

    function onAddItem(e: MouseEvent) {
        e.preventDefault();
        notes.push("New Note");
    }

    console.log("Top level component re-rendered");

    return (
        <PageBody>
            <h1>Todo List Demo</h1>
            <p>Check the console and see what renders and when.</p>
            <button type="button" onClick={onAddItem}>
                Add Item
            </button>
            <ol>
                <Each q={() => notes}>
                    <ListItem item="" index={0} array={notes} />
                </Each>
            </ol>
        </PageBody>
    );
}

