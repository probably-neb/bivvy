/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class", '[data-kb-theme="dark"]'],
    content: ["src/**/*.{ts,tsx}"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            fontSize: {
                sm: "clamp(0.7rem, 0.43vw + 0.6rem, 0.94rem)",
                base: "clamp(0.75rem, 0.68vw + 0.58rem, 1.13rem)",
                lg: "clamp(0.8rem, 1vw + 0.55rem, 1.35rem)",
                xl: "clamp(0.85rem, 1.39vw + 0.51rem, 1.62rem)",
                "2xl": "clamp(0.91rem, 1.88vw + 0.44rem, 1.94rem)",
                "3xl": "clamp(0.97rem, 2.47vw + 0.35rem, 2.33rem)",
                "4xl": "clamp(1.04rem, 3.2vw + 0.24rem, 2.8rem)",
                "5xl": "clamp(1.11rem, 4.1vw + 0.08rem, 3.36rem)",
                "6xl": "clamp(1.18rem, 5.18vw + -0.11rem, 4.03rem)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--kb-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--kb-accordion-content-height)" },
                    to: { height: 0 },
                },
                "collapsible-down": {
                    from: { height: 0 },
                    to: { height: "var(--kb-collapsible-content-height)" },
                },
                "collapsible-up": {
                    from: { height: "var(--kb-collapsible-content-height)" },
                    to: { height: 0 },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "collapsible-down": "collapsible-down 0.2s ease-out",
                "collapsible-up": "collapsible-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
