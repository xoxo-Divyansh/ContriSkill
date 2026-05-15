import React, { type CSSProperties, type LabelHTMLAttributes } from "react";

import { colorTokens, spacingTokens, typographyTokens } from "../tokens/index.js";

export const labelVariants = ["default", "muted"] as const;
export type LabelVariant = (typeof labelVariants)[number];

export const labelSizes = ["sm", "md"] as const;
export type LabelSize = (typeof labelSizes)[number];

export type LabelStyleOptions = {
  variant: LabelVariant;
  size: LabelSize;
};

export const resolveLabelStyles = (options: LabelStyleOptions): CSSProperties => {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: spacingTokens.xs,
    color: options.variant === "muted" ? colorTokens.text.muted : colorTokens.text.secondary,
    fontFamily: typographyTokens.fontFamily.body,
    fontWeight: typographyTokens.fontWeight.medium,
    fontSize: options.size === "sm" ? typographyTokens.fontSize.xs : typographyTokens.fontSize.sm,
    lineHeight: String(typographyTokens.lineHeight.normal)
  };
};

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  variant?: LabelVariant;
  size?: LabelSize;
  requiredIndicator?: boolean;
};

export const Label = ({
  variant = "default",
  size = "md",
  requiredIndicator = false,
  style,
  children,
  ...props
}: LabelProps) => {
  const resolvedStyle = resolveLabelStyles({ variant, size });

  return (
    <label {...props} style={{ ...resolvedStyle, ...style }}>
      {children}
      {requiredIndicator ? (
        <span aria-hidden="true" style={{ color: colorTokens.brand.danger }}>
          *
        </span>
      ) : null}
    </label>
  );
};
