/** @type {import('tailwindcss').Config} */
const color = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  darkMode: ["class"], content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      border: color("border"), input: color("input"), ring: color("ring"), background: color("background"), foreground: color("foreground"),
      ...Object.fromEntries(["primary", "secondary", "muted", "accent", "popover", "card", "destructive"].map((name) => [name, { DEFAULT: color(name), foreground: color(`${name}-foreground`) }])),
      codekita: Object.fromEntries(["bg", "surface", "surface-elevated", "border", "primary", "primary-foreground", "secondary", "secondary-foreground", "purple", "purple-foreground", "text-primary", "text-secondary", "success", "warning", "error"].map((name) => [name, color(`ck-${name}`)])),
    },
    fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "ui-monospace", "monospace"] },
    boxShadow: { "ck-sm": "0 1px 3px rgb(0 0 0 / .1)", "ck-md": "0 8px 24px rgb(0 0 0 / .15)", "ck-lg": "0 20px 70px rgb(0 0 0 / .3)", "ck-glow": "0 0 18px rgb(var(--ck-primary) / .06)" },
  } }, plugins: [],
};