import { Show, createEffect, createMemo, createResource, createSignal, on } from "solid-js";
import patterns from "./patterns.json";

export function usePatterns() {
    return patterns;
}

function patternUrl(name: string) {
    console.log(name);
    return `patterns/${name}.svg`;
}

export function Pattern(props: { name: string; fill?: string }) {
    const pattern = patterns.find(p => p.name === props.name);
    if (!pattern) return;
    const style = createMemo(() => {
        const style = `background-image: ${imgUrlEncode(
            pattern.image,
            props.fill ?? "#FFFFFF",
        )}`;
        return style;
    });
    return (
        <div
            // ref={el => setRef(el)}
            class="bg-blue-500 rounded-t-xl bg-repeat w-full h-full "
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
