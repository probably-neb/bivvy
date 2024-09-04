import { Show, createEffect, createMemo, createResource, createSignal, on } from "solid-js";
import patterns from "./patterns.json";

export function usePatterns() {
    return patterns;
}

export function usePatternNames() {
    return patterns.map(p => p.name);
}

function patternUrl(name: string) {
    console.log(name);
    return `patterns/${name}.svg`;
}

export const COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#10b981", // Yellow
    "#84cc16", // Lime
    "#22c55e", // Green
    "#10b981", // Emerald
    "#14b8a6", // Teal
    "#06b6d4", // Cyan
    "#0ea5e9", // Sky
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#a855f7", // Purple
    "#d946ef", // Fuchsia
    "#ec4899", // Pink
    "#f43f5e", // Rose
]

export function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function usePossibleColors() {
    return COLORS
}

const DEFAULT = COLORS.at(-1)!

export function Pattern(props: { name: string; fill?: string, color?: string }) {
    const pattern = createMemo(() => patterns.find(p => p.name === props.name)!);
    const style = createMemo(() => {
        const style = `background-color: ${props.color ?? DEFAULT}; background-image: ${imgUrlEncode(
            pattern().image,
            props.fill ?? "#FFFFFF",
        )}`;
        return style;
    });
    return (
        <div
            // ref={el => setRef(el)}
            class="bg-blue-500 bg-repeat w-full h-full "
            style={style()}
        ></div>
    );
}

function imgUrlEncode(svg: string, fill?: string) {
    svg = svg ?? "<svg></svg>"
    svg = svg.replace('fill="#000"', 'fill="' + fill + '"')
        .replace(/\"/g, "'")
        .replace(/\</g, "%3C")
        .replace(/\>/g, "%3E")
        .replace(/\&/g, "%26")
        .replace(/\#/g, "%23");
    return 'url("data:image/svg+xml; utf8, ' + svg  + '")';
}

export function randomPattern() {
    const patterns = usePatterns();
    const i = Math.floor(Math.random() * patterns.length);
    const name = patterns[i].name;
    return name
}
