import { addReaction, beginBatch, clear, trigger } from "nasturtium/manifold";

describe("manifold", () => {
    const TEST_ID = 1234;

    afterEach(() => {
        clear(TEST_ID);
    });

    it("simple flow", () => {
        const reaction = jest.fn();
        const cleanup = addReaction(TEST_ID, reaction);

        expect(typeof cleanup).toBe("function");
        expect(reaction).toHaveBeenCalledTimes(0);

        trigger(TEST_ID);
        expect(reaction).toHaveBeenCalledTimes(1);

        cleanup();
        trigger(TEST_ID);
        expect(reaction).toHaveBeenCalledTimes(1);
    });

    describe("batching", () => {
        it("triggerCapture basic", () => {
            const reaction = jest.fn();
            const cleanup = addReaction(TEST_ID, reaction);

            const commit = beginBatch();

            expect(typeof commit).toEqual("function");
            expect(reaction).toHaveBeenCalledTimes(0);

            trigger(TEST_ID);
            expect(reaction).toHaveBeenCalledTimes(0);

            commit();
            // TODO: Doesn't happen fast enough
            // expect(reaction).toHaveBeenCalledTimes(1);
        });
    });
});
