import { cn } from "@/lib/utils";
import { Button as ButtonPrimitive } from "@kobalte/core";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { JSX, ParentComponent } from "solid-js";
import { createSignal, splitProps } from "solid-js";

export const buttonVariants = cva(
    "inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline: "ring-2 ring-foreground bg-background hover:underline",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export const Button: ParentComponent<
    ButtonPrimitive.ButtonRootProps & VariantProps<typeof buttonVariants>
> = (props) => {
    const [local, rest] = splitProps(props, ["class", "variant", "size"]);

    return (
        <ButtonPrimitive.Root
            class={cn(
                buttonVariants({
                    size: local.size,
                    variant: local.variant,
                }),
                local.class
            )}
            {...rest}
        />
    );
};

export const depressButtonVariants = cva(
    "inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ring-2 ring-foreground -translate-x-[6px] -translate-y-[6px] bg-background transition-all duration-100 ease-in-out",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export const DepressButton: ParentComponent<
    ButtonPrimitive.ButtonRootProps & VariantProps<typeof depressButtonVariants>
> = (props) => {
    const [local, rest] = splitProps(props, ["class", "variant", "size"]);

    const [isPressed, setIsPressed] = createSignal(false);

    return (
        <div class="bg-slate-200">
        <ButtonPrimitive.Root
            class={cn(
                depressButtonVariants({
                    size: local.size,
                    variant: local.variant,
                }),
                local.class,
                isPressed() ? "translate-x-0 translate-y-0" : ""
            )}
            classList={{
                "transform translate-y-0 translate-x-0": isPressed(),
            }}
            {...rest}
            onMouseDown={composeEventHandlers(
                [setIsPressed,true],
                rest.onMouseDown
            )}
            onMouseUp={composeEventHandlers(
                [setIsPressed, false],
                rest.onMouseUp
            )}
            onMouseLeave={composeEventHandlers(
                [setIsPressed,false],
                rest.onMouseLeave
            )}
        />
        </div>
    );
};

function composeEventHandlers<T extends Event, Elem extends Element>(
    ...handlers: Array<JSX.EventHandlerUnion<Elem, T> | undefined>
) {
    return ((event) => {
        for (const handler of handlers) {
            if (typeof handler === "function") {
                handler(event);
            } else if (handler && typeof handler[0] === "function") {
                handler[0](handler[1], event);
            }
        }
    }) satisfies JSX.EventHandler<Elem, T>;
}
