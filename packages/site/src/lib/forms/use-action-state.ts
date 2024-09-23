"use client"
import { useCallback, useState, useTransition } from "react";
import {Action} from "./actions"

export interface ActionState {
    loading: boolean;
    // TODO: specify
    error: any;
    data: any;
}
/**
 * useActionState is an expiremental react hook as of this writing.
 * However, it is also somewhat trivial to implement.
 * It is a hook that wraps an async function (i.e. server action)
 * in a `useTransition` hook
 */
export function useActionState<ActionArgs extends Array<any>, ActionFn extends (...args: ActionArgs) => Promise<any>>(
    action: ActionFn,
): [(...args: ActionArgs) => Promise<Action.Result>, ActionState] {
    const [loading, startTransition] = useTransition();
    const [error, setError] = useState<any>();
    const [data, setData] = useState<any>();

    const run = useCallback(
        (...p: ActionArgs) => {
            return new Promise<Action.Result>((resolve) => {
                startTransition(async () => {
                    try {
                        setError(undefined);
                        const data = await action(...p);
                        if (data == null || data.errors != null && data.success === false) {
                            setData(undefined);
                            setError(data.errors);
                            resolve(Action.err(data.errors));
                            return;
                        }
                        resolve(Action.ok(data));
                        setData(data);
                    } catch (error) {
                        setError(error);
                        setData(undefined);
                        resolve(Action.err(error as any));
                    }
                });
            });
        },
        [action, loading, startTransition, error, setError, data, setData],
    );

    return [run, { loading, error, data }] as const;
}
