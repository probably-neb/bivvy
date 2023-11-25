import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


import { useRef } from "react";
import { isEqual } from "lodash";

export type NoInfer<T> = [T][T extends any ? 0 : never];

/** A custom hook derived from the `memo` hook in `@tanstack` libraries.
 *
 * Runs the function if the dependencies have changed (using `===`) similar to what
 * `useMemo` does, however, also checks if the result of `fn` has changed
 * using a deep equality check (using `isEqual` from lodash). The first return value
 * is the result of `fn` and the second value is the result of the deep equals check.
 * The first value is guarunteed to be the same reference if the second value is `false`.
 *
 * This hook allows for update chaining without `useEffect` and the added ability
 * to prevent unnecessary rerenders when the result of `fn` is unchanged after `deps` changes
 */
export function useChanged<TDeps extends readonly any[], TResult>(
    getDeps: () => [...TDeps],
    fn: (args: NoInfer<[...TDeps]>) => TResult,
    debug?: {
        debugKey: any
    },
): [TResult, boolean] {
    let deps = useRef<any[]>(getDeps());
    let result = useRef<TResult | undefined>(undefined);

    let depTime: number;
    if (debug) depTime = Date.now();

    const newDeps = getDeps();

    const depsChanged =
        newDeps.length !== deps.current.length ||
        newDeps.some((dep: any, index: number) => deps.current[index] !== dep);

    if (!depsChanged) {
        return [result.current!, false];
    }

    deps.current = newDeps;

    let resultTime: number;
    if (debug) resultTime = Date.now();

    const newResults = fn(newDeps);
    const resultsChanged = !isEqual(result.current, newResults);
    if (resultsChanged) {
        result.current = newResults;
    }

    if (debug) {
        const depEndTime = Math.round((Date.now() - depTime!) * 100) / 100;
        const resultEndTime =
            Math.round((Date.now() - resultTime!) * 100) / 100;
        const resultFpsPercentage = resultEndTime / 16;

        const pad = (str: number | string, num: number) => {
            str = String(str);
            while (str.length < num) {
                str = " " + str;
            }
            return str;
        };

        console.info(
            `%c⏱ ${pad(resultEndTime, 5)} /${pad(depEndTime, 5)} ms`,
            `
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(
                0,
                Math.min(120 - 120 * resultFpsPercentage, 120),
            )}deg 100% 31%);`,
            debug.debugKey,
        );
    }

    return [result.current!, resultsChanged] as const;
}
