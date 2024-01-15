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
