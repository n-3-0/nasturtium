export type Comparator<T> = (old: T, next: T) => boolean;

export function eqeqeq<T>(a: T, b: T) {
    return a === b;
}
