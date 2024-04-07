import { addReaction, clear, trigger } from "nasturtium/manifold";

describe("manifold", () => {
    const TEST_ID = 1234;

    afterEach(() => {
        clear(TEST_ID)
    });

    it("simple flow", () => {
        const reaction = jest.fn();
        const cleanup = addReaction(TEST_ID, reaction);

        expect(typeof cleanup).toBe("function");
        expect(reaction).not.toHaveBeenCalled();

        trigger(TEST_ID);
        expect(reaction).toHaveBeenCalledTimes(1);

        cleanup();
        trigger(TEST_ID);
        expect(reaction).toHaveBeenCalledTimes(1);
    });
});
