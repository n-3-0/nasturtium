import { createPrimitive } from "nasturtium/types/primitive";
import { isAgent, makeAgent, makeInertAgent } from "nasturtium/agent";
import { resolveAgent, useAgent } from "nasturtium/manifold";
import { PriorityLane } from "nasturtium/queue";

describe("Agents", () => {
    let inertAgent = makeInertAgent();

    beforeEach(() => {
        inertAgent = makeInertAgent();
    });

    it("basic agent properties", () => {
        expect(typeof inertAgent.id).toBe("number");
        expect(inertAgent.priority).toBe(PriorityLane.NORMAL); // Default should always be NORMAL
    });

    it("isAgent()", () => {
        const test = isAgent(inertAgent);
        expect(test).toBe(true);
    });

    it("makeAgent()", () => {
        const agent = makeAgent(() => {});
        expect(agent).toBeDefined();
    });

    describe("useAgent", () => {
        it("steals subscriptions", () => {
            const sample = createPrimitive(0);
            const cleanup = useAgent(inertAgent);
            expect(typeof cleanup).toBe("function");

            sample.value; // subscribe
            cleanup();

            expect(inertAgent.cleanups.size).toBe(1);
        });

        it("actually steals subscriptions", () => {
            const sample = createPrimitive(0);
            const otherAgent = makeInertAgent();

            const firstCleanup = useAgent(otherAgent);
            const secondCleanup = useAgent(inertAgent);

            sample.value; // subscribe;

            secondCleanup();
            firstCleanup();

            expect(inertAgent.cleanups.size).toBe(1);
            expect(otherAgent.cleanups.size).toBe(0);
        });

        it("resolveAgent()", () => {
            const cleanup = useAgent(inertAgent);
            expect(resolveAgent()).toStrictEqual(inertAgent);
            cleanup();
        });

        it("handles desync cleanups", () => {
            const otherAgent = makeInertAgent();
            const firstCleanup = useAgent(otherAgent);
            const secondCleanup = useAgent(inertAgent);

            expect(resolveAgent()).toStrictEqual(inertAgent);
            firstCleanup();
            expect(resolveAgent()).toStrictEqual(inertAgent);
            secondCleanup();
            expect(resolveAgent()).toStrictEqual(null);
        });

        it("before/after lifecycle", () => {
            const before = jest.fn();
            const after = jest.fn();
            const cleanup = jest.fn();

            const testAgent = makeAgent(() => {}, {
                before, after, cleanup
            });

            const other = makeInertAgent();

            const dispose = useAgent(testAgent);
            expect(before).toHaveBeenCalledTimes(1);
            expect(after).toHaveBeenCalledTimes(0);
            expect(cleanup).toHaveBeenCalledTimes(0);

            const dispose2 = useAgent(other);
            expect(before).toHaveBeenCalledTimes(1);
            expect(after).toHaveBeenCalledTimes(0);
            expect(cleanup).toHaveBeenCalledTimes(0);

            dispose2();
            expect(before).toHaveBeenCalledTimes(1);
            expect(after).toHaveBeenCalledTimes(0);
            expect(cleanup).toHaveBeenCalledTimes(0);

            dispose();
            expect(before).toHaveBeenCalledTimes(1);
            expect(after).toHaveBeenCalledTimes(1);
            expect(cleanup).toHaveBeenCalledTimes(0);
        });
    });
});
