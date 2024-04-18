import {  getStateId, getStateType, isStateful } from "nasturtium/constants";

describe("constants", () => {
    describe("getStateType()", () => {
        it("does not false positive", () => {
            const target = {};

            expect(isStateful(target)).toEqual(false);
            expect(getStateType(target)).toBeNull();
        });
    });

    describe("getStateId()", () => {
        it("does not false positive", () => {
            const target = {};

            expect(isStateful(target)).toEqual(false);
            expect(getStateId(target)).toBeNull();
        });
    });
});
