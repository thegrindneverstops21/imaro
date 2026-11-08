import { heroui } from "@heroui/theme";

export default heroui({
  defaultTheme: "light",
  layout: {
    radius: { small: "4px", medium: "6px", large: "8px" },
    fontSize: { small: "0.875rem", medium: "1rem", large: "1.125rem" },
  },
  themes: {
    light: {
      colors: {
        background: "#f5f4f0",
        foreground: "#16324f",
        primary: { DEFAULT: "#16324f", foreground: "#ffffff" },
        focus: "#16324f",
        content1: "#ffffff",
        content2: "#eeece6",
        divider: "#d6d2c9",
      },
    },
  },
});
