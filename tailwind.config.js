/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
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
        tea: '#D9F4C7', // Tea green
        ash: '#C1D2CC', // Ash gray
        periwinkle: '#A9AFD1',
        caramel: '#C08552',
        hunter: '#3F6C51',
        darkpurple: '#422040',
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
        // Custom colors for astrology website
        deepBlue: {
          DEFAULT: '#0a1930',
          light: '#1a2940',
          dark: '#050c1f',
        },
        gold: {
          DEFAULT: '#d9ad26',
          light: '#e9c356',
          dark: '#b08d18',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-raleway)', 'sans-serif'],
      },
      backgroundImage: {
        'stars': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTE5Ni42ODMgMTkzLjAyMmwxLjU2NiAyLjY2LS4xMTMtMy4yMTYgMy4wOTQtLjExNi0yLjU1OS0xLjkwNSAxLjU2LTIuNjYzLTIuODk0IDEuMzAzLTEuOTA1LTIuNTU5LjExNiAzLjA5NC0zLjIxNi0uMTEzIDIuNjYzIDEuNTYzLTEuMzA2IDIuODkyem0yOS40NTQtNTAuODVsLjY5NyAxLjE4NC0uMDUxLTEuNDMzIDEuMzgxLS4wNTItMS4xNDEtLjg1LjY5NC0xLjE4Ny0xLjI5Mi41ODMtLjg1LTEuMTQxLjA1MiAxLjM4MS0xLjQzMy0uMDUxIDEuMTg3LjY5NC41ODEgMS4yOTJ6TTkxLjk2MSAxMzEuMjJsMS4zOTMgMi4zNjUtLjEwMS0yLjg2IDIuNzUzLS4xMDMtMi4yNzctMS42OTUgMS4zOS0yLjM2OS0yLjU3NiAxLjE2MS0xLjY5NS0yLjI3Ny4xMDMgMi43NTMtMi44Ni0uMTAxIDIuMzY1IDEuMzkzIDEuMTY0IDIuNTczem0xNDQuNDA5IDExMi4yMjJsLjY5NyAxLjE4NC0uMDUxLTEuNDMzIDEuMzgxLS4wNTItMS4xNDEtLjg1LjY5NC0xLjE4Ny0xLjI5Mi41ODMtLjg1LTEuMTQxLjA1MiAxLjM4MS0xLjQzMy0uMDUxIDEuMTg3LjY5NC41ODEgMS4yOTJ6bTYwLjE5NS0xNjQuNjY1bC42MDYuOTU1LS42IDEuMDQzLS4wNTEtMS4yMTkgMS4xNzQtLjA0NC0uOTcyLS43MjQuNTkyLTEuMDE2LTEuMDk5LjQ5Ny0uNzI3LS45NjkuMDQ0IDEuMTc0LTEuMjItLjA0My45NTUuNjA2LjQ5NyAxLjA5NnptLTY5LjkyNSA4OC4xNDlsLjM4Ny42NTgtLjAyOC0uNzg0Ljc1NS0uMDI4LS42MjQtLjQ2NS4zODUtLjY0OC0uNzA3LjMxOS0uNDY1LS42MjQuMDI4Ljc1NS0uNzg0LS4wMjguNjU4LjM4LjMxOS43MTR6TTE1OC45MyAzNDEuNzExbC42OTcgMS4xODQtLjA1MS0xLjQzMyAxLjM4MS0uMDUyLTEuMTQxLS44NS42OTQtMS4xODctMS4yOTIuNTgzLS44NS0xLjE0MS4wNTIgMS4zODEtMS40MzMtLjA1MSAxLjE4Ny42OTQuNTgxIDEuMjkyem0xMTguNTMyLTI5LjEyM2wuNjk3IDEuMTg0LS4wNTEtMS40MzMgMS4zODEtLjA1Mi0xLjE0MS0uODUuNjk0LTEuMTg3LTEuMjkyLjU4My0uODUtMS4xNDEuMDUyIDEuMzgxLTEuNDMzLS4wNTEgMS4xODcuNjk0LjU4MSAxLjI5MnptLTc0LjA0OS0yNC4wNjZsLjM4Ny42NTgtLjAyOC0uNzg0Ljc1NS0uMDI4LS42MjQtLjQ2NS4zODUtLjY0OC0uNzA3LjMxOS0uNDY1LS42MjQuMDI4Ljc1NS0uNzg0LS4wMjguNjU4LjM4LjMxOS43MTR6bTI2LjQ1Mi0yNi4yNzVsLjMwMS41MTMtLjAyMi0uNjExLjU4OS0uMDIyLS40ODctLjM2My4zLS41MDYtLjU1MS4yNDgtLjM2My0uNDg3LjAyMi41ODktLjYxMS0uMDIyLjUxMy4yOTUuMjQ4LjU1OHpNMzMxLjc5NiA4Ny45NzhsLjQ3LjgwMS0uMDM0LS45NTMuOTE4LS4wMzQtLjc1OC0uNTY2LjQ2Ny0uODEyLS44NTkuMzg4LS41NjYtLjc1Ny4wMzQuOTE4LS45NTMtLjAzNC44MDEuNDcuMzg4Ljg2NHptLTc4LjQxNiAyMDguNDg2bC4zMDEuNTEzLS4wMjItLjYxMS41ODktLjAyMi0uNDg3LS4zNjMuMy0uNTA2LS41NTEuMjQ4LS4zNjMtLjQ4Ny4wMjIuNTg5LS42MTEtLjAyMi41MTMuMjk1LjI0OC41NTh6bS0xNTIuODY3LTk0LjE5OGwuMzAxLjUxMy0uMDIyLS42MTEuNTg5LS4wMjItLjQ4Ny0uMzYzLjMtLjUwNi0uNTUxLjI0OC0uMzYzLS40ODcuMDIyLjU4OS0uNjExLS4wMjIuNTEzLjI5NS4yNDguNTU4em03OS4wMjctMTA4LjE3NGwuNDcuODAxLS4wMzQtLjk1My45MTgtLjAzNC0uNzU4LS41NjYuNDY3LS44MTItLjg1OS4zODgtLjU2Ni0uNzU3LjAzNC45MTgtLjk1My0uMDM0LjgwMS40Ny4zODguODY0eiIgb3BhY2l0eT0iLjUiLz48L3N2Zz4=')",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
