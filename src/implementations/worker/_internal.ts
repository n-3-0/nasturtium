export const isWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;

export type Disposable<T> = T & {
    cleanup();
};
