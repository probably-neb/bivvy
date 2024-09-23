import { useRef } from 'react';
import React from 'react';

import { cn } from '@/lib/utils';

import { ErrorIcon } from '@/components/icons';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import For from '@/components/util/for';
import NoSSR from '@/components/util/no-ssr';
import Show from '@/components/util/show';

import {
    FormState,
    FormStoreAPI,
    createFormStore,
    formStoreContext,
    useActionState,
    useDefaultValue,
    useFieldError,
    useFormStore,
} from './store';

import { toast } from 'sonner';

export function StoreProvider<T>({
    children,
    allTouched,
    defaultValuesObj,
}: React.PropsWithChildren<{
    allTouched?: boolean;
    defaultValuesObj?: T;
}>) {
    const formStoreRef = useRef<FormStoreAPI>(null as any);
    if (formStoreRef.current == null) {
        let initialState: Partial<FormState> = { allTouched };
        if (defaultValuesObj != null) {
            // if has default values (editing) then assume all touched
            initialState.allTouched = true;
            // only set when defaultValues is defined so
            // the default Value is used
            initialState.defaultValuesObj = defaultValuesObj;
        }
        formStoreRef.current = createFormStore(initialState);
    }

    return (
        <formStoreContext.Provider value={formStoreRef.current}>
            {children}
        </formStoreContext.Provider>
    );
}

export function FieldError({
    for: name,
    className,
}: {
    for: string;
    className?: string;
}) {
    const error = useFieldError(name);
    return (
        <div
            className={cn('min-h-[1.25rem] w-full text-destructive', className)}
        >
            <NoSSR>{error}</NoSSR>
        </div>
    );
}

// TODO: extract to lib/utils or other
// and allow passing custom css
// FIXME: fix hydration errors
export function FieldErrorIndicator({
    for: name,
    className,
}: {
    for: string;
    className?: string;
}) {
    const error = useFieldError(name);
    return (
        <div className={className}>
            <NoSSR>
                <Show when={error} fallback={<span className="size-[1rem]" />}>
                    {(err) => (
                        <HoverCard>
                            <HoverCardTrigger className="size-[1rem] text-destructive">
                                <ErrorIcon />
                            </HoverCardTrigger>
                            <HoverCardContent>
                                <span className="text-destructive">{err}</span>
                            </HoverCardContent>
                        </HoverCard>
                    )}
                </Show>
            </NoSSR>
        </div>
    );
}

/**
 * Wrap A field with a div and an error indicator on one side
 * Very simple, but reduces boilerplate in forms
 */
export function FieldWithErrorIndicator({
    side = 'left',
    children,
    name,
    className,
}: React.PropsWithChildren<{
    side?: 'left' | 'right';
    name: string;
    className?: string;
}>) {
    return (
        <div
            data-side={side}
            className={cn(
                "flex flex-row items-center gap-2 data-[side='right']:flex-row-reverse",
                className,
            )}
        >
            {children}
            <FieldErrorIndicator for={name} />
        </div>
    );
}

export function GlobalFormErrorAnnouncer() {
    const errors = useFormStore((s) => {
        if (s.allErrors[''] == null) {
            return [];
        }
        return s.allErrors[''].split(';');
    });
    React.useEffect(() => {
        if (errors.length === 0) {
            return;
        }
        const handles = new Array<ReturnType<typeof toast.error>>();
        for (const error of errors) {
            handles.push(
                toast.error(error, {
                    richColors: true,
                    position: 'top-center',
                    duration: 7000, // 7 seconds
                }),
            );
        }
        return () => {
            for (const handle of handles) {
                toast.dismiss(handle);
            }
        };
    }, [errors]);
    return null;
}

/**
 * A simple server driven form
 * places it's children directly inside a <form> element
 * expects all validation to be done in the action
 */
export function SimpleServerForm({
    action,
    className,
    children,
    id,
}: React.PropsWithChildren<{ action: any; className?: string; id?: string}>) {
    return (
        <StoreProvider>
            <GlobalFormErrorAnnouncer />
            <SimpleServerFormInner
                action={action}
                className={className}
                id={id}
            >
                {children}
            </SimpleServerFormInner>
        </StoreProvider>
    );
}

function SimpleServerFormInner(
    props: React.PropsWithChildren<{
        action: any;
        className?: string;
        id?: string;
    }>,
) {
    const [action, state] = useActionState(props.action);
    return (
        <form action={action} className={props.className} id={props.id}>
            {props.children}
        </form>
    );

}
