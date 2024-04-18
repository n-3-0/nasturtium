import { box, isPromise, wrap } from "nasturtium/utilities";

describe("Utilities", () => {
    describe("isPromise()", () => {
        it("positive", () => {
            const test = isPromise(Promise.resolve());
            expect(test).toBe(true);
        });

        it("negative", () => {
            const test = isPromise({});
            expect(test).toBe(false);
        });
    });

    describe("wrap()", () => {
        it("creates a frozen wrapper", () => {
            const wrapped = wrap(() => "Hello world!");
            expect(typeof wrapped).toBe("object");
            expect(Object.keys(wrapped)).toEqual(["current"]);
            expect(Object.isFrozen(wrapped)).toBe(true);

            const desc = Object.getOwnPropertyDescriptor(wrapped, "current");
            expect(desc).toBeDefined();
            expect(desc?.configurable).toEqual(false);
            expect(desc?.get).toBeDefined();
            expect(desc?.set).toBeUndefined();
        });

        it("calls the getter", () => {
            const mock = jest.fn().mockReturnValue("Hello World!");
            const wrapped = wrap(mock);
            const result = wrapped.current;

            expect(mock).toHaveBeenCalledTimes(1);
            expect(result).toEqual("Hello World!");
        });

        it("extends given object", () => {
            const wrapped = wrap(() => {}, { test: "1234!" });
            expect(Object.keys(wrapped)).toEqual(["test", "current"]);
            expect(wrapped.test).toEqual("1234!");
        });
    });

    describe("box()", () => {
        it("creates a frozen box", () => {
            const boxed = box(() => {}, () => {});
            expect(typeof boxed).toBe("object");
            expect(Object.keys(boxed)).toEqual(["value"]);
            expect(Object.isFrozen(boxed)).toBe(true);

            const desc = Object.getOwnPropertyDescriptor(boxed, "value");
            expect(desc).toBeDefined();
            expect(desc?.configurable).toEqual(false);
            expect(desc?.get).toBeDefined();
            expect(desc?.set).toBeDefined();
        });

        it("calls getter and setter", () => {
            const getter = jest.fn();
            const setter = jest.fn();
            const boxed = box(getter, setter);

            expect(getter).toHaveBeenCalledTimes(0);
            expect(setter).toHaveBeenCalledTimes(0);

            boxed.value;
            expect(getter).toHaveBeenCalledTimes(1);
            expect(setter).toHaveBeenCalledTimes(0);

            boxed.value = 1234;
            expect(getter).toHaveBeenCalledTimes(1);
            expect(setter).toHaveBeenCalledTimes(1);
        });

        it("extends given object", () => {
            const boxed = box(() => {}, () => {}, { test: "1234!" });
            expect(Object.keys(boxed)).toEqual(["test", "value"]);
            expect(boxed.test).toEqual("1234!");
        });
    })
});
