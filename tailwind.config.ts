import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Colour System ── */
      colors: {
        background:  "hsl(var(--background))",
        recessed:    "hsl(var(--recessed))",
        "surface-high": "hsl(var(--surface-high))",
        foreground:  "hsl(var(--foreground))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",

        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        /* Brand */
        forest: {
          DEFAULT:    "hsl(var(--forest))",
          foreground: "hsl(var(--forest-foreground))",
        },

        /* Charge (rider) — orange */
        charge: {
          DEFAULT:    "hsl(var(--charge))",
          foreground: "hsl(var(--charge-foreground))",
          fixed:      "hsl(var(--charge-fixed))",
        },

        /* Host — teal */
        host: {
          DEFAULT:    "hsl(var(--host))",
          foreground: "hsl(var(--host-foreground))",
          fixed:      "hsl(var(--host-fixed))",
        },

        /* Ochre / tertiary */
        ochre: {
          DEFAULT:    "hsl(var(--ochre))",
          foreground: "hsl(var(--ochre-foreground))",
          fixed:      "hsl(var(--ochre-fixed))",
        },

        /* shadcn aliases */
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },

      /* ── Border Radius ── */
      borderRadius: {
        sm:     "var(--radius-sm)",
        DEFAULT:"var(--radius)",
        md:     "var(--radius-md)",
        lg:     "var(--radius-lg)",
        xl:     "var(--radius-xl)",
        "2xl":  "var(--radius-2xl)",
        full:   "var(--radius-full)",
      },

      /* ── Spacing ── */
      spacing: {
        gutter:          "1.25rem",
        "gutter-mobile": "0.75rem",
        "xs":            "0.25rem",
        "sm":            "0.5rem",
        "md":            "1rem",
        "lg":            "1.5rem",
        "xl":            "2.5rem",
        "margin":        "2rem",
        "margin-mobile": "1rem",
      },

      /* ── Typography ── */
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "system-ui", "sans-serif"],
        body:    ["var(--font-body)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans:    ["var(--font-body)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },

      fontSize: {
        /* Display */
        "display-lg":        ["48px", { lineHeight: "52px", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-lg-mobile": ["36px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md":        ["36px", { lineHeight: "42px", letterSpacing: "-0.02em", fontWeight: "700" }],

        /* Headline */
        "headline-lg":        ["32px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg-mobile": ["26px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md":        ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-sm":        ["18px", { lineHeight: "24px", fontWeight: "600" }],

        /* Body */
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],

        /* Label */
        "label-lg": ["14px", { lineHeight: "18px", letterSpacing: "0.02em",  fontWeight: "700" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.03em",  fontWeight: "600" }],
        "label-sm": ["10px", { lineHeight: "14px", letterSpacing: "0.05em",  fontWeight: "700" }],

        /* Data display (big numbers on cards) */
        "data-display": ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" }],
      },

      /* ── Box Shadows ── */
      boxShadow: {
        "card":       "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)",
        "stamp":      "2px 3px 0px hsl(var(--forest))",
        "stamp-charge":"2px 3px 0px hsl(var(--charge))",
        "stamp-ochre": "2px 3px 0px hsl(var(--ochre))",
      },

      /* ── Animation ── */
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
        "slide-in-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to:   { transform: "translateY(0)",   opacity: "1" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "slide-in-up":  "slide-in-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
