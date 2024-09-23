import { assert } from "@/lib/utils";
import {z} from "zod";
import { EncodedFormData } from "./encode-form-data";

/**
* A zod helper for parsing and validating FormData objects
* the intended use is to import this, and use it with `.pipe`
* like so
*
* ```ts
* import {zFormData} from "{path}";
* const mySchema = z.object({...fields})
* const data = zFormData.pipe(mySchema).parse(submission)
* ```
*/
export const zFormData = z.any()
    .refine<FormData>((a): a is FormData => (a instanceof FormData), "Invalid value passed to zFormData, expected a FormData")
    .transform((formData) => decodeFormData(formData))

/**
 * A helper for decoding, parsing, and validating FormData objects
 * (usually recieved through server actions)
 * Expects that the names of the form elements submitted with the form
 * conform to the following rules:
 * 1. nested fields are separated by `'.'`
 * 2. array elements are denoted by `[0]`, `[1]`, etc
 *
 * Example:
 *
 * ```js
 * FormData {
 *   [Symbol(state)]: [
 *     { name: 'friendlyName', value: 'p2 test' },
 *     { name: 'codeName', value: 'p2 test 1' },
 *     {
 *       name: 'description',
 *       value: 'a test of making assessments using p2'
 *     },
 *     { name: 'questions[0].questionType', value: 'multiple choice' },
 *     { name: 'questions[0].orderNum', value: '0' },
 *     { name: 'questions[0].prompt', value: 'What color is the sky' },
 *     { name: 'questions[0].options[0].text', value: 'blue' },
 *     { name: 'questions[0].options[0].points', value: '10' },
 *     { name: 'questions[0].options[1].text', value: 'yellow' },
 *     { name: 'questions[0].options[1].points', value: '0' }
 *   ]
 * }
 * ```
 *
 * results in:
 *
 * ```js
 * {
 *   friendlyName: 'p2 test',
 *   codeName: 'p2 test 1',
 *   description: 'a test of making assessments using p2',
 *   questions: [
 *     {
 *       questionType: 'multiple choice',
 *       orderNum: '0',
 *       prompt: 'What color is the sky',
 *       options: [
 *         { text: 'blue', points: '10' },
 *         { text: 'yellow', points: '0' }
 *       ]
 *     }
 *   ]
 * }
 * ```
*/
export function decodeFormData(formData: FormData): any {
    let obj: any = {};
    for (const key of formData.keys()) {
        if (key.startsWith("$ACTION_ID")) {
            // skip nextjs action id
            continue
        }

        let cur: any = obj;
        // split on '.' or '['
        // "a.b[0].c" => ["a", "b", "0]", "c"]
        const pathItems = key.split(/[\.\[]/);

        while (pathItems.length > 1) {
            let item = pathItems.shift()!;

            const nextIsArray = pathItems[0]?.at(-1) === "]"

            if (item === "" && nextIsArray) {
                // handle case where top level item is an array
                // i.e. "[0].a.b.c" => pathItems := ["", "0]", "a", "b", "c"]
                const isTopLevel = Object.is(cur, obj)
                // top level array is only time empty item is ok
                assert(isTopLevel,"Malformed empty path, found at: " + key)

                if (!Array.isArray(obj)) {
                    // if not already changed to an array, set top level obj to an array
                    // TODO: assert obj is empty by num keys or other (can't have top level array and obj)
                    obj = new Array()
                    cur = obj
                }
                continue
            }
            if (item === "") {
                throw new Error("Malformed empty path, found at: " + key);
            }

            if (item.at(-1) === "]") {
                assert(Array.isArray(cur), "did not set array elem to array")
                // remove trailing ']'
                item = item.slice(0, -1)
            }
            if (cur[item] == null) {
                cur[item] = nextIsArray ? [] : {};
            }
            cur = cur[item]
        }
        assert(pathItems.length === 1, "pathItems.length !== 1 after loop")
        let item = pathItems[0]!;
        if (item.at(-1) === "]") {
            assert(Array.isArray(cur), "did not set last array elem to array")
            // remove trailing ']'
            item = item.slice(0, -1)
        }

        const value = formData.getAll(key);

        assert(value.length > 0, "value is empty")
        // NOTE: array entries should be specified with the `[${num}]` syntax in
        // the path not with multiple fields, although this can be changed...
        assert(value.length === 1, `found conflicting key entries for: '${key}'`)

        if (value[0] !== undefined) {
            // skip undefined values
            cur[item] = value[0];
        }
    }
    return obj
}


export function decodeObjFormData(formData: EncodedFormData): any {
    let obj: any = {};
    for (const key of Object.keys(formData)) {
        if (key.startsWith("$ACTION_ID")) {
            // skip nextjs action id
            continue
        }

        let cur: any = obj;
        // split on '.' or '['
        // "a.b[0].c" => ["a", "b", "0]", "c"]
        const pathItems = key.split(/[\.\[]/);

        while (pathItems.length > 1) {
            let item = pathItems.shift()!;

            const nextIsArray = pathItems[0]?.at(-1) === "]"

            if (item === "" && nextIsArray) {
                // handle case where top level item is an array
                // i.e. "[0].a.b.c" => pathItems := ["", "0]", "a", "b", "c"]
                const isTopLevel = Object.is(cur, obj)
                // top level array is only time empty item is ok
                assert(isTopLevel,"Malformed empty path, found at: " + key)

                if (!Array.isArray(obj)) {
                    // if not already changed to an array, set top level obj to an array
                    // TODO: assert obj is empty by num keys or other (can't have top level array and obj)
                    obj = new Array()
                    cur = obj
                }
                continue
            }
            if (item === "") {
                throw new Error("Malformed empty path, found at: " + key);
            }

            if (item.at(-1) === "]") {
                assert(Array.isArray(cur), "did not set array elem to array")
                // remove trailing ']'
                item = item.slice(0, -1)
            }
            if (cur[item] == null) {
                cur[item] = nextIsArray ? [] : {};
            }
            cur = cur[item]
        }
        assert(pathItems.length === 1, "pathItems.length !== 1 after loop")
        let item = pathItems[0]!;
        if (item.at(-1) === "]") {
            assert(Array.isArray(cur), "did not set last array elem to array")
            // remove trailing ']'
            item = item.slice(0, -1)
        }

        const value = formData[key];

        // skip undefined values
        if (value !== undefined) {
            cur[item] = value
        }

    }
    return obj
}
