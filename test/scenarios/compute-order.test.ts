// C will always equal A
// This test is to figure out the number of recalls made and when
// Under ideal circumstances, it would say:
// ==========================================
//>     Minimal Minimal reproducible example
//>     Recalculating b
//>     Recalculating c
// the primitive is updated
//>     Recalculating b
//>     Recalculating c
//>     a value is 1
//>     b value is 2
//>     c value is 1
// ==========================================

import { createPrimitive } from "nasturtium/types/primitive";

describe("Compute order test", () => {
    it("runs computed values in the correct order", () => {
        const order: any[] = [];
        order.push("Minimal reproducible example");
        const a = createPrimitive(0);

        const b = a.makeComputed(a => {
            order.push("Recalculating b");
            return  a * 2;
        });

        const c = b.makeComputed(b => {
            order.push("Recalculating c");
            return b / 2;
        });

        a.observe(a => order.push("a value is", a));
        b.observe(b => order.push("b value is", b));
        c.observe(c => order.push("c value is", c));

        order.push("a is", a.get());
        order.push("changing a");
        a.value = 1;

        expect(order).toEqual([
            "Minimal reproducible example",
            "Recalculating b",
            "Recalculating c",

            "a is", 0,
            "changing a",

            "Recalculating b",
            "Recalculating c",

            "a value is", 1,
            "b value is", 2,
            "c value is", 1
        ]);
    })
});
