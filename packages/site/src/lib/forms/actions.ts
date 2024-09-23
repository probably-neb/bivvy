export * as Action from "./actions";
import { z } from "zod";
import * as R from "remeda";

export interface ResultOk<Data = any> {
    ok: true;
    data: Data;
    error: undefined;
}

export interface ResultErr<Err = Error> {
    ok: false;
    data: undefined;
    error: Err;
}

export type Result<Data = any, Err = Error> = ResultOk<Data> | ResultErr<Err>;

export function ok<Data = any>(data: Data): ResultOk<Data> {
    return {
        ok: true,
        data,
        error: undefined,
    } as const;
}

export function err<Err = Error>(error: Err): ResultErr<Err> {
    return {
        ok: false,
        data: undefined,
        error,
    } as const;
}

export type Fn<Input = FormData, Output = void> = (i: Input) => Promise<Output>;

export type ExtractErr<T> = T extends Result<infer Data, infer Err>
    ? Err | Error
    : Error;
export type ExtractData<T> = T extends Result<infer Data, infer Err> ? Data : T;

export function isResult<Data = unknown, Err = unknown>(
    obj: unknown,
): obj is Result<Data, Err> {
    if (!obj || !R.isPlainObject(obj)) {
        return false;
    }
    let hasOk = "ok" in obj && typeof obj["ok"] === "boolean";
    let hasDataOrError = "error" in obj || "data" in obj;
    return hasOk && hasDataOrError;
}

