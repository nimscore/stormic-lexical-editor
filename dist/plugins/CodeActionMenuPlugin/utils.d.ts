export declare function useDebounce<T extends (...args: never[]) => void>(fn: T, ms: number, maxWait?: number): import("lodash-es").DebouncedFunc<(...args: Parameters<T>) => void>;
