type Arg = string | boolean | number | undefined | null;

export function cn(...args: Arg[]): string {
    return args.filter(Boolean).join(" ");
}
