import { Accessor, JSX, createContext, createEffect, createMemo, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const sizes = ["sm", "md", "lg"] as const;
type Size = typeof sizes[number];

// From tailwind docs
// sm	640px	@media (min-width: 640px) { ... }
// md	768px	@media (min-width: 768px) { ... }
// lg	1024px	@media (min-width: 1024px) { ... }
const pxSizes: Record<Size, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
}

// this is low-key cool I can do this
type Queries = Record<`is${Capitalize<Size>}` | `isAtLeast${Capitalize<Size>}`, () => boolean>

type Ctx = [Accessor<Size>, Queries]

const defaultCtx: Ctx  = [() => "sm", {
    isSm: () => true,
    isMd: () => false,
    isLg: () => false,
    isAtLeastSm: () => true,
    isAtLeastMd: () => false,
    isAtLeastLg: () => false,
}]

const DeviceContext = createContext<Ctx>(defaultCtx);

function computeSize(matches: Record<Size, boolean>) {
    switch (true) {
        case matches.lg:
            return "lg"
        case matches.md:
            return "md"
        default:
            return "sm"
    }
}

export function DeviceContextProvider(props: { children: JSX.Element }) {
    const [matches, _setMatches] = createStore<Record<Size, boolean>>({
        sm: true,
        md: false,
        lg: false,
    })
    function setMatches(size: Size, value: boolean) {
        // default to always having small true
        _setMatches(size, value || size === "sm")
    }
    for (const size of sizes) {
        const mql = window.matchMedia(`(min-width: ${pxSizes[size]}px)`)
        setMatches(size, mql.matches)
        mql.addEventListener("change", (e) => {
            setMatches(size, e.matches)
        })
    }

    createEffect(() => {
        console.log("matches", matches)
    })

    const device = createMemo(() => {
        const size = computeSize(matches)
        console.log("computed size:", size)
        return size;
    })

    const queries = {
        isSm: createMemo(() => matches.sm && !matches.md),
        isMd: createMemo(() => matches.md && !matches.lg),
        isLg: createMemo(() => matches.lg),
        isAtLeastSm: createMemo(() => matches.sm),
        isAtLeastMd: createMemo(() => matches.md),
        isAtLeastLg: createMemo(() => matches.lg),
    }

    return (
        <DeviceContext.Provider value={[device, queries]}>
            {props.children}
        </DeviceContext.Provider>
    )
}

export function useDevice() {
    const [device] = useContext(DeviceContext);
    return device;
}

export function useQueries() {
    const [, queries] = useContext(DeviceContext);
    return queries;
}
