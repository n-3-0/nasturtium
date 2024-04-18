import { extend } from "nasturtium/addons";
import { createTimer } from "nasturtium/types/timer";

describe("Addon system", () => {
    // We use timer as an example here because nobody cares about the timer lol
    it("registers an addon to a timer", () => {
        const injectedProperty = Symbol("INJECTED_PROP");

        const fn = jest.fn().mockImplementation(state => {
            state[injectedProperty] = true;
        });

        const unregister = extend("timer", fn);

        expect(typeof unregister).toEqual("function");
        expect(fn).toHaveBeenCalledTimes(0);

        const timer = createTimer(1000);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(timer[injectedProperty]).toEqual(true);

        unregister();

        const timer2 = createTimer(1000);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(timer2[injectedProperty]).toBeUndefined();
    });
});
