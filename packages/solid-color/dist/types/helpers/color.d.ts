import tinycolor from 'tinycolor2';
export declare const simpleCheckForValidColor: (data: any) => any;
export declare const toState: (data: any, oldHue?: number) => {
    hsl: tinycolor.ColorFormats.HSLA;
    hex: string;
    rgb: tinycolor.ColorFormats.RGBA;
    hsv: tinycolor.ColorFormats.HSVA;
    oldHue: any;
    source: any;
};
export declare const isValidHex: (hex: any) => boolean;
export declare const getContrastingColor: (data: any) => "#fff" | "rgba(0,0,0,0.4)" | "#000";
export declare const red: {
    hsl: {
        a: number;
        h: number;
        l: number;
        s: number;
    };
    hex: string;
    rgb: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    hsv: {
        h: number;
        s: number;
        v: number;
        a: number;
    };
};
export declare const isvalidColorString: (str: string, type: string) => boolean;
