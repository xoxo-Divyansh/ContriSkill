import React, { forwardRef, type CSSProperties, type InputHTMLAttributes } from "react";

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from "../tokens/index.js";

export const inputSizes = ["sm", "md", "lg"] as const;
export type InputSize = (typeof inputSizes)[number];

export type InputStyleOptions = {
  size: InputSize;
  invalid: boolean;
  disabled: boolean;
};

const sizeStyleMap: Record<InputSize, CSSProperties> = {
  sm: {
    minHeight: "2rem",
    paddingInline: spacingTokens.sm,
    paddingBlock: spacingTokens.xs,
    fontSize: typographyTokens.fontSize.sm
  },
  md: {
    minHeight: "2.5rem",
    paddingInline: spacingTokens.md,
    paddingBlock: spacingTokens.sm,
    fontSize: typographyTokens.fontSize.md
  },
  lg: {
    minHeight: "2.875rem",
    paddingInline: spacingTokens.lg,
    paddingBlock: spacingTokens.md,
    fontSize: typographyTokens.fontSize.lg
  }
};

export const resolveInputStyles = (options: InputStyleOptions): CSSProperties => {
  return {
    width: "100%",
    borderRadius: radiusTokens.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: options.invalid ? colorTokens.brand.danger : colorTokens.border.subtle,
    backgroundColor: options.disabled
      ? colorTokens.background.subtle
      : colorTokens.background.surface,
    color: options.disabled ? colorTokens.text.muted : colorTokens.text.primary,
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.regular,
    lineHeight: String(typographyTokens.lineHeight.normal),
    outlineOffset: "2px",
    transition: "border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
    ...sizeStyleMap[options.size]
  };
};

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = "md", invalid = false, style, disabled, ...props }, ref) => {
    const resolvedStyle = resolveInputStyles({
      size,
      invalid,
      disabled: Boolean(disabled)
    });

    return (
      <input
        {...props}
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        style={{ ...resolvedStyle, ...style }}
      />
    );
  }
);

Input.displayName = "Input";
