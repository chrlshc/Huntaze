/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "24px" },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: { DEFAULT: "hsl(var(--brand))", foreground: "hsl(var(--brand-foreground))" },
        destructive: "hsl(var(--destructive))"
      },
      boxShadow: { card: "0 1px 2px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.04)" },
      borderRadius: { xl: "1rem" }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
