import React, { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from "react";

import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from "../tokens/index.js";

export const buttonVariants = ["primary", "secondary", "ghost", "destructive"] as const;
export type ButtonVariant = (typeof buttonVariants)[number];

export const buttonSizes = ["sm", "md", "lg"] as const;
export type ButtonSize = (typeof buttonSizes)[number];

export type ButtonStyleOptions = {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  fullWidth: boolean;
};

const sizeStyleMap: Record<ButtonSize, CSSProperties> = {
  sm: {
    minHeight: "2rem",
    paddingInline: spacingTokens.md,
    paddingBlock: spacingTokens.xs,
    fontSize: typographyTokens.fontSize.sm
  },
  md: {
    minHeight: "2.5rem",
    paddingInline: spacingTokens.lg,
    paddingBlock: spacingTokens.sm,
    fontSize: typographyTokens.fontSize.md
  },
  lg: {
    minHeight: "2.875rem",
    paddingInline: spacingTokens.xl,
    paddingBlock: spacingTokens.md,
    fontSize: typographyTokens.fontSize.lg
  }
};

const variantStyleMap: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: colorTokens.brand.primary,
    borderColor: "transparent",
    color: colorTokens.text.inverse,
    boxShadow: shadowTokens.sm
  },
  secondary: {
    backgroundColor: colorTokens.background.surface,
    borderColor: colorTokens.border.subtle,
    color: colorTokens.text.primary,
    boxShadow: shadowTokens.none
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: colorTokens.text.secondary,
    boxShadow: shadowTokens.none
  },
  destructive: {
    backgroundColor: colorTokens.brand.danger,
    borderColor: "transparent",
    color: colorTokens.text.inverse,
    boxShadow: shadowTokens.sm
  }
};

export const resolveButtonStyles = (options: ButtonStyleOptions): CSSProperties => {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacingTokens.xs,
    width: options.fullWidth ? "100%" : "auto",
    borderRadius: radiusTokens.md,
    borderWidth: "1px",
    borderStyle: "solid",
    cursor: options.disabled ? "not-allowed" : "pointer",
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.semibold,
    lineHeight: String(typographyTokens.lineHeight.tight),
    transition:
      "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease",
    ...sizeStyleMap[options.size],
    ...variantStyleMap[options.variant],
    ...(options.disabled
      ? {
          opacity: 0.6,
          boxShadow: shadowTokens.none
        }
      : {})
  };
};

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      loadingLabel,
      style,
      type,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled) || loading;
    const resolvedStyle = resolveButtonStyles({
      variant,
      size,
      disabled: isDisabled,
      fullWidth
    });

    return (
      <button
        {...props}
        ref={ref}
        type={type ?? "button"}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        style={{ ...resolvedStyle, ...style }}
      >
        {loading ? (loadingLabel ?? "Loading...") : children}
      </button>
    );
  }
);

Button.displayName = "Button";
