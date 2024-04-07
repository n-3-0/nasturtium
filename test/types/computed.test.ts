import { createPrimitive } from "nasturtium/types/primitive";
import { createComputed } from "nasturtium/types/computed";
import { wait } from "nasturtium/utilities";

describe("ComputedState", () => {
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
        })
    })

    describe("Promise Support", () => {
        it("updates dependents after a promise resolves", (done) => {
            const computed = createComputed(async() => {
                await wait(200);
                return "Hello world!";
            });

            computed.observe(value => {
                expect(value).toBe("Hello world!");
                done();
            });
        });
        it("handles chain reactions", (done) => {
            const computed = createComputed(async() => {
                await wait(200);
                return "Hello world!";
            });

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
