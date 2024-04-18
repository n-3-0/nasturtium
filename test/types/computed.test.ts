import { createPrimitive } from "nasturtium/types/primitive";
import { createComputed } from "nasturtium/types/computed";
import { wait } from "nasturtium/utilities";
import { isStateful, getStateType, getStateId, setComparator } from "nasturtium/constants";

describe("types: computed", () => {
    it("creates a valid state object", () => {
        const computed = createComputed(() => null);

        expect(isStateful(computed)).toBe(true);
        expect(getStateType(computed)).toEqual("computed");
        expect(typeof getStateId(computed)).toEqual("number");
    });

    it("lazy eval", () => {
        const mock = jest.fn().mockReturnValue("Hello world!");

        const computed = createComputed(mock);
        expect(mock).toHaveBeenCalledTimes(0);
    });

    it("eager eval", () => {
        const mock = jest.fn().mockReturnValue("Hello world!");

        const computed = createComputed(mock, true);
        expect(mock).toHaveBeenCalledTimes(1);
    });

    it("lazy eval w/ dependency", () => {
        const mock = jest.fn().mockImplementation(() => parent.value * 2);

        const parent = createPrimitive(2);
        const computed = createComputed(mock);
        parent.value = 4;

        expect(mock).toHaveBeenCalledTimes(0);
    });

    it("eager eval w/ dependency", () => {
        const mock = jest.fn().mockImplementation(() => parent.value * 2);

        const parent = createPrimitive(2);
        const computed = createComputed(mock, true); // First call
        parent.value = 4; // Second call

        expect(mock).toHaveBeenCalledTimes(2);
    });

    it("triggers dependents", () => {
        const mock = jest.fn().mockImplementation(() => parent.value * 2);
        const mockObserve = jest.fn();

        const parent = createPrimitive(2);
        const computed = createComputed(mock, true); // First call
        computed.observe(mockObserve)

        parent.value = 4; // Second call

        expect(mock).toHaveBeenCalledTimes(2);
        expect(mockObserve).toHaveBeenCalledTimes(1);
        expect(mockObserve.mock.lastCall[0]).toBe(8); // 4 * 2
    });

    it("supports different comparators", () => {
        const mockObserve = jest.fn();

        const parent = createPrimitive<2 | "2">(2);
        const computed = createComputed(() => parent.value);
        computed.observe(mockObserve);

        setComparator(computed, (a,b) => a == b);

        // Because it's a soft equals comparison, it should never really trigger a change
        expect(mockObserve).toHaveBeenCalledTimes(0);
        parent.value = "2";
        expect(mockObserve).toHaveBeenCalledTimes(0);
        parent.value = 2;
        expect(mockObserve).toHaveBeenCalledTimes(0);
    });

    describe("makeComputed()", () => {
        it("primitive", () => {
            const mock = jest.fn().mockImplementation(value => value * 2);
            const mockObserve = jest.fn();

            const state = createPrimitive(0);
            const computed = state.makeComputed(mock);
            computed.observe(mockObserve); // Triggers itself due to lazy eval

            state.value = 7; // Second call

            expect(mock).toHaveBeenCalledTimes(2);
            expect(mockObserve).toHaveBeenCalledTimes(1);
            expect(mockObserve.mock.lastCall[0]).toBe(14); // 7 * 2
        });

        it("computed", () => {
            const mock = jest.fn().mockImplementation(value => value * 2);
            const mockObserve = jest.fn();

            const state = createComputed(() => 7);
            const computed = state.makeComputed(mock);
            computed.observe(mockObserve);

            expect(mock).toHaveBeenCalledTimes(1);
            expect(mockObserve).toHaveBeenCalledTimes(0);
            expect(state.value).toBe(7);
            expect(computed.value).toBe(14);
            expect(mock.mock.results[0]).toEqual({ type: "return", value: 14 }); // 7 * 2
        })
    })

    describe("Promise Support", () => {
        it("updates dependents after a promise resolves", (done) => {
            const computed = createComputed(async() => {
                await wait(200);
                return "Hello world!";
            }, false, true);

            computed.observe(value => {
                expect(value).toBe("Hello world!");
                done();
            });
        });

        it("handles chain reactions", (done) => {
            const computed = createComputed(async() => {
                await wait(200);
                return "Hello world!";
            }, false, true);

            computed.observe(value => {
                expect(value).toBe("Hello world!");
                done();
            });
        });

        // it("does not resolve promises if explicitly disabled", (done) => {
        //     const computed = createComputed(async() => {
        //         await wait(200);
        //         return "Hello world!";
        //     }, false, false);

        //     computed.observe(value => {
        //         expect(value).toBe("Hello world!");
        //         done();
        //     });
        // });
    });
});
