import { useMemo } from "react";

import { TupleState } from "nasturtium/types/tuple";
import { useArray } from "nasturtium/implementations/react/hooks";

import { useDragControls } from "framer-motion";
import { VirtualCardTable, Row, Cell, type Column } from "../../components/CardTable";
import { PageBody } from "../../components/PageBody";
import { Sidebar } from "../../components/Sidebar";
import { ReorderGroup, ReorderItem } from "../../components/Reorderable";

import DragHandle from "./drag-handle.svg";

import "./style.scss";

interface Item {
    id: number,
    label: string;
}

function TableRow({ data, index }: { data: TupleState<Item[]>, index: number }) {
    const controls = useDragControls();
    const rowData = data.at(index);

    const onMouseDown = e => {
        e.preventDefault();
        // data.swap(index, index + 1);
        controls.start(e)
    }

    return (
        <Row as={ReorderItem} dragControls={controls} id={rowData.id}>
            <Cell>
                <div className="drag-handle" onMouseDown={onMouseDown}>
                    <img src={DragHandle} />
                </div>
            </Cell>
            <Cell>{rowData.id}</Cell>
            <Cell>{rowData.label}</Cell>
        </Row>
    );
}

function Table({ columns, data }: { columns: any[], data: TupleState<Item[]> }) {
    const onReorder = (oldIndex, newIndex) => {
        data.swap(oldIndex, newIndex);
    };

    const size = data.size();

    return (
        <VirtualCardTable
            bodyComponent={ReorderGroup}
            bodyProps={{ axis: "y", onReorder }}
            id="test-table"
            resizeableColumns
            columns={columns}
            rowCount={size}
            row={TableRow}
            rowContext={{ data }} />
    );
}

export function HomePage() {
    const columns = useMemo<Column[]>(() => [
        { key: "reorder", resizeable: false },
        { key: "id",     label: "ID"   },
        { key: "label",  label: "Name" }
    ], []);

    const data = useArray(() => Array(20).fill(0).map((_, i) => ({
        id: i + 1,
        label: `Object ${String.fromCharCode(65 + i)}`
    })));

    return (
        <PageBody layout="horizontal">
            <Sidebar />
            <div className="page-content">
                <h1>Home</h1>
                <Table columns={columns} data={data} />
            </div>
        </PageBody>
    );
}
