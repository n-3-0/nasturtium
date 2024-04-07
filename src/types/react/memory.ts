// import { getNextId, STATE, type State } from "../../constants";

// export interface MemoryState<L extends number> extends State {
//     readonly [STATE]: "node:memory";
//     readonly length: L;
// };

// export function createMemory<L extends number>(length: L) {
//     const id = getNextId();
//     const buffer = new SharedArrayBuffer(length); // Shared
//     const instance = new Int32Array(buffer); // Window

//     const createReadLoop = (index = 0) => {
//         async function readLoop() {
//             const currentValue = Atomics.load(instance, index);
//             const next = Atomics.waitAsync(instance, index, currentValue);
//         }

//         readLoop();
//     };
// }