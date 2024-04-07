export type Box<T> = {
    get value(): T;
    set value(value: T);
};

export function makeBox<T = any>(initialValue?: T) {
    const box = {
        "_value": initialValue,

        get value() {
            return box["_value"];
        },

        set value(newValue) {
            box["_value"] = newValue;
        }
    };

    return box as Box<T>;
}
