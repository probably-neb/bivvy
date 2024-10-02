import { cn } from "@/lib/utils";
import { Tabs as TabsPrimitive } from "@kobalte/core";
import type { ParentComponent } from "solid-js";
import { splitProps } from "solid-js";

export const Tabs: ParentComponent<TabsPrimitive.TabsRootProps> = props => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Root
      class={cn("w-full data-[orientation=vertical]:flex", local.class)}
      {...rest}
    />
  );
};

export const TabsList: ParentComponent<TabsPrimitive.TabsListProps> = props => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
        <div class="flex items-center justify-center px-2">
    <TabsPrimitive.List
      class={cn(
        "relative shrink flex gap-4 h-9 bg-muted/20 px-4 text-muted-foreground data-[orientation=vertical]:flex-col data-[orientation=horizontal]:items-center data-[orientation=vertical]:items-stretch data-[orientation=vertical]:border-r",
        local.class
      )}
      {...rest}
    /></div>
  );
};

export const TabsContent: ParentComponent<TabsPrimitive.TabsContentProps> = props => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Content
      class={cn(
        "p-4 h-full w-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        local.class
      )}
      {...rest}
    />
  );
};

export const TabsTrigger: ParentComponent<TabsPrimitive.TabsTriggerProps> = props => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Trigger
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-foreground/50 data-[selected]:text-primary border-2 border-transparent data-[selected]:border-primary",
        local.class
      )}
      {...rest}
    />
  );
};

export const DepressTabsTrigger: ParentComponent<TabsPrimitive.TabsTriggerProps> = props => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Trigger
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground data-[selected]:text-foreground data-[selected]:-translate-x-[6px] data-[selected]:-translate-y-[6px] bg-background ring-2 ring-foreground translate-x-0 translate-y-0",
        local.class
      )}
      {...rest}
    />
  );
};

export const TabsIndicator: ParentComponent<TabsPrimitive.TabsIndicatorProps> = props => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <TabsPrimitive.Indicator
      class={cn(
        "duration-250ms absolute transition-all data-[orientation=horizontal]:-bottom-[1px] data-[orientation=vertical]:-right-[1px] data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:w-[2px]",
        local.class
      )}
      {...rest}
    />
  );
};
