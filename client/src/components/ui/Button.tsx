import { Button as HoverButton } from "@heroui/react";
import { ReactNode } from "react";

/** Button variant options - using string to avoid HeroUI type restrictions */
export type ButtonVariant = "primary" | "quiet" | "outline" | "wide" | "text";

/** Build style object for the button variant using project CSS variables */
function buildButtonStyle(variant: string): React.CSSProperties {
  // Base inline styles applied to all buttons
  const style: React.CSSProperties = {
    minHeight: 46,
    borderRadius: 0,
    fontSize: 11,
    letterSpacing: 0.06,
    textTransform: "uppercase",
    transition: "background 0.2s, color 0.2s, border 0.2s",
  };

  // Variant-specific visual styles (background, color, border)
  if (variant === "primary") {
    Object.assign(style, {
      background: "var(--blue)",
      color: "white",
      borderColor: "var(--blue)",
      _hover: {
        background: "var(--deep)",
        borderColor: "var(--deep)",
      },
      _disabled: {
        opacity: "0.55",
        cursor: "wait",
      },
    });
  } else if (variant === "quiet") {
    Object.assign(style, {
      background: "transparent",
      color: "var(--blue)",
      borderColor: "var(--line)",
      _hover: {
        color: "white",
      },
      _disabled: {
        opacity: "0.55",
        cursor: "wait",
      },
    });
  } else if (variant === "outline") {
    Object.assign(style, {
      background: "transparent",
      color: "var(--blue)",
      borderColor: "var(--blue)",
      _hover: {
        background: "var(--blue)",
        color: "white",
      },
      _disabled: {
        opacity: "0.55",
        cursor: "wait",
      },
    });
  } else if (variant === "text") {
    Object.assign(style, {
      background: "transparent",
      border: "none",
      color: "var(--blue)",
      padding: "6px 0",
      fontSize: "12px",
      _hover: {
        textDecoration: "underline",
      },
      _disabled: {
        opacity: "0.55",
        cursor: "wait",
      },
    });
  }

  // Wide layout variant - 100% width
  if (variant === "wide") {
    ;(style as React.CSSProperties).width = "100%";
  }

  return style;
}

/** Custom Button component using @heroui/react Button */
export function Button({
  variant = "primary",
  asChild,
  children
}: {
  variant?: string;
  asChild?: boolean;
  children?: ReactNode;
}) {
  const style = buildButtonStyle(variant);

  if (asChild) {
    // When asChild is true, render a wrapper that passes props to the child
    const Wrapper = ({ children }: { children: ReactNode }) => {
      return <HoverButton style={style}>{children}</HoverButton>;
    };
    return <Wrapper>{children}</Wrapper>;
  }

  return <HoverButton style={style}>{children}</HoverButton>;
}

/** Default export for convenience */
export default Button;