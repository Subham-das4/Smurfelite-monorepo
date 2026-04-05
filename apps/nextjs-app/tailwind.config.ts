module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED", // Distinct purple from screenshots
        "primary-hover": "#6D28D9",
        "background-light": "#F3F4F6",
        "background-dark": "#18181B", // Dark zinc
        "surface-light": "#FFFFFF",
        "surface-dark": "#27272A", // Slightly lighter dark
        "accent-dark": "#1F1F23", // Deep background for sections
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        xl: "1rem",
        lg: "1rem",
      },
    },
  },
};
