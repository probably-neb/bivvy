import { DateTime } from "luxon";
import { assert } from "../utils";
import { FieldName } from "./ctx/store";

import * as R from "remeda";

export type Primitive = string | number | boolean | null | undefined;

export type EncodedFormData = Record<FieldName, Primitive>;

type EncodedFormDataMap = Map<FieldName, Primitive>;

type NullableIfOtherNullable<T, OtherT> = OtherT extends null
    ? T | null
    : OtherT extends undefined
      ? T | null
      : T;

export function encodeFormData<T>(obj: T): NullableIfOtherNullable<EncodedFormData, T> {
    let map: EncodedFormDataMap = new Map();
    if (obj == null) {
        // @ts-ignore
        return null;
    }
    encodeAny(map, "", obj)
    return Object.fromEntries(map) as any;
}

// returns the primitive if the value is a primitive,
// otherwise calls the correct encoding function
// using the map and returns null
function encodeAny(map: EncodedFormDataMap, prefix: string, val: any): void {
    const isArray = Array.isArray(val);
    const isObject = R.isObjectType(val);
    const isPrimitive =
        R.isBoolean(val) ||
        R.isNumber(val) ||
        R.isString(val) ||
        R.isNullish(val);
    assert(
        isArray || isObject || isPrimitive,
        "Expected obj to be an array or object or a primitive value",
    );
    if (isArray) {
        encodeArray(map, prefix, val);
    } else if (isObject) {
        encodeObject(map, prefix, val);
    } else if (isPrimitive) {
        assert(
            prefix !== "",
            "prefix should be non empty string if value is primitive",
        );
        map.set(prefix, val);
    }
}

function encodeObject<T extends object>(
    map: EncodedFormDataMap,
    prefix: string,
    obj: T,
): void {
    assert(R.isObjectType(obj), `expected obj at '${prefix}'`)

    if (!R.isPlainObject(obj)) {
        tryEncodeClassObject(map, prefix, obj)
        return;
    }

    const keys = R.keys(obj)
    for (let i = 0; i < keys.length; i++) {
        let objKey = keys[i]!
        let value = obj[objKey]
        if (value === undefined) {
            // leave undefined out, as accessing the key will 
            // return undefined anyway, so it only makes the object
            // bigger
            continue;
        }

        let key = prefix
        if (prefix !== "") {
            key += "."
        }
        key += objKey

        encodeAny(map, key, value)
    }
}

function encodeArray<T extends Array<any>>(
    map: EncodedFormDataMap,
    prefix: string,
    arr: T,
): void {
    assert(R.isArray(arr), `expected array at '${prefix}'`)

    for (let i = 0; i < arr.length; i++) {
        let val = arr[i];
        if (val === undefined) {
            // leave undefined out, as accessing the key will 
            // return undefined anyway, so it only makes the object
            // bigger
            continue;
        }
        let key = prefix + '[' + i + ']'
        encodeAny(map, key, val);
    }
}

function tryEncodeClassObject(map: EncodedFormDataMap, prefix: string, obj: any) {
    if (obj instanceof Date) {
        map.set(prefix, DateTime.fromJSDate(obj).toISO())
        return;
    }
    if (obj instanceof DateTime) {
        map.set(prefix, obj.toISO())
        return
    }
    
    throw new Error(`Tried to encode class object of unrecognized type... where did this come from? Either add this class as a supported class obj in encode-form-data.ts or fix your bug. Object: ${obj}`, {
        cause: 'unrecognized-object'
    })

}
