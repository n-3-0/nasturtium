/**
 * We had to build out a whole priority queuing system because I wanted all state to update before any monitoring code
 * gets triggered. This would ensure that, for any given reaction, all stateful data is current and accurate. Combining
 * this idea with lazy evaluated computed values, this trades operating performance for accuracy in a way that I think
 * is pretty neat, but more importantly very consistent.
 *
 * There are probably more "flexible" ways to write it, but because the possible priority lanes are known at compile
 * time, we are intentionally making it more verbose to make the runtime IO a little bit faster.
 */

interface Queued {
    id: number;
    value: any;
    trigger: any;
    priority: PriorityLane;

    readonly complete: boolean;
    readonly promise: Promise<{ id: number, value: any }>;

    // private resolve(result: { id: number, value: any }): void;
}

export enum PriorityLane {
    /** @unused */
    PRIORITY = 400,
    /** computed state */
    COMPUTED = 300,
    /** basically everything else */
    NORMAL = 200,
    /** @unused */
    MONITOR = 100,
}

let remaining = 0;
let pCount = 0, priorityQueue: Queued[] = [];
let cCount = 0, computedQueue: Queued[] = [];
let sCount = 0, standardQueue: Queued[] = [];
let mCount = 0, monitorsQueue: Queued[] = [];

export function hasNext() {
    return !!remaining;
}

export function peekNext() {
    if(!remaining) return null;

    return ((
        (pCount && priorityQueue)
        || (cCount && computedQueue)
        || (sCount && standardQueue)
        || (mCount && monitorsQueue)
    ) as Queued[]).at(-1);
}

export function popNext() {
    if(!remaining) return null;
    --remaining;

    let next: Queued;

    // Father forgive me, for I must sin
    // TODO: be even more efficient
    (pCount && (next = priorityQueue.pop()!, --pCount, true)) ||
    (cCount && (next = computedQueue.pop()!, --cCount, true)) ||
    (sCount && (next = standardQueue.pop()!, --sCount, true)) ||
    (mCount && (next = monitorsQueue.pop()!, --mCount, true));

    return next!;
}

export function peekDetails() {
    return {
        size: remaining,
        [PriorityLane.PRIORITY]: pCount,
        [PriorityLane.COMPUTED]: cCount,
        [PriorityLane.NORMAL]: sCount,
        [PriorityLane.MONITOR]: mCount,
    };
}

export function runNext() {
    const next = popNext();
    if(!next) return null;

    const result = { id: next.id, value: next.value };
    (next as any).resolve(result);
    next.trigger(next.value, next.id);

    return result;
}

export function queueNext(id: number, value: any, trigger: any, priority: PriorityLane) {
    ++remaining;

    const entry = { id, value, trigger, priority, complete: false } as Queued;
    (entry as any).promise = new Promise(resolve => {
        (entry as any).resolve = resolve;
    }).then(result => ((entry as any).complete = true, result));

    if(priority === PriorityLane.PRIORITY) {
        priorityQueue.unshift(entry);
        ++pCount;
    } else if(priority === PriorityLane.COMPUTED) {
        computedQueue.unshift(entry);
        ++cCount;
    } else if(priority === PriorityLane.NORMAL) {
        standardQueue.unshift(entry);
        ++sCount;
    } else if(priority === PriorityLane.MONITOR) {
        monitorsQueue.unshift(entry);
        ++mCount;
    }

    return entry;
}
