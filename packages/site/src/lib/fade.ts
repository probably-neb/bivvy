type Fade = {
    from: string;
    via?: string;
    to: string;
}

const FADES: Fade[] = [
    {
        from: "#145277",
        to: "#83D0CB",
    },
    {
        from: "#ea5459",
        to: "#f7ba2c",
    },
    {
        from: "#34073d",
        to: "#ef745c",
    },
    {
        from: "#0a3431",
        to: "#4a9b7f",
    },
    {
        from: "#cf203e",
        to: "#505da0",
    },
    {
        from: "#e60b09",
        to: "#e9d022",
    },
    {
        from: "#3d47d9",
        via: "#e97cbb",
        to: "#f9e7bb",
    },
    {
        from: "#1a2766",
        via: "#ae1b1e",
        to: "#fc9f32",
    }
]

function randomFade() {
    return FADES[Math.floor(Math.random() * FADES.length)];
}

export function fadeTW(f: Fade) {
    return `from-[${f.from}] ${f.via ? `via-[${f.via}]` : ''} to-[${f.to}]`;
}

export function fadeTWInv(f: Fade) {
    return `from-[${f.to}] ${f.via ? `via-[${f.via}]` : ''} to-[${f.from}]`;
}

const _fade = randomFade();
export const fade = fadeTW(_fade);
export const fadeinv = fadeTWInv(_fade);

