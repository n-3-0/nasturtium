import {
    forwardRef,
    useMemo,
    useRef,
    type ComponentType,
    type ElementType,
    useEffect,
    ComponentProps
} from "react";

import { cn } from "../../utils/cn";

import { useBox, useComputed } from "nasturtium/implementations/react/hooks";
import { wrap } from "nasturtium/implementations/domv2";

import { getDragProps } from "./drag-columns";

import "./style.scss";

export interface Column {
    key: string;
    label?: string;
    sortable?: boolean;
    resizeable?: boolean;
    size?: string;
}

export type CardTableProps<
    T, K extends keyof T,
    A extends ElementType = "div",
    H extends ElementType = "div",
    B extends ElementType = "div"
> = {
    id?: string;
    dataIdentifier: K;
    columns: Column[];
    data: T[];
    className?: string;
    as?: A;
    headerComponent?: H;
    headerProps?: ComponentProps<H>;
    bodyComponent?: B;
    bodyProps?: ComponentProps<B>;

    bordered?: boolean;
    separators?: boolean;
    resizeableColumns?: boolean;
} & ({
    children: ComponentType<RowProps<T>>;
    row?: undefined;
} | {
    children?: undefined;
    row: ComponentType<RowProps<T>>;
});

export interface RowProps<T = any> {
    data: T;
    index: number;
}

function useTableHooks<
    T, K extends keyof T,
    A extends ElementType = "div",
    H extends ElementType = "div",
    B extends ElementType = "div"
>({
    columns,
    resizeableColumns,
    id,
    bordered,
    separators,
    className,

    children: ChildRowComponent,
    row: RowComponent,
}: CardTableProps<T, K, A, H, B>) {
    const columnWidths = useBox<number[]>(() => {
        return Array(columns.length).fill(1).map((_, i) => {
            if(columns[i].size) return columns[i].size;

            return columns[i].resizeable === false ? "max-content" as any : 1
        })
    });

    const gridStyle = useComputed(() => {
        const widths = columnWidths.use();
        const initial = widths.length !== columns.length;

        const widthStr = widths.map(x => typeof x === "string" ? x : `${x}fr`).join(" ");
        return `repeat(${initial ? columns.length : 1}, ${widthStr})`;
    });

    const table = useRef<any>();

    const renderedColumns = useMemo(() => {
        if(!resizeableColumns) return columns.map((col) => (
            <Cell key={`table-${id}-thead-th-${col.key}`}>
                {col.label}
            </Cell>
        ));

        return columns.map((col, i) => {
            const isResizeable = col.resizeable !== false;
            const isFixedSize = !!col.size;

            const canResize = (i + 1 !== columns.length) && isResizeable && !isFixedSize;

            return (
                <Cell className="is-resizable" key={`table-${id}-thead-th-${col.key}`}>
                    {col.label}
                    {canResize && (
                        <div className="divider" {...getDragProps(columnWidths, col, i, columns)} />
                    )}
                </Cell>
            );
        });
    }, [columns, resizeableColumns]);

    useEffect(() => {
        if(!table.current) return;

        const wrapped = wrap(table.current, (table: HTMLElement) => {
            table.style.setProperty("--card-table-columns", gridStyle.value);
        });

        return () => wrapped.agent.cleanup();
    }, []);

    const style: any = {
        "--card-table-columns": gridStyle.get(),
        "--card-table-column-count": columns.length
    };

    const classList = cn(
        "card-table",
        bordered && "has-borders",
        separators && "has-separators",
        resizeableColumns && "has-resizeable-columns",
        className
    );

    const RowComp = ChildRowComponent || RowComponent;

    return {
        columnWidths,
        gridStyle,
        table,
        renderedColumns,
        style,
        classList,
        RowComp,
    };
}

export function CardTable<
    T, K extends keyof T,
    A extends ElementType = "div",
    H extends ElementType = "div",
    B extends ElementType = "div"
>(props: CardTableProps<T, K, A, H, B>) {
    const {
        id,
        dataIdentifier,
        data,
        as: As = "div" as any,
        headerComponent: HeaderComponent = "div",
        headerProps = {} as any,
        bodyComponent: BodyComponent = "div",
        bodyProps = {} as any
    } = props;

    const { table, classList, style, renderedColumns, RowComp } = useTableHooks(props);

    return (
        <As ref={table} id={id} className={classList} style={style}>
            <HeaderComponent {...headerProps} className={cn("table-head", headerProps.className)}>
                <Row>{renderedColumns}</Row>
            </HeaderComponent>
            <BodyComponent {...bodyProps} className={cn("table-body", bodyProps.className)}>
                {data.map((entry, i) => (
                    <RowComp key={`table-${id}-row-${entry[dataIdentifier]}`} data={entry} index={i} />
                ))}
            </BodyComponent>
        </As>
    );
}

export function VirtualCardTable<
    T, K extends keyof T,
    A extends ElementType = "div",
    H extends ElementType = "div",
    B extends ElementType = "div"
>(
    props: Omit<CardTableProps<T, K, A, H, B>, "dataIdentifier" | "data"> & {
        rowCount: number;
        rowContext?: any;
    }
) {
    const {
        id,
        rowCount,
        as: As = "div",
        headerComponent: HeaderComponent = "div",
        headerProps = {} as any,
        bodyComponent: BodyComponent = "div",
        bodyProps = {} as any,

        rowContext
    } = props;

    const { table, classList, style, renderedColumns, RowComp } = useTableHooks(props as any);

    const renderedRows = useMemo(() => {
        const ctx = rowContext || {};

        return Array(rowCount).fill(0).map((_, i) => (
            <RowComp key={`table-${id}-row-${i}`} data={null} index={i} {...ctx} />
        ));
    }, [ id, rowContext, rowCount, RowComp ]);

    return (
        <As ref={table} id={id} className={classList} style={style}>
            <HeaderComponent {...headerProps} className={cn("table-head", headerProps.className)}>
                <Row>{renderedColumns}</Row>
            </HeaderComponent>
            <BodyComponent {...bodyProps} className={cn("table-body", bodyProps.className)}>
                {renderedRows}
            </BodyComponent>
        </As>
    );
}

export type TableRowProps<C extends ElementType = "div"> = {
    as?: C;
} & ComponentProps<C>

export const Row = forwardRef(function Row<
    C extends ElementType = "div"
>({ as: As = "div", className, ...props }: TableRowProps<C>, ref) {
    return (
        <As ref={ref} className={cn("table-row", className)} {...props} />
    );
});

export type CellProps<C extends ElementType = "div"> = {
    as?: C;
} & ComponentProps<C>

export const Cell = forwardRef(function Cell<
    C extends ElementType = "div"
>({ as: As = "div", className, ...props }: CellProps<C>, ref) {
    return (
        <As ref={ref} className={cn("cell", className)} {...props} />
    );
});
