import { camelCase } from "lodash-es";

/**
 * Returns T | null if OtherT is null or undefined, otherwise returns T
 */
type NullableIfOtherNullable<T, OtherT> = OtherT extends null
    ? T | null
    : OtherT extends undefined
    ? T | null
    : T;

type KeysOf<T> = Extract<keyof T, string>;

/**
 * Just a nicer way to write `T | null | undefined`
 */
type Maybe<T> = T | null | undefined;

export default class Parser<T extends object> {
    constructor(private obj: T) {}

    /**
     *
     * Replace the first key with a new key and the value of `getNew(oldValue)`
     * if oldValue != null (value of newKey will be null if oldValue was null)
     */
    replace<NewType, KRemove extends keyof T, KAdd extends string>(
        key: KRemove,
        newKey: KAdd,
        getNew: (old: NonNullable<T[KRemove]>) => NewType,
    ) {
        const obj = this.obj as any;
        const val = obj[key];
        delete obj[key];
        obj[newKey] = val == null ? null : getNew(val);

        return this as Parser<
            Omit<T, KRemove> & {
                [key in KAdd]: NullableIfOtherNullable<NewType, T[KRemove]>;
            }
        >;
    }

    /**
     * Change the value of a key given some mapping fn `oldValue => newValue`
     */
    reassign<V, K extends KeysOf<T>>(
        key: K,
        getNew: (old: NonNullable<T[K]>) => V,
    ) {
        const obj = this.obj as any;
        const val = obj[key];

        if (val != null) obj[key] = getNew(val);

        return this as Parser<{
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<V, T[key]>
                : T[key];
        }>;
    }

    /**
     * Rename a key to a new name
     * the value of the key will remain unchanged
     */
    rename<KOld extends KeysOf<T>, KNew extends string>(
        key: KOld,
        newKey: KNew,
    ) {
        const obj = this.obj as any;
        obj[newKey] = obj[key];
        delete obj[key];

        return this as Parser<Omit<T, KOld> & { [key in KNew]: T[KOld] }>;
    }

    remove<K extends keyof T>(...keys: Array<K>) {
        const obj = this.obj as any;
        for (const key of keys) {
            delete obj[key];
        }
        return this as Parser<Omit<T, (typeof keys)[number]>>;
    }

    renameAll<Keys extends string, Rep extends Record<keyof T & Keys, string>>(
        replacements: Rep,
    ) {
        const obj = this.obj as any;
        for (const [oldKey, newKey] of Object.entries(replacements)) {
            obj[newKey as any] = obj[oldKey];
            delete obj[oldKey];
        }
        return this as Parser<
            Omit<T, keyof Rep> & {
                [key in keyof Rep as Rep[key]]: T[key & keyof T];
            }
        >;
    }

    cast<K extends keyof T, NewKeyType>() {
        return this as Parser<{
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<NewKeyType, T[key]>
                : T[key];
        }>;
    }

    // TODO: replace with `convertToCamelCase(keys: string[])` + `ensureAllSnakeCase()` pair
    // for better runtime performance (no search for `_` in keys)
    allKeysToCamelCase() {
        const obj = this.obj as any;
        for (const key in obj) {
            if (!key.includes("_")) continue;
            const newKey = camelCase(key);
            obj[newKey] = obj[key];
            delete obj[key];
        }
        type CamelCaseKeys = Extract<keyof T, `${string}_${string}`>;

        type CamelCase<T extends string> = T extends `${infer F}_${infer R}`
            ? `${F}${Capitalize<CamelCase<R>>}`
            : T;

        return this as Parser<
            Omit<T, CamelCaseKeys> & {
                [key in CamelCaseKeys as CamelCase<key>]: T[key];
            }
        >;
    }

    allDatesTOUnixMillis() {
        const obj = this.obj as any;
        for (const [key, val] of Object.entries(obj)) {
            if (val instanceof Date) {
                obj[key] = val.getTime();
            }
        }

        return this as Parser<{
            [key in keyof T]: Date extends T[key]
                ? NullableIfOtherNullable<number, T[key]>
                : T[key];
        }>;
    }

    /**
     * Converts a string field to a boolean.
     *  using `T[key] === "true"`
     */
    strToBool<K extends KeyOfFieldWithType<T, string>>(key: K) {
        const obj = this.obj as any;
        const val = obj[key];
        if (val != null) obj[key] = obj[key] === "true";
        return this as Parser<{
            [key in keyof T]: key extends K ? boolean : T[key];
        }>;
    }

    /**
     * Converts a number field to a boolean.
     *  0 => `false`
     *  _ => `true`
     */
    intToBool<K extends KeyOfFieldWithType<T, number>>(key: K) {
        const obj = this.obj as any;
        const val = obj[key];
        if (val != null) obj[key] = obj[key] !== 0;
        return this as Parser<{
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<boolean, T[key]>
                : T[key];
        }>;
    }

    intToDate<K extends KeyOfFieldWithType<T, number>>(key: K) {
        const obj = this.obj as any;
        const val = obj[key];
        if (val != null) obj[key] = new Date(val);
        return this as Parser<{
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<Date, T[key]>
                : T[key];
        }>;
    }

    b64Decode<K extends keyof T>(key: K) {
        const obj = this.obj as any;
        const val = obj[key];
        if (val != null) obj[key] = b64Decode(obj[key]);
        return this as unknown as T[K] extends Maybe<string>
            ? Parser<T>
            : never;
    }

    /**
     * A special variant of `rename` specifically
     * for renaming the primary key (often in the form `{table_name}_id` to `id`
     * @param key - key to set to id
     * @returns new Parser without the property `{key}` and `id` set to the previous value of `T[key]`
     */
    id<K extends keyof T>(key: K) {
        const obj = this.obj as any;
        const val = obj[key];
        obj["id"] = val;
        delete obj[key];
        return this as Parser<Omit<T, K> & { id: T[K] }>;
    }

    default<K extends keyof T, V extends NonNullable<T[K]>>(key: K, value: V) {
        if (this.obj[key] == null) {
            this.obj[key] = value;
        }
        return this as Parser<{
            [key in keyof T]: key extends K
                ? Exclude<T[key] | V, null | undefined>
                : T[key];
        }>;
    }

    add<K extends string, V>(key: K, value: V) {
        const obj = this.obj as any;
        obj[key] = value;
        return this as Parser<T & { [key in K]: V }>;
    }

    or_undefined<K extends keyof T>(key: K) {
        const obj = this.obj as any;
        if (obj[key] == null) {
            obj[key] = undefined;
        }
        return this as Parser<{
            [key in keyof T]: key extends K ? NonNullable<T[key]> | undefined : T[key];
        }>;
    }

    value() {
        return this.obj as Simplify<T>;
    }
}

type KeyOfFieldWithType<T, Type> = {
    [key in keyof T]: T[key] extends Maybe<Type> ? key : never;
}[keyof T];

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

function b64Decode(i: string) {
    return Buffer.from(i, "base64").toString("utf8");
}

function num2Bool(n: number) {
    return n === 0 ? false : true;
}
