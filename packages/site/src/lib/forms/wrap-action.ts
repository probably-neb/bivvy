import { assert } from "../utils";
import { Action } from "./actions";
import * as R from "remeda";
import { prettifyUnknownError } from "./ctx/prettify-error";
import { FieldErrors } from "./ctx";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function wrapActionResult<Res>(
    fn: () => Promise<Res>,
): Promise<Action.Result<Res, string | FieldErrors>> {
    let result: Action.Result<Res, string | FieldErrors>;
    try {
        const res = await fn();
        if (res != null) {
            if (Action.isResult(res)) {
                if (!res.ok) {
                    throw res.error;
                }
                result = res as any;
            }
            if (R.isError(res)) {
                throw res;
            }
            result = Action.ok(res) as any;
        } else {
            result = Action.ok(undefined) as any;
        }
    } catch (error) {
        result = Action.err(error) as any;
    }
    assert(result != null, "result is not null -- no unhandled cases");
    if (!result.ok) {
        if (isRedirectError(result.error)) {
            // avoid intercepting next redirect errors
            throw result.error
        }
        result.error = prettifyUnknownError(result.error)
    }
    return result;
}
