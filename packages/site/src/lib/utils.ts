import type { ClassValue } from "clsx"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...classLists: ClassValue[]) => twMerge(clsx(classLists))

export function intoMap<V>(obj: Record<string, V>) {
    return new Map(Object.entries(obj))
}
