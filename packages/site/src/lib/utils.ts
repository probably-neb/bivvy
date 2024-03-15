import type { ClassValue } from "clsx"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...classLists: ClassValue[]) => twMerge(clsx(classLists))

export function intoMap<V>(obj: Record<string, V>) {
    return new Map(Object.entries(obj))
}

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};
export type Optional<T, Keys extends keyof T> = Simplify<
    Omit<T, Keys> & Partial<Pick<T, Keys>>
>;

export function removeKeys<T, K extends keyof T>(obj: T, keys: K[]) {
    const copy = { ...obj };
    const removed = {} as Pick<T, K>;
    for (const key of keys) {
        removed[key] = copy[key];
        delete copy[key];
    }
    return [
        copy as Simplify<Omit<T, K>>,
        removed as Simplify<Pick<T, K>>,
    ] as const;
}

// allows for a more concise way to check for undefined or null
// without accidentally passing other falsey values (i.e. false and 0)
export function not<T>(val?: T | null | undefined): val is undefined | null {
    return val === undefined || val === null
}

export function isLocal() {
    return import.meta.env.VITE_IS_LOCAL === "true"
}

export function isDev() {
    return isLocal() || window.location.hostname.startsWith("dev")
}

export function assert(value: unknown, message?: string): asserts value {
    if (value)
        return
    console.assert(value, message)
    throw new Error(`Assertion Error: ${message ?? ""} -- ${value} is Falsy`)
}


// NOTE: expects the object to be JSON-serializable
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}
