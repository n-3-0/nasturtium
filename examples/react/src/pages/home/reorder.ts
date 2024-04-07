import { useMotionValue } from "framer-motion";

export function useReorder() {
    const y = useMotionValue(0);
    return y;
}
