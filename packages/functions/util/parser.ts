import { ZodTypeAny, z } from "zod";

// TODO: Add more documentation
// PERF: Change the functions and types to be based on Array<T> instead of T
//       (i.e. wrap each method in a for loop)
//       This will theoretically improve performance by
//          reducing the number of allocations further:
//          - one parser created for the entire array instead of each array item
//          - no need for a `map` call (resulting in a newly allocated array of object references)
//            when using the Parser just so typescript can infer the array element type
//            based on the return type of `parser.value()`
//          Giving more info to the JIT:
//          - more likely the JIT kicks in within each method call due to the tighter loop
//            around each method as opposed to running each method one after another for each item in the list
/**
 * A class that allows for easy (and typesafe) manipulation of objects
 * Designed to be a performant way to manipulate objects coming from the database
 * through drizzle while minimizing memory allocations, and providing type safety
 * i.e. it was created to provide a balance between the performant way to manipulate objects
 * and the type safe way to manipulate objects
 *
 * The name is a bit of a misnomer, as it is more of a mutator than a parser
 * it was created because typescript does not update a type based on mutations to the object
 * eg. `a.name = a.firstName + " " + a.lastName` does not upsert the type of field `name` to string
 * Mutations are valuable especially when dealing with the database objects as there is no
 * need to allocate an entirely new array of objects and throwing the old ones away
 * when we can just mutate the existing ones
 */

export default class Parser<T extends object, Single extends boolean = false> {
    constructor(private arr: Array<T>, private single = false) {}

    static single<T extends object>(obj: T): Parser<T, true> {
        let arr = [obj];
        if (obj == null || obj == undefined) {
            arr = [];
        }
        return new Parser(arr, true);
    }

    static all<T extends object>(arr: Array<T>): Parser<T, false> {
        return new Parser(arr, false);
    }

    static parseOne<From extends object, To extends object>(
        input: From,
        parseFn: SpecificParseFn<From, To, boolean>
    ): To {
        return Parser.single(input)
            .runParserOnSubset(parseFn as SpecificParseFn<From, To, true>)
            .value() as To;
    }

    static parseMany<From extends object, To extends object>(
        input: Array<From>,
        parseFn: SpecificParseFn<From, To, false>
    ): Array<To> {
        return Parser.all(input).runParserOnSubset(parseFn).value();
    }

    replace<NewType, KRemove extends KeysOf<T>, KAdd extends string>(
        key: KRemove,
        newKey: KAdd,
        getNew: (old: NonNullable<T[KRemove]>) => NewType,
        defaultValue: NoInfer<NewType>
    ): Parser<
        Simplify<
            Omit<T, KRemove> & {
                [key in KAdd]: key extends KRemove ? never : NewType;
            }
        >,
        Single
    >;
    replace<NewType, KRemove extends KeysOf<T>, KAdd extends string>(
        key: KRemove,
        newKey: KAdd,
        getNew: (old: NonNullable<T[KRemove]>) => NewType
    ): Parser<
        Simplify<
            Omit<T, KRemove> & {
                [key in KAdd]: key extends KRemove
                    ? never
                    : NullableIfOtherNullable<NewType, T[KRemove]>;
            }
        >,
        Single
    >;
    replace<NewType, KRemove extends KeysOf<T>, KAdd extends string>(
        key: KRemove,
        newKey: KAdd,
        getNew: (old: NonNullable<T[KRemove]>) => NewType,
        defaultValue?: NewType
    ): Parser<
        Simplify<
            Omit<T, KRemove> & {
                [key in KAdd]: key extends KRemove
                    ? never
                    : NullableIfOtherNullable<NewType, T[KRemove]>;
            }
        >,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            if (!(key in obj)) {
                obj[newKey] = defaultValue;
                continue;
            }
            const val = obj[key];
            delete obj[key];
            obj[newKey] = val == null ? defaultValue ?? val : getNew(val);
        }
        return this as any;
    }

    reassign<V, K extends KeysOf<T>>(
        key: K,
        getNew: (old: NonNullable<T[K]>) => V
    ): Parser<Simplify<Reassign<T, K, V>>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            const val = obj[key];

            if (val != null) obj[key] = getNew(val);
        }

        return this as any;
    }

    fromUnixMillis<K extends KeyOfType<T, number>>(
        ...keys: K[]
    ): Parser<
        Simplify<
            Omit<T, K> & {
                [key in K]: NullableIfOtherNullable<Date, T[key]>;
            }
        >,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            let elem = arr[i];
            if (elem == null) continue;
            for (const key of keys) {
                if (elem[key] == null) continue;
                elem[key] = new Date(elem[key]);
            }
        }
        return this as any;
    }

    toUnixMillis<Keys extends KeyOfType<T, Date>>(
        ...keys: Keys[]
    ): Parser<
        Simplify<
            Omit<T, Keys> & {
                [key in Keys]: NullableIfOtherNullable<number, T[key]>;
            }
        >,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            let elem = arr[i];
            if (elem == null) continue;
            for (const key of keys) {
                if (elem[key] == null) continue;
                elem[key] = elem[key].getTime();
            }
        }
        return this as any;
    }

    rename<KOld extends KeysOf<T>, KNew extends string>(
        key: KOld,
        newKey: KNew
    ): Parser<Simplify<Rename<T, KOld, KNew>>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            obj[newKey] = obj[key];
            if (key in obj) delete obj[key];
        }
        return this as any;
    }

    remove<Keys extends KeysOf<T>>(
        ...keys: Array<Keys>
    ): Parser<Simplify<Omit<T, Keys>>, Single> {
        let arr = this.arr as Array<any>;
        for (const key of keys) {
            for (let i = 0; i < arr.length; i++) {
                const obj = arr[i] as any;
                if (key in obj) delete obj[key];
            }
        }
        return this as any;
    }

    cast<K extends keyof T, NewKeyType>(): Parser<
        {
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<NewKeyType, T[key]>
                : T[key];
        },
        Single
    > {
        return this as any;
    }

    /**
     * A stylistic helper to aid in finding snake case keys in a object
     * as the rule is to use camel case keys outside of the database
     * Lies to typescript saying that it returns something other than a
     * parser. It does actually return the parser so it will not break or
     * error at runtime, but typscript thinks it returns a human
     * readable object with the camel case keys that exist on the object
     *
     * Recommended usage is to call this before chaining a few more methods so a type, as the methods won't exist on the type we tell typescript
     * we return so it will result in a type error
     */
    expectNoSnakeCaseKeys(): SnakeCaseKeysOf<T> extends never
        ? Parser<T, Single>
        : {
              error: "There are still snake case keys in the object";
              keys: SnakeCaseKeysOf<T>;
          } {
        return this as any;
    }

    toCamelCase<Keys extends SnakeCaseKeysOf<T>>(
        ...keys: Array<Keys>
    ): Parser<
        Simplify<Omit<T, Keys> & { [key in Keys as CamelCase<key>]: T[key] }>,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (const key of keys) {
            for (let i = 0; i < arr.length; i++) {
                const obj = arr[i] as any;
                if (!(key in obj)) continue;
                const val = obj[key];
                delete obj[key];
                let ccKey = camelCase(key);
                if (ccKey.endsWith("Id")) {
                    ccKey = ccKey.slice(0, ccKey.length - 1) + "D";
                }
                obj[ccKey] = val;
            }
        }
        return this as any;
    }

    toDate<Keys extends KeyOfType<T, string | number>>(
        ...keys: Array<Keys>
    ): Parser<
        Simplify<{
            [key in keyof T]: key extends Keys
                ? NullableIfOtherNullable<Date, T[key]>
                : T[key];
        }>,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (const key of keys) {
            for (let i = 0; i < arr.length; i++) {
                const obj = arr[i] as any;
                const val = obj[key];
                if (val != null) {
                    obj[key] = new Date(val);
                }
            }
        }
        return this as any;
    }

    /**
     * Converts a string field to a boolean.
     *  using `T[key] === "true"`
     */
    strToBool<K extends KeyOfType<T, string>>(
        key: K
    ): Parser<{ [key in keyof T]: key extends K ? boolean : T[key] }, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i] as any;
            const val = obj[key];
            if (val != null) obj[key] = obj[key] === "true";
        }
        return this as any;
    }

    /**
     * Converts a number field to a boolean.
     *  0 => `false`
     *  _ => `true`
     */
    intToBool<K extends KeyOfType<T, number>>(
        key: K
    ): Parser<
        {
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<boolean, T[key]>
                : T[key];
        },
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i] as any;
            const val = obj[key];
            if (val != null) obj[key] = obj[key] !== 0;
        }
        return this as any;
    }

    intToBoolOrDefault<K extends KeyOfType<T, number>>(
        key: K,
        default_: boolean
    ): Parser<{ [key in keyof T]: key extends K ? boolean : T[key] }, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i] as any;
            const val = obj[key];
            if (val == null) {
                obj[key] = default_;
            } else {
                obj[key] = obj[key] !== 0;
            }
        }
        return this as any;
    }

    /**
     * Converts a number field to a boolean.
     *  0 => `false`
     *  _ => `true`
     */
    boolToInt<K extends KeyOfType<T, boolean>>(
        key: K
    ): Parser<
        Simplify<{
            [key in keyof T]: key extends K
                ? NullableIfOtherNullable<number, T[key]>
                : T[key];
        }>,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i] as any;
            const val = obj[key];
            if (val != null) obj[key] = obj[key] ? 1 : 0;
        }
        return this as any;
    }

    b64Decode<K extends KeyOfType<T, string>>(key: K) {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            const val = obj[key];
            if (val != null) obj[key] = b64Decode(obj[key]);
        }
        return this;
    }

    /**
     * A special variant of `rename` specifically
     * for renaming the primary key (often in the form `{table_name}_id` to `id`
     * @param key - key to set to id
     * @returns new Parser without the property `{key}` and `id` set to the previous value of `T[key]`
     */
    id<K extends keyof T>(key: K): Parser<Omit<T, K> & { id: T[K] }, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            const val = obj[key];
            obj["id"] = val;
            delete obj[key];
        }
        return this as any;
    }

    default<K extends keyof T, V extends NonNullable<T[K]>>(
        key: K,
        value: NoInfer<V>
    ): Parser<
        {
            [key in keyof T]: key extends K
                ? Exclude<T[key] | V, null | undefined>
                : T[key];
        },
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][key] == null) {
                arr[i][key] = value;
            }
        }
        return this as any;
    }

    defaultInfer<K extends keyof T, V>(
        key: K,
        value: V
    ): Parser<
        {
            [key in keyof T]: key extends K
                ? Exclude<T[key], null | undefined> | V
                : T[key];
        },
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i][key] == null) {
                arr[i][key] = value;
            }
        }
        return this as any;
    }



    addComputed<K extends string, V>(
        key: K,
        gen: (obj: T) => V
    ): Parser<T & { [key in K]: V }, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            let obj = arr[i];
            if (obj != null) {
                obj[key] = gen(obj);
            }
        }
        return this as any;
    }

    addComputedToNestedArray<
        Nested extends KeyOfType<T, Array<any>>,
        K extends string,
        Val
    >(
        key: Nested,
        newKey: K,
        gen: (obj: T) => Val
    ): T[Nested] extends Array<infer NestedItem>
        ? Parser<
              Simplify<
                  Omit<T, Nested> & {
                      [key in Nested]: Array<
                          Simplify<NestedItem & { [key in K]: Val }>
                      >;
                  }
              >,
              Single
          >
        : never {
        const arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            let elem = arr[i];
            if (elem == null) continue;
            let nested = elem[key];
            if (nested == null || !Array.isArray(nested)) continue;
            for (let j = 0; j < nested.length; j++) {
                if (nested[j] == null) continue;
                nested[j][newKey] = gen(elem);
            }
        }

        return this as any;
    }

    computedDefault<K extends keyof T, V>(
        key: K,
        getDefaultValue: (obj: T) => V
    ): Parser<
        {
            [key in keyof T]: key extends K
                ? Exclude<T[key] | V, null | undefined>
                : T[key];
        },
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            let obj = arr[i];
            if (obj[key] == null) {
                obj[key] = getDefaultValue(obj);
            }
        }
        return this as any;
    }

    defaultNull<K extends KeysOf<T> & string>(
        ...keys: Array<K>
    ): Parser<
        Simplify<
            Omit<T, K> & {
                [key in K]: key extends keyof T
                    ? NullableIfOtherNullable<NonNullable<T[key]>, T[key]>
                    : null;
            }
        >,
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            for (const key of keys) {
                if (arr[i] == null) continue;
                if (arr[i][key] === undefined) {
                    arr[i][key] = null;
                }
            }
        }
        return this as any;
    }

    // TODO: probably should not lie and say it is NonNullable
    expectNotNull<Keys extends KeysOf<T>>(
        ...keys: Array<Keys>
    ): Parser<
        { [key in keyof T]: key extends Keys ? NonNullable<T[key]> : T[key] },
        Single
    > {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            for (const key of keys) {
                if (arr[i] != null && arr[i][key] == null) {
                    console.warn(
                        `Expected ${key} to be non-null, but got ${arr[i][key]}. This means this key will be null despite the type saying otherwise!`
                    );
                }
            }
        }
        return this as any;
    }

    /**
     * WARN: This is a hacky way to get around TypeScripts inference
     * limitations causing the type casts in the Parser functions to struggle or fail
     * completely when the input type is `KnownType & UnknownType` or `extends KnownType`
     *
     * This function gets around the aformentioned limitations by taking a parse function
     * that is expected to be a wrapper around another Parser (ex. `(obj: Sub) => new Parser(obj).remove("foo").value()`)
     * that takes some known type that is a subset of `T`, does some mutations on the object,
     * and returns the same object casted as a new type so this function can figure out the changes.
     */
    parseSubset<Sub, NewSub>(
        fn: (o: Sub) => NewSub
    ): Parser<Omit<T, keyof Sub> & NewSub, Single> {
        // NOTE: result unused! Changes are expected to be mutations!
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            fn(arr[i]);
        }
        return this as any;
    }

    transformSubset<Sub, NewSub>(
        fn: (o: Sub) => NewSub
    ): Parser<Omit<T, keyof Sub> & NewSub, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            Object.assign(arr[i], fn(arr[i]));
        }
        return this as any;
    }

    runParserOnSubset<Fn extends (o: Parser<any, any>) => Parser<any, any>>(
        fn: Fn
    ): Fn extends (o: Parser<infer Sub, any>) => Parser<infer NewSub, any>
        ? Parser<Simplify<Omit<T, keyof Sub> & NewSub>, Single>
        : never {
        return fn(this as any) as any;
    }

    parseNested<
        Key extends KeyOfType<T, object>,
        Out,
        Fn extends (o: T[Key]) => Out
    >(key: Key, fn: Fn): Parser<Reassign<T, Key, Out>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            let obj = arr[i];
            if (key in obj && obj[key] != null) {
                obj[key] = fn(obj[key]);
            }
        }
        return this as any;
    }

    /**
     * WARN: expects parseFn to mutate the objects in place. A call to `deepCopy`
     * will break this, and the return value of the parseFn is ignored
     *
     * NOTE: If you are planning to follow this with a call to `flatten`
     * on the same key, it is more efficient to call `flatten` first
     * then use `runParserOnSubset`
     */
    runParserOnNested<
        Key extends KeyOfType<T, object>,
        Val extends object = T[Key] extends object ? T[Key] : never,
        Fn extends SpecificParseFn<Val, any, any> = SpecificParseFn<
            Val,
            any,
            any
        >
    >(
        key: Key,
        fn: Fn
    ): Fn extends SpecificParseFn<Val, infer Out, any>
        ? Parser<Reassign<T, Key, Simplify<Out>>, Single>
        : never {
        let arr = this.arr as Array<any>;
        let nestedArr = arr.map((obj) => obj[key]);
        Parser.all(nestedArr).runParserOnSubset(fn);
        return this as any;
    }

    // runParserOnNestedArray<
    //     Key extends KeyOfType<T, Array<object>>,
    //     Arr extends Array<object> = T[Key] extends Array<object>
    //         ? T[Key]
    //         : never,
    //     Val extends object = Arr extends Array<infer Val> ? Val : never,
    //     Fn extends SpecificParseFn<Val, any, any> = SpecificParseFn<
    //         Val,
    //         any,
    //         any
    //     >,
    // >(
    //     key: Key,
    //     fn: Fn,
    // ): Fn extends SpecificParseFn<Val, infer Out, any>
    //     ? Parser<Reassign<T, Key, Array<Simplify<Out>>>, Single>
    //     : never {
    //     let arr = this.arr as Array<any>;
    //     let nestedArr = arr.flatMap((obj) => obj[key]);
    //     Parser.all(nestedArr).runParserOnSubset(fn);
    //     return this as any;
    // }

    runParserOnNestedArray<
        Key extends KeyOfType<T, Array<object>>,
        Arr extends Array<object> = T[Key] extends Array<object>
            ? T[Key]
            : never,
        Val extends object = Arr extends Array<infer Val> ? Val : never,
        Fn extends SpecificParseFn<Val, any, any> = SpecificParseFn<
            Val,
            any,
            any
        >
    >(
        key: Key,
        fn: Fn
    ): Fn extends SpecificParseFn<Val, infer Out, any>
        ? Parser<Reassign<T, Key, Array<Simplify<Out>>>, Single>
        : never {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const elem = arr[i];
            if (elem == null) continue;
            const nestedArr = elem[key];
            if (nestedArr == null || !Array.isArray(nestedArr)) continue;
            this.arr = nestedArr;
            this.runParserOnSubset(fn);
        }
        this.arr = arr;
        return this as any;
    }

    set<K extends KeysOf<T>, Val extends T[K] & any>(
        key: K,
        value: Val
    ): Parser<Simplify<T & { [key in K]: Val }>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == null) continue;
            arr[i][key] = value;
        }
        return this as any;
    }

    add<K extends string, V>(
        key: K,
        value: V
    ): Parser<Simplify<T & { [key in K]: V }>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            arr[i][key] = value;
        }
        return this as any;
    }

    flatten<
        V extends Record<string, any>,
        K extends KeyOfNonNullableType<T, V>
    >(key: K): Parser<Simplify<Omit<T, K> & T[K]>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            const sub = obj[key];
            if (sub == null) continue;
            delete obj[key];
            for (const [key, val] of Object.entries(sub)) {
                obj[key] = val;
            }
        }
        return this as any;
    }

    newID<IDField extends string, ID>(
        field: IDField,
        gen: (val: T) => ID
    ): Parser<T & { [key in IDField]: ID }, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            obj[field] = gen(obj);
        }
        return this as any;
    }

    sortBy<Key extends KeyOfType<T, number>>(key: Key): Parser<T, Single> {
        this.arr.sort((a, b) => {
            if (a == null) return 1;
            if (b == null) return -1;
            if (a[key] == null) return 1;
            if (b[key] == null) return -1;
            return (a[key] as number) - (b[key] as number);
        });
        return this;
    }

    b64Encode<K extends KeyOfType<T, string>>(key: K) {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            const val = obj[key];
            if (val != null && typeof val === "string")
                obj[key] = b64Encode(val);
        }
        return this;
    }

    jsonEncode<K extends KeyOfType<T, object>>(
        key: K
    ): Parser<{ [key in keyof T]: key extends K ? string : T[key] }, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            const val = obj[key];
            if (val != null) obj[key] = JSON.stringify(val);
        }
        return this as any;
    }

    jsonDecode<K extends KeyOfType<T, string>, Res = any>(key: K) {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            if (obj == null) continue;
            const val = obj[key];
            if (val == null || typeof val !== 'string') continue;
            obj[key] = JSON.parse(val);
        }
        return this as any;
    }

    validate<Schema extends ZodTypeAny>(
        validator: Schema
    ): Parser<z.infer<Schema>, Single> {
        if (this.single) {
            validator.parse(this.arr[0]);
        } else {
            z.array(validator).parse(this.arr);
        }
        return this as any;
    }

    safeValidate<Schema extends ZodTypeAny>(
        validator: Schema
    ): Parser<z.infer<Schema>, Single> {
        let arr = this.arr as Array<any>;
        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            arr[i] = validator.safeParse(obj);
        }
        return this as any;
    }

    /**
     * Usefull for extracting an array (or single) object that
     * is a subset of the original object
     * ex.
     * ```
     * const tmp = Parser.all(items)
     *  .rename("otherTableID", "other_table_id")
     *  .add("id", () => generateNewID())
     * const tableToOtherTableValues = tmp.extract("id", "other_table_id")
     * const values = tmp.remove("other_table_id").value()
     * await db.transaction(tx => {
     *   await tx
     *      .insert(schema.table)
     *      .values(values)
     *   await tx
     *       .insert(schema.tableToOtherTable)
     *       .values(tableToOtherTableValues)
     * })
     * ```
     */
    extract<Keys extends KeysOf<T>, Value extends Pick<T, Keys>>(
        ...keys: Array<Keys>
    ): Single extends true ? Simplify<Value> : Array<Simplify<Value>> {
        let values = this.arr.map((obj) =>
            obj != null
                ? keys.reduce((acc, key) => {
                      acc[key] = obj[key];
                      return acc;
                  }, {} as any)
                : undefined
        );
        if (this.single) {
            return values.at(0) as any;
        }
        return values as any;
    }
    deepCopy(): Parser<T, Single> {
        this.arr = deepCopy(this.arr);
        return this;
    }

    dir(): Parser<T, Single> {
        console.dir(this.arr, { depth: null });
        return this;
    }

    value(): Single extends true ? Simplify<T> : Simplify<Array<T>> {
        if (this.single) {
            return this.arr.at(0) as any;
        }
        return this.arr as any;
    }
}

type NullableIfOtherNullable<T, OtherT> = OtherT extends null
    ? T | null
    : OtherT extends undefined
    ? T | null
    : T;

type KeysOf<T> = Extract<keyof T, string>;

type Maybe<T> = T | null | undefined;

export type KeyOfType<T, Type> = {
    [key in keyof T]: T[key] extends Maybe<Type> ? key : never;
}[keyof T];

export type KeyOfNonNullableType<T, Type extends unknown> = {
    [key in keyof T]: T[key] extends NonNullable<Type> ? key : never;
}[keyof T];

type SnakeCaseKeysOf<T> = Extract<keyof T, `${string}_${string}`>;

type CamelCase<T extends string> = T extends `${infer F}_${infer R}`
    ? `${F}${R extends "id" ? "ID" : Capitalize<CamelCase<R>>}`
    : T;

export type AnyParseFn = (o: Parser<any, any>) => Parser<any, any>;

export type SpecificParseFn<
    From extends object,
    To extends object,
    Single extends boolean
> = (o: Parser<From, Single>) => Parser<To, Single>;

export type ParseFn<From extends object, To extends object> = <
    Single extends boolean
>(
    o: Parser<From, Single>
) => Parser<To, Single>;

export type InferredParseFn<From extends object> = <Single extends boolean>(
    o: Parser<From, Single>
) => Res;

export type InferSingle<P extends Parser<any, any>> = P extends Parser<
    any,
    infer Single
>
    ? Single
    : never;

export type InferParseType<P extends Parser<any, any>> = P extends Parser<
    infer T,
    any
>
    ? T
    : never;

export type InferParseFnRes<Pfn extends (...args: any[]) => Parser<any, any>> =
    InferParseType<ReturnType<Pfn>>;

type Rename<T, KOld extends keyof T, KNew extends string> = Omit<T, KOld> & {
    [key in KNew]: T[KOld];
};

type Reassign<T, K extends keyof T, V> = {
    [key in keyof T]: key extends K
        ? NullableIfOtherNullable<V, T[key]>
        : T[key];
};
type NoInfer<T> = [T][T extends any ? 0 : never];

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

function b64Decode(i: string) {
    return Buffer.from(i, "base64").toString("utf8");
}

function b64Encode(i: string) {
    return Buffer.from(i).toString("base64");
}
