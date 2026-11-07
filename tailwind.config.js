/** @type {import('tailwindcss').Config} */
const color = (name) => `rgb(var(--${name}) / <alpha-value>)`;
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./packages/shared/src/**/*.{ts,tsx,js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: color("background"),
        foreground: color("foreground"),
        input: color("input"),
        ring: color("ring"),
        ...Object.fromEntries(["primary", "secondary", "muted", "accent", "popover", "card", "destructive"].map((name) => [name, { DEFAULT: color(name), foreground: color(`${name}-foreground`) }])),
        codekita: Object.fromEntries(["bg", "surface", "surface-elevated", "border", "primary", "primary-foreground", "secondary", "secondary-foreground", "purple", "purple-foreground", "text-primary", "text-secondary", "success", "warning", "error"].map((name) => [name, color(`ck-${name}`)])),
        "background-deep": "var(--background-deep)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-hover": "var(--surface-hover)",
        "accent-primary": "var(--accent-primary)",
        "accent-hover": "var(--accent-hover)",
        "accent-muted": "var(--accent-muted)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: color("border"),
        "border-active": "var(--border-active)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius-lg, 8px)",
        md: "var(--radius-md, 6px)",
        sm: "var(--radius-sm, 4px)",
      },
      boxShadow: {
        "ck-sm": "0 1px 3px rgb(0 0 0 / .1)",
        "ck-md": "0 8px 24px rgb(0 0 0 / .15)",
        "ck-lg": "0 20px 70px rgb(0 0 0 / .3)",
        "ck-glow": "0 0 18px rgb(var(--ck-primary) / .06)",
        card: "var(--shadow-card, 0 4px 20px rgba(0,0,0,0.4))",
        glow: "var(--shadow-glow, 0 0 30px rgba(159,239,0,0.15))",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".bg-grid": {
          backgroundImage: "url(\"/bg-grid.svg\")",
        },
        ".spotlight": {
          position: "fixed",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)",
          transform: "translate(-50%, -50%) scale(0)",
          pointerEvents: "none",
          transition: "transform 0.3s ease-out",
        },
        ".grid-active": {
          transform: "translate(-50%, -50%) scale(1)",
        },
      });
    },
  ],
}