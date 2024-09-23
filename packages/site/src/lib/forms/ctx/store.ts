import React, {
    createContext,
    useContext,
    createMemo,
    createSignal,
    useTransition,
    onMount,
} from 'solid-js';

import { assert } from '@/lib/utils';

import { Action } from '../actions';
import { decodeFormData } from '../decode-form-data';
import { encodeFormData } from '../encode-form-data';
import { createMappedBatcher } from './batcher';
import type { FieldValues } from './index';
import { prettifyUnknownError, prettifyZodError } from './prettify-error';

import { TRPCError } from '@trpc/server';
import { enableMapSet } from 'immer';
import * as R from 'remeda';
import { z } from 'zod';
import * as Zustand from 'zustand';
import { immer } from 'zustand/middleware/immer';

enableMapSet();

export type FieldName = string;

export interface FieldErrors extends Record<FieldName, string> {}

export interface FormState {
    /** Errors in fields that have been touched */
    errors: FieldErrors;
    /** All errors we currently know about regardless of whether the field is touched or not */
    allErrors: FieldErrors;
    /** Whether or not all fields should be assumed to be touched */
    allTouched: boolean;
    /** The set of the fields that have been touched in the form */
    touched: Set<string>;
    // touched: Set<FieldName>
    validator?: z.ZodTypeAny;
    defaultValues: FieldValues;
    defaultValuesObj: any | null;
    form: HTMLFormElement | null;
}

export interface FormActions {
    setErrors(errors: FieldErrors): void;
    markTouched(...names: Array<string>): void;
    clientValidation: {
        ref: React.RefCallback<HTMLFormElement>;
        onSubmit: React.FormEventHandler<HTMLFormElement>;
        onChange: React.ChangeEventHandler<HTMLFormElement>;
        onBlur: React.ChangeEventHandler<HTMLFormElement>;
    };
}

export interface FormStore extends FormState, FormActions {}

export interface FormStoreAPI extends ReturnType<typeof createFormStore> {}

export const formStoreContext = createContext<FormStoreAPI>(null as any);

const defaultState: FormState = {
    errors: {},
    allErrors: {},
    allTouched: false,
    touched: new Set(),
    defaultValues: {},
    defaultValuesObj: null,
    form: null,
};

export function createFormStore(
    initialState: Partial<Omit<FormState, 'defaultValues'>> = defaultState,
) {
    const defaultValuesObj = initialState.defaultValuesObj;
    const isDefaultValuesObjOk =
        Array.isArray(defaultValuesObj) || R.isPlainObject(defaultValuesObj);
    if (!Object.is(initialState, defaultState)) {
        if (isDefaultValuesObjOk) {
            // @ts-ignore
            initialState.defaultValues = encodeFormData(defaultValuesObj);
        }
        initialState = Object.assign({}, defaultState, initialState);
    }
    return Zustand.createStore<FormStore>()(
        immer((set, get) => ({
            ...(initialState as FormState),
            setErrors(allErrors: FieldErrors) {
                set((state) => {
                    state.allErrors = allErrors;
                    state.errors = selectTouchedErrors(
                        allErrors,
                        state.allTouched,
                        state.touched,
                    );
                });
            },
            markTouched(...names) {
                set((prev) => {
                    if (prev.allTouched) {
                        return;
                    }
                    for (const name of names) {
                        // FIXME: check if value
                        prev.touched.add(name);
                    }
                });
            },
            clientValidation: {
                ref: (val) => set({ form: val }),
                onSubmit(e) {
                    console.log('onSubmit')
                    let form = e.currentTarget;
                    if (form == null) {
                        return;
                    }

                    let store = get();
                    let validator = store.validator;
                    if (validator == null) {
                        return;
                    }

                    let errors = validateForm(form, validator);
                    if (R.isEmpty(errors)) {
                        // no errors - do not prevent submission
                        return;
                    }
                    console.error({errors})
                    e.preventDefault();
                    e.stopPropagation();
                    // TODO: emit some notification somehow that
                    // submission failed

                    // mark all fields in errors as touched
                    // so that the errors are shown
                    // regardless of whether the user
                    // has actually touched the field
                    // (i.e. missed a required field)
                    store.markTouched(...R.keys(errors));
                    store.setErrors(errors);
                },
                onBlur: createMappedBatcher(
                    (e) => (
                        e.target?.name as string | undefined
                    ),
                    (blurred) => {
                        get().markTouched(...blurred.filter(f => f != null));
                    },
                    {
                        // NOTE: making maxSize large results in
                        // better performance for forms with large
                        // updates such as the select in `user-upload-form`
                        // that sets every uploaded users group
                        // This is coupled with the low maxWait
                        // to make it so single changes are handled quickly
                        // and lots of changes in a short timespan
                        // are handled all at once
                        maxSize: 512,
                        maxWait: 100,
                    },
                ),
                // FIXME: have a `ref` object here so that we can create
                // a `runValidation` hook and run it onMount if allTouched
                // NOTE: needs to be mappedBatcher because
                // otherwise the events get mutated while we
                // are waiting to batch process them, changing
                // the `currentTarget` field which is how we get
                // the reference to the form
                onChange: createMappedBatcher(
                    (e) => ({
                        form: e.currentTarget,
                        name: e.target?.name as string | undefined,
                    }),
                    (changes) => {
                        console.log('on change');

                        let forms = R.pipe(
                            changes,
                            R.map(R.prop('form')),
                            R.filter(R.isNonNullish),
                            R.unique(),
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
                            'more than one form recieved',
                        );
                        let form = forms[0]!;

                        let store = get();
                        let validator = store.validator;
                        if (validator == null) {
                            return;
                        }

                        let errors = validateForm(form, validator);

                        let names = R.pipe(
                            changes,
                            R.map(R.prop('name')),
                            R.filter(R.isNonNullish),
                            R.unique(),
                        );
                        console.log('changed', names);
                        store.setErrors(errors);
                    },
                    {
                        // NOTE: making maxSize large results in
                        // better performance for forms with large
                        // updates such as the select in `user-upload-form`
                        // that sets every uploaded users group
                        // This is coupled with the low maxWait
                        // to make it so single changes are handled quickly
                        // and lots of changes in a short timespan
                        // are handled all at once
                        maxSize: 512,
                        maxWait: 100,
                    },
                ),
            },
        })),
    );
}

function selectTouchedErrors(
    errors: FieldErrors,
    allTouched: boolean,
    touched: Set<string>,
): FieldErrors {
    if (allTouched) {
        return errors; // TODO: consider copying here
    }
    return R.pipe(
        errors,
        R.entries<FieldErrors>,
        R.filter(([name, err]) => err != null && touched.has(name)),
        R.fromEntries(),
    );
}

function validateForm(
    form: HTMLFormElement,
    validator: z.ZodTypeAny,
): FieldErrors {
    const formData = new FormData(form);
    const data = decodeFormData(formData);
    const result = validator.safeParse(data);
    if (result.success) {
        return {};
    }
    return prettifyZodError(result.error);
}

export function useFormStore<T>(selector: (store: FormStore) => T): T {
    const storeAPI = useFormStoreAPI();
    return Zustand.useStore<FormStoreAPI, T>(storeAPI, selector);
}

export function useFormStoreAPI() {
    const storeCtx = useContext(formStoreContext);
    if (!storeCtx) {
        throw new Error(`useFormStore must be used within FormStoreProvider`);
    }
    return storeCtx;
}

export function useClientValidation(validator: z.ZodTypeAny) {
    const storeAPI = useFormStoreAPI();
    onMount(() => {
        // WARN: setting validator here means changing the validator after
        // first render will have no effect
        storeAPI.setState({ validator });
        const { allTouched, touched, form, defaultValuesObj } =
            storeAPI.getState();

        if ((allTouched || touched.size > 0) && form != null) {
            let errors: FieldErrors;
            if (defaultValuesObj != null) {
                const result = validator.safeParse(defaultValuesObj);
                errors = result.success ? {} : prettifyZodError(result.error);
            } else {
                errors = validateForm(form, validator);
            }
            storeAPI.setState({ errors });
        }
    });

    const clientValidation = useFormStore((f) => f.clientValidation);
    return clientValidation;
}

type ActionState<Data, Err> =
    | {
          state: 'idle';
      }
    | {
          state: 'loading';
          reloading: false;
      }
    | ({
          state: 'loading';
          reloading: true;
      } & ({ ok: true; data: Data } | { ok: false; error: Err }))
    | ({
          state: 'loaded';
          ok: true;
          data: Data;
      } & ({ ok: true; data: Data } | { ok: false; error: Err }));

// TODO: consider just wrapping ../use-action-state.ts
// and having hooks run to update formStore when !result.ok
// this should ABSOLUTELY be done if there is ever a case where useFormData
// is required outside of a formStore.Provider
// NOTE: should probably copy+paste this code into ../use-action-state.ts
// as it is much better
// FIXME: reduce complication here by expecting Action.Result
// as return type of function, still have try catch on calling action
// (it may have been wrapped by something else) but throw wrapped error
// in that case i.e. console.error('Uncaught error: ', error.message)
export function useActionState<
    ActionFn extends Action.Fn<any, any>,
    Input extends ActionFn extends Action.Fn<infer Input, any> ? Input : never,
    Output extends ActionFn extends Action.Fn<any, infer Output>
        ? Output
        : never,
    Result extends Output extends Action.Result<any, any>
        ? Output
        : Action.Result<Output, FieldErrors | string>,
>(
    action: ActionFn,
): [
    Action.Fn<Input, Result>,
    ActionState<Action.ExtractData<Output>, Action.ExtractErr<Output>>,
] {
    const [loading, startTransition] = useTransition();

    const [data, setData] = createSignal<Result | undefined>();

    const formStore = useFormStoreAPI();

    type WrappedAction = Action.Fn<Input, Result>;
    const wrappedAction = useCallback<WrappedAction>(
        (input) =>
            new Promise((resolve) => {
                startTransition(async () => {
                    let result: Result;
                    try {
                        const res = await action(input);
                        if (res != null) {
                            if (Action.isResult(res)) {
                                if (!res.ok) {
                                    throw res.error;
                                }
                                result = res as any;
                            } else if (R.isError(res)) {
                                throw res;
                            } else {
                                result = Action.ok(res) as any;
                            }
                        } else {
                            result = Action.ok(undefined) as any;
                        }
                    } catch (error) {
                        result = Action.err(error) as any;
                    }
                    setData(result);
                    if (!result.ok) {
                        // add errors to form store
                        const store = formStore.getState();
                        const err = prettifyUnknownError(result.error);
                        const isString = R.isString(err);
                        const isPlainObject = R.isPlainObject(err);
                        assert(
                            isString || isPlainObject,
                            `unhandled prettifyUnknownError result ${err}`,
                        );
                        if (isString) {
                            store.setErrors({ '': err });
                        } else if (isPlainObject) {
                            // FIXME: (create &) use isFieldErrorMap helper
                            const fieldNames = R.keys(err);
                            store.markTouched(...fieldNames);
                            store.setErrors(err);
                        }
                    }
                    resolve(result);
                    return;
                });
            }),
        [startTransition, setData],
    );

    const state = createMemo(() => {
        let state: ActionState<
            Action.ExtractData<Output>,
            Action.ExtractErr<Output>
        >;
        if (loading) {
            state = { state: 'loading', reloading: false };
            if (data != null) {
                state = Object.assign(state, { reloading: true }, data);
            }
        } else if (data != null) {
            state = Object.assign({ state: 'loaded' }, data);
        } else {
            state = { state: 'idle' };
        }
        return state;
    }, [data, loading]);

    return [wrappedAction, state] as const;
}

export function useFieldError(name: FieldName) {
    return useFormStore((s) => s.errors[name] ?? null);
}

export function useErrors(): FieldErrors {
    return useFormStore((s) => s.errors);
}

export function useDefaultValue<FieldValue = FieldValues[string]>(
    fieldName: FieldName,
): FieldValue | undefined {
    return useFormStore(
        (s) => s.defaultValues?.[fieldName] as FieldValue | undefined,
    );
}

export function useDefaultValues() {
    return useFormStore((s) => {
        if (R.keys(s.defaultValues).length === 0) {
            return null;
        }
        return s.defaultValues;
    });
}

export function useDefaultValueObj<DefaultValue>() {
    return React.useCallback<
        <Res>(selector: (val: DefaultValue) => Res) => Res | undefined
    >(
        (selector) =>
            useFormStore((s) =>
                s.defaultValuesObj == null
                    ? undefined
                    : selector(s.defaultValuesObj),
            ),
        [],
    );
}

export function getDefaultValueArrayLen(
    name: string,
    haveDefaultValues?: FieldValues,
): number {
    const defaultValues =
        haveDefaultValues ?? useFormStoreAPI().getState().defaultValues;

    const keys = R.keys(defaultValues);

    let maxIndex = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        if (!key.startsWith(name)) {
            continue;
        }

        const indiceStr = key.slice(
            name.length + 1,
            key.indexOf(']', name.length + 2),
        );
        console.log({ indiceStr });
        const indice = Number.parseInt(indiceStr);
        assert(
            R.isNumber(indice) && Number.isFinite(indice) && indice >= 0,
            'indice is a positive integer, not NaN and finite: ' +
                indice +
                ' "' +
                indiceStr +
                '"',
        );
        if (indice > maxIndex) {
            maxIndex = indice;
        }
    }

    return maxIndex;
}

export function useIsTouched() {
    return useFormStore((s) => s.touched.size > 0 || s.allTouched);
}
