"use client";

import { assert, cn } from "@/lib/utils";
import {
    Accessor,
    batch,
    Component,
    ComponentProps,
    createContext,
    createMemo,
    createSignal,
    JSX,
    NoInfer,
    onMount,
    ParentProps,
    useContext,
} from "solid-js";
import { createStore, reconcile, SetStoreFunction } from "solid-js/store";
import { z } from "zod";
import { DateTime } from "luxon";

import * as R from "remeda";
import { Button } from "@/components/ui/button";
import { For } from "solid-js";
import { useMutations } from "../rep";

export type State<Validator extends z.ZodTypeAny, OnSubmitCtx> = {
    errors: Record<string, Array<string> | undefined>;
    touched: Record<string, boolean>;
    validator: Validator;
    defaultValues?: {
        obj: Partial<z.infer<Validator>>;
        map: Form.Data.EncodedFormData;
        used: Record<string, boolean>;
    };
    allTouched: boolean;
    onSubmit: OnSubmit<Validator, OnSubmitCtx>;
    onSubmitCtx?: () => OnSubmitCtx,
};

const Context = createContext<{
    state: State<any, any>;
    setState: SetStoreFunction<State<any, any>>;
    setErrors: (errs: Record<string, string[]>) => void;
}>(
    null as any
    // {
    //     state: {
    //         errors: {},
    //         touched: {},
    //         validator: z.void(),
    //         defaultValues: undefined,
    //         onSubmit: console.log.bind('no ctx'),
    //     },
    //     setState: () => {},
    // }
);

type OnSubmit<Validator extends z.ZodTypeAny, OnSubmitCtx> = (
    submitted: z.infer<Validator>,
    ctx: OnSubmitCtx,
    event: SubmitEvent & {
        target: Element;
        currentTarget: HTMLFormElement;
    }
) => void | Promise<void>;

export namespace Form {
    // export function Provider<Validator extends z.ZodTypeAny>(
    //     props: ParentProps<{
    //         validator: Validator;
    //         class?: string;
    //         onSubmit: OnSubmit<Validator>;
    //         defaultValues?: Partial<z.infer<Validator>>;
    //         allTouched?: boolean;
    //     }>
    // ) {
    //     const [store, setStore] = createStore<State<Validator>>({
    //         errors: {},
    //         touched: {},
    //         validator: props.validator,
    //         onSubmit: props.onSubmit,
    //         defaultValues:
    //             props.defaultValues == null
    //                 ? undefined
    //                 : {
    //                       obj: props.defaultValues,
    //                       map: Data.encode(props.defaultValues)!,
    //                       used: {},
    //                   },
    //         allTouched: props.allTouched ?? false,
    //     });
    //
    //     console.log("create");
    //
    //     return (
    //         <Context.Provider
    //             value={{
    //                 state: store,
    //                 setState: setStore,
    //             }}
    //         >
    //             <Form class={props.class}>{props.children}</Form>
    //         </Context.Provider>
    //     );
    // }

    export function create<Validator extends z.ZodTypeAny, OnSubmitCtx>(props: {
        validator: Validator;
        class?: string;
        onSubmit: OnSubmit<Validator, NoInfer<OnSubmitCtx>>;
        onSubmitCtx?: () => OnSubmitCtx,
        defaultValues?: Partial<z.infer<Validator>>;
        allTouched?: boolean;
    }) {
        const [store, setStore] = createStore<State<Validator, OnSubmitCtx>>({
            errors: {},
            touched: {},
            validator: props.validator,
            onSubmit: props.onSubmit,
            onSubmitCtx: props.onSubmitCtx,
            defaultValues:
                props.defaultValues == null
                    ? undefined
                    : {
                          obj: props.defaultValues,
                          map: Data.encode(props.defaultValues)!,
                          used: {},
                      },
            allTouched: props.allTouched ?? false,
        });

        function setErrors(errors: Record<string, Array<string> | undefined>) {
            setStore("errors", reconcile(errors));
        }

        console.log("create");

        return {
            Provider(providerProps: ParentProps) {
                return (
                    <Context.Provider
                        value={{
                            state: store,
                            setState: setStore,
                            setErrors: setErrors,
                        }}
                    >
                        <Form class={props.class}>
                            {providerProps.children}
                        </Form>
                    </Context.Provider>
                );
            },
        };
    }

    function Form(props: ParentProps<{ class?: string }>) {
        const ctx = use();

        const [validated, setValidated] = createSignal(false);

        const onSubmitCtx = ctx.state.onSubmitCtx?.()

        return (
            <form
                class={cn("flex flex-col gap-4", props.class)}
                onMouseOver={Batcher.createMapped(
                    (e) => e.currentTarget,
                    (forms) => {
                        console.log("on mouse over", validated());
                        if (validated() || !ctx.state.allTouched) return;
                        const form = R.find(forms, R.isNonNullish);
                        if (form == null) return;
                        const errors = validateForm(form, ctx.state.validator);
                        if (errors == null) return;
                        batch(() => {
                            ctx.setErrors(errors);
                            setValidated(true);
                        });
                    },
                    {
                        maxSize: 512,
                        maxWait: 500,
                    }
                )}
                onSubmit={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);

                    const data = Data.decode(formData);

                    const validationRes = ctx.state.validator.safeParse(data);

                    if (validationRes.success) {
                        await ctx.state.onSubmit(validationRes.data, onSubmitCtx, e);
                    } else {
                        const errors = Data.prettifyZodError(
                            validationRes.error
                        );
                        ctx.setErrors(errors);
                        console.error("error", errors);
                    }
                }}
                onInput={Batcher.createMapped(
                    (e) => ({
                        form: e.currentTarget,
                        // @ts-expect-error name not field
                        name: e.target?.name as string | undefined,
                    }),
                    (changes) => {
                        console.log("on change");

                        let forms = R.pipe(
                            changes,
                            R.map(R.prop("form")),
                            R.filter(R.isNonNullish),
                            R.unique()
                        );
                        if (forms.length === 0) {
                            // this can happen occasionally
                            // I believe it is because a single thing was
                            // changed but it's 'form' attr is set to
                            // a non existent form to ensure it
                            // is not included in the submitted form data
                            return;
                        }
                        assert(
                            forms.length === 1,
                            "more than one form recieved"
                        );
                        let form = forms[0]!;

                        let validator = ctx.state.validator;
                        if (validator == null) {
                            return;
                        }

                        batch(() => {
                            const errors = validateForm(form, validator);
                            if (errors == null) {
                                ctx.setErrors({});
                            } else {
                                ctx.setErrors(errors);
                            }
                            let names = R.pipe(
                                changes,
                                R.map(R.prop("name")),
                                R.filter(R.isNonNullish),
                                R.unique()
                            );
                            ctx.setState(
                                "touched",
                                // NOTE: expecting shallow merge
                                R.fromKeys(names, R.constant(true))
                            );
                            console.log("changed", names);
                        });
                    },
                    {
                        // NOTE: making maxSize large results in
                        // better performance for forms with large
                        // updates that set lots of fields with one change
                        // This is coupled with the low maxWait
                        // to make it so single changes are handled quickly
                        // and lots of changes in a short timespan
                        // are handled all at once
                        maxSize: 512,
                        maxWait: 300, // debounce onInput
                    }
                )}
                onChange={Batcher.createMapped(
                    (e) => ({
                        form: e.currentTarget,
                        // @ts-expect-error name not field
                        name: e.target?.name as string | undefined,
                    }),
                    (changes) => {
                        console.log("on change");

                        let forms = R.pipe(
                            changes,
                            R.map(R.prop("form")),
                            R.filter(R.isNonNullish),
                            R.unique()
                        );
                        if (forms.length === 0) {
                            // this can happen occasionally
                            // I believe it is because a single thing was
                            // changed but it's 'form' attr is set to
                            // a non existent form to ensure it
                            // is not included in the submitted form data
                            return;
                        }
                        assert(
                            forms.length === 1,
                            "more than one form recieved"
                        );
                        let form = forms[0]!;

                        let validator = ctx.state.validator;
                        if (validator == null) {
                            return;
                        }

                        batch(() => {
                            const errors = validateForm(form, validator);
                            if (errors == null) {
                                ctx.setErrors({});
                            } else {
                                ctx.setErrors(errors);
                            }
                            let names = R.pipe(
                                changes,
                                R.map(R.prop("name")),
                                R.filter(R.isNonNullish),
                                R.unique()
                            );
                            ctx.setState("touched", (touched) =>
                                Object.assign(
                                    {},
                                    touched,
                                    R.fromKeys(names, R.constant(true))
                                )
                            );
                            console.log("changed", names);
                        });
                    },
                    {
                        // NOTE: making maxSize large results in
                        // better performance for forms with large
                        // updates that set lots of fields with one change
                        // This is coupled with the low maxWait
                        // to make it so single changes are handled quickly
                        // and lots of changes in a short timespan
                        // are handled all at once
                        maxSize: 512,
                        maxWait: 100,
                    }
                )}
                onBlur={Batcher.createMapped(
                    (e) =>
                        (e.target as undefined | HTMLInputElement)?.name as
                            | string
                            | undefined,
                    (blurred) => {
                        const names = R.pipe(blurred, R.filter(R.isNonNullish));
                        ctx.setState("touched", (touched) =>
                            Object.assign(
                                {},
                                touched,
                                R.fromKeys(names, R.constant(true))
                            )
                        );
                        console.log("touched", names);
                    },
                    {
                        // NOTE: making maxSize large results in
                        // better performance for forms with large
                        // updates that set lots of fields with one change
                        // This is coupled with the low maxWait
                        // to make it so single changes are handled quickly
                        // and lots of changes in a short timespan
                        // are handled all at once
                        maxSize: 512,
                        maxWait: 100,
                    }
                )}
            >
                {props.children}
                <UnusedDefaultValues />
            </form>
        );
    }

    function validateForm(
        form: HTMLFormElement,
        validator: z.ZodTypeAny
    ): Record<string, string[]> | null {
        const formData = new FormData(form);

        const data = Data.decode(formData);

        const validationRes = validator.safeParse(data);

        if (validationRes.success) {
            return null;
        } else {
            const errors = Data.prettifyZodError(validationRes.error);
            return errors;
        }
    }

    export function wrap<
        Validator extends z.ZodTypeAny,
        Comp extends Component<any>,
        OnSubmitCtx,
    >(opts: Parameters<typeof create<Validator, OnSubmitCtx>>[0], Component: Comp): Comp {
        return ((props: ComponentProps<Comp>) => {
            const form = create(opts);

            return (
                <form.Provider>
                    <Component {...props} />
                </form.Provider>
            );
        }) as Comp;
    }

    export function use() {
        const ctx = useContext(Context);
        if (ctx == null) {
            console.error("no ctx");
            throw new Error("useForm must be used within a FormProvider");
        }

        return ctx;
    }

    export function useDefaultValueFor<T extends Data.Primitive>(name: string) {
        const ctx = use();
        onMount(() => {
            if (ctx.state.defaultValues != null) {
                ctx.setState("defaultValues", "used", name, true);
            }
        });
        return ctx.state.defaultValues?.map[name] as T | undefined;
    }

    export function UnusedDefaultValues() {
        const ctx = use();
        const unused = createMemo(() => {
            const defaultValues = ctx.state.defaultValues;
            if (defaultValues == null) return [];
            return R.pipe(
                defaultValues.map,
                R.entries(),
                R.filter(([name, _value]) => defaultValues.used[name] !== true)
            );
        });

        return (
            <For each={unused()}>
                {([name, value]) => (
                    <input
                        type="hidden"
                        value={value == null ? undefined : String(value)}
                        name={name}
                    />
                )}
            </For>
        );
    }

    export function useFieldError(name: string) {
        const ctx = use();
        return createMemo(() => {
            const err = isTouched(name)
                ? ctx.state.errors[name]?.join("; ") ?? null
                : null;
            console.log("updating error for", name, err);
            return err;
        });
    }

    export function useMultiFieldError(prefix: string): Accessor<string> {
        const ctx = use();
        return createMemo(() => {
            return R.pipe(
                ctx.state.errors,
                R.entries(),
                R.filter(
                    ([name, _err]) =>
                        _err != null &&
                        R.startsWith(name, prefix) &&
                        getIsTouched(ctx, name)
                ),
                R.map(R.prop("1")),
                R.flat()
            ).join("; ");
        });
    }

    function getIsTouched(ctx: ReturnType<typeof use>, name: string): boolean {
        return ctx.state.allTouched || (ctx.state.touched[name] ?? false);
    }
    export function isTouched(name: string) {
        const ctx = use();
        return createMemo(() => getIsTouched(ctx, name));
    }

    export function FieldError(props: { for: string }) {
        const fieldError = useFieldError(props.for);

        return (
            <span class="h-8 w-full text-destructive uppercase">
                {fieldError()}
            </span>
        );
    }

    export function MultiFieldError(props: { for: string }) {
        const fieldError = useMultiFieldError(props.for);
        return (
            <span class="h-8 w-full text-destructive uppercase">
                {fieldError()}
            </span>
        );
    }

    export function SubmitButton(props: {
        children?:
            | JSX.Element
            | ((props: {
                  canSubmit: boolean;
                  submitting: boolean;
              }) => JSX.Element);
    }) {
        // FIXME: implement
        return <Button type="submit">SUBMIT</Button>;
    }

    export function joinNames(
        ...names: Array<number | string | undefined>
    ): string {
        return names
            .filter(R.isNonNullish)
            .map((v) => (typeof v === "number" ? `[${v}]` : v))
            .join(".")
            .replaceAll(".[", "[");
    }

    export namespace Data {
        export function prettifyZodError(
            err: z.ZodError
        ): Record<string, string[]> {
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

            return Object.fromEntries(errMap);
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
        export const zFormData = z
            .any()
            .refine<FormData>(
                (a): a is FormData => a instanceof FormData,
                "Invalid value passed to zFormData, expected a FormData"
            )
            .transform((formData) => decode(formData));

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
        export function decode(formData: FormData): any {
            let obj: any = {};
            for (const key of formData.keys()) {
                let cur: any = obj;
                // split on '.' or '['
                // "a.b[0].c" => ["a", "b", "0]", "c"]
                const pathItems = key.split(/[\.\[]/);

                while (pathItems.length > 1) {
                    let item = pathItems.shift()!;

                    const nextIsArray = pathItems[0]?.at(-1) === "]";

                    if (item === "" && nextIsArray) {
                        // handle case where top level item is an array
                        // i.e. "[0].a.b.c" => pathItems := ["", "0]", "a", "b", "c"]
                        const isTopLevel = Object.is(cur, obj);
                        // top level array is only time empty item is ok
                        assert(
                            isTopLevel,
                            "Malformed empty path, found at: " + key
                        );

                        if (!Array.isArray(obj)) {
                            // if not already changed to an array, set top level obj to an array
                            // TODO: assert obj is empty by num keys or other (can't have top level array and obj)
                            obj = new Array();
                            cur = obj;
                        }
                        continue;
                    }
                    if (item === "") {
                        throw new Error(
                            "Malformed empty path, found at: " + key
                        );
                    }

                    if (item.at(-1) === "]") {
                        assert(
                            Array.isArray(cur),
                            "did not set array elem to array"
                        );
                        // remove trailing ']'
                        item = item.slice(0, -1);
                    }
                    if (cur[item] == null) {
                        cur[item] = nextIsArray ? [] : {};
                    }
                    cur = cur[item];
                }
                assert(
                    pathItems.length === 1,
                    "pathItems.length !== 1 after loop"
                );
                let item = pathItems[0]!;
                if (item.at(-1) === "]") {
                    assert(
                        Array.isArray(cur),
                        "did not set last array elem to array"
                    );
                    // remove trailing ']'
                    item = item.slice(0, -1);
                }

                const value = formData.getAll(key);

                assert(value.length > 0, "value is empty");
                // NOTE: array entries should be specified with the `[${num}]` syntax in
                // the path not with multiple fields, although this can be changed...
                assert(
                    value.length === 1,
                    `found conflicting key entries for: '${key}'`
                );

                if (value[0] !== undefined) {
                    // skip undefined values
                    cur[item] = value[0];
                }
            }
            return obj;
        }

        export function decodeObj(formData: EncodedFormData): any {
            let obj: any = {};
            for (const key of Object.keys(formData)) {
                let cur: any = obj;
                // split on '.' or '['
                // "a.b[0].c" => ["a", "b", "0]", "c"]
                const pathItems = key.split(/[\.\[]/);

                while (pathItems.length > 1) {
                    let item = pathItems.shift()!;

                    const nextIsArray = pathItems[0]?.at(-1) === "]";

                    if (item === "" && nextIsArray) {
                        // handle case where top level item is an array
                        // i.e. "[0].a.b.c" => pathItems := ["", "0]", "a", "b", "c"]
                        const isTopLevel = Object.is(cur, obj);
                        // top level array is only time empty item is ok
                        assert(
                            isTopLevel,
                            "Malformed empty path, found at: " + key
                        );

                        if (!Array.isArray(obj)) {
                            // if not already changed to an array, set top level obj to an array
                            // TODO: assert obj is empty by num keys or other (can't have top level array and obj)
                            obj = new Array();
                            cur = obj;
                        }
                        continue;
                    }
                    if (item === "") {
                        throw new Error(
                            "Malformed empty path, found at: " + key
                        );
                    }

                    if (item.at(-1) === "]") {
                        assert(
                            Array.isArray(cur),
                            "did not set array elem to array"
                        );
                        // remove trailing ']'
                        item = item.slice(0, -1);
                    }
                    if (cur[item] == null) {
                        cur[item] = nextIsArray ? [] : {};
                    }
                    cur = cur[item];
                }
                assert(
                    pathItems.length === 1,
                    "pathItems.length !== 1 after loop"
                );
                let item = pathItems[0]!;
                if (item.at(-1) === "]") {
                    assert(
                        Array.isArray(cur),
                        "did not set last array elem to array"
                    );
                    // remove trailing ']'
                    item = item.slice(0, -1);
                }

                const value = formData[key];

                // skip undefined values
                if (value !== undefined) {
                    cur[item] = value;
                }
            }
            return obj;
        }

        export type Primitive = string | number | boolean | null | undefined;

        export type EncodedFormData = Record<string, Primitive>;

        type EncodedFormDataMap = Map<string, Primitive>;

        type NullableIfOtherNullable<T, OtherT> = OtherT extends null
            ? T | null
            : OtherT extends undefined
            ? T | null
            : T;

        export function encode<T>(
            obj: T
        ): NullableIfOtherNullable<EncodedFormData, T> {
            let map: EncodedFormDataMap = new Map();
            if (obj == null) {
                // @ts-ignore
                return null;
            }
            encodeAny(map, "", obj);
            return Object.fromEntries(map) as any;
        }

        // returns the primitive if the value is a primitive,
        // otherwise calls the correct encoding function
        // using the map and returns null
        function encodeAny(
            map: EncodedFormDataMap,
            prefix: string,
            val: any
        ): void {
            const isArray = Array.isArray(val);
            const isObject = R.isObjectType(val);
            const isPrimitive =
                R.isBoolean(val) ||
                R.isNumber(val) ||
                R.isString(val) ||
                R.isNullish(val);
            assert(
                isArray || isObject || isPrimitive,
                "Expected obj to be an array or object or a primitive value"
            );
            if (isArray) {
                encodeArray(map, prefix, val);
            } else if (isObject) {
                encodeObject(map, prefix, val);
            } else if (isPrimitive) {
                assert(
                    prefix !== "",
                    "prefix should be non empty string if value is primitive"
                );
                map.set(prefix, val);
            }
        }

        function encodeObject<T extends object>(
            map: EncodedFormDataMap,
            prefix: string,
            obj: T
        ): void {
            assert(R.isObjectType(obj), `expected obj at '${prefix}'`);

            if (!R.isPlainObject(obj)) {
                tryEncodeClassObject(map, prefix, obj);
                return;
            }

            const keys = R.keys(obj);
            for (let i = 0; i < keys.length; i++) {
                let objKey = keys[i]!;
                let value = obj[objKey];
                if (value === undefined) {
                    // leave undefined out, as accessing the key will
                    // return undefined anyway, so it only makes the object
                    // bigger
                    continue;
                }

                let key = prefix;
                if (prefix !== "") {
                    key += ".";
                }
                key += objKey;

                encodeAny(map, key, value);
            }
        }

        function encodeArray<T extends Array<any>>(
            map: EncodedFormDataMap,
            prefix: string,
            arr: T
        ): void {
            assert(R.isArray(arr), `expected array at '${prefix}'`);

            for (let i = 0; i < arr.length; i++) {
                let val = arr[i];
                if (val === undefined) {
                    // leave undefined out, as accessing the key will
                    // return undefined anyway, so it only makes the object
                    // bigger
                    continue;
                }
                let key = prefix + "[" + i + "]";
                encodeAny(map, key, val);
            }
        }

        function tryEncodeClassObject(
            map: EncodedFormDataMap,
            prefix: string,
            obj: any
        ) {
            if (obj instanceof Date) {
                map.set(prefix, DateTime.fromJSDate(obj).toISO());
                return;
            }
            if (obj instanceof DateTime) {
                map.set(prefix, obj.toISO());
                return;
            }

            throw new Error(
                `Tried to encode class object of unrecognized type... where did this come from? Either add this class as a supported class obj in encode-form-data.ts or fix your bug. Object: ${obj}`,
                {
                    cause: "unrecognized-object",
                }
            );
        }
    }
}

namespace Batcher {
    /**
     * A function that takes a batch fn which takes an array of items,
     * and returns a new function that takes a single item, adding it to
     * an array of items which will be "flushed" to the batch function
     * either when a timeout is reached (maxWait) or a certain number of items
     * is reached (maxSize)
     */
    export function create<Item, BatchFn extends (items: Array<Item>) => void>(
        batchFunction: BatchFn,
        { maxSize = 10, maxWait = 1000 } = {}
    ): (item: Item) => void {
        let batch: Array<Item> = [];
        let timeout: NodeJS.Timeout | null = null;

        function flush() {
            if (batch.length > 0) {
                batchFunction(batch);
                batch = [];
            }
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
        }

        return function (item) {
            batch.push(item);

            if (batch.length >= maxSize) {
                flush();
            } else if (!timeout) {
                timeout = setTimeout(flush, maxWait);
            }
        };
    }

    /**
     * Wrapper around createBatcher that maps the incoming items
     * to something else before passing them to the single fn
     */
    export function createMapped<
        Item,
        SubItem,
        BatchFn extends (items: Array<SubItem>) => void
    >(
        mapFn: (item: Item) => SubItem,
        batchFunction: BatchFn,
        opts: Parameters<typeof create>[1]
    ): (item: Item) => void {
        return R.piped(mapFn, create<SubItem, BatchFn>(batchFunction, opts));
    }
}
