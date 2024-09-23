import { z } from "zod";
import * as R from "remeda";

import { type FieldErrors } from "./store";
import { TRPCError } from "@trpc/server";

export function prettifyError(err: Error): FieldErrors | string {
    let msg = "";
    if (err instanceof TRPCError) {
        // TODO: handle different err.code values
        // i.e. do not show INTERNAL_SERVER_ERROR messages
        // should also format the code messages in a nicer way
        let trpcError = err;
        // TODO: just check if is error and return prettify error
        // on error
        if (trpcError.cause != null) {
            err = trpcError.cause;
        }
    }

    if (err instanceof z.ZodError) {
        return prettifyZodError(err);
    }

    // FIXME: do not show too much information
    return err.message;
}

// NOTE: if either one of these must be extended to support null,
// make sure the places they are used filter/handle null correctly
const zMultiErrorRecord = z.record(z.string().array())
const zSingleErrorRecord = z.record(z.string())

export function prettifyUnknownError(
    err: unknown,
): FieldErrors | string {
    if (!err) {
        return 'Error: Unknown Error';
    }
    if (R.isError(err)) {
        return prettifyError(err)
    }
    if (R.isString(err)) {
        return err
    }

    if (R.isPlainObject(err)) {
        // check if err is Record<string, Array<string>>
        let multiRecord = zMultiErrorRecord.safeParse(err);
        if (multiRecord.success) {
            return formatMutliErrorMap(R.entries(multiRecord.data));
        }

        // check if err is Record<string, string>
        let record = zSingleErrorRecord.safeParse(err)
        if (record.success) {
            return record.data;
        }
    }

    console.warn("could not prettify unrecognized error variant", err);
    return String(err);
}

export function prettifyZodError(err: z.ZodError): FieldErrors {
    let errMap = new Map<string, string[]>();

    // FIXME: zod complaining about top level arrays

    for (const issue of err.issues) {
        let path = issue.path;
        let name = zodPathToName(path);
        // TODO: use `zod-validation-error` on npm to make nice message
        let message = issue.message;

        let existing = errMap.get(name);
        if (existing != null) {
            existing.push(message);
        } else {
            errMap.set(name, [message]);
        }
    }

    const prefix = "Validation Error: ";

    const errors = formatMutliErrorMap(Array.from(errMap.entries()), prefix);

    return errors;
}

function formatMutliErrorMap(
    entries: Array<[string, Array<string>]>,
    prefix: string = "Error: ",
): FieldErrors {
    return R.pipe(
        entries,
        R.map(
            ([name, messages]) => [name, prefix + messages.join("; ")] as const,
        ),
        R.fromEntries(),
    );
}

export function zodPathToName(path: Array<string | number>) {
    if (path.length === 0) return "";
    let name = "";
    let isFirst = true;
    for (const p of path) {
        let subpath;
        if (Number.isInteger(p)) {
            subpath = "[" + p + "]";
        } else if (!isFirst) {
            subpath = "." + p;
        } else {
            subpath = p;
        }
        name += subpath;
        isFirst = false;
    }
    return name;
}
