import React, { type CSSProperties, type ElementType, type HTMLAttributes } from "react";

import { colorTokens, typographyTokens } from "../tokens/index.js";

export const textVariants = ["title", "subtitle", "body", "caption", "metric", "label"] as const;
export type TextVariant = (typeof textVariants)[number];

export const textTones = ["default", "muted", "success", "warning", "danger", "inverse"] as const;
export type TextTone = (typeof textTones)[number];

export type TextStyleOptions = {
  variant: TextVariant;
  tone: TextTone;
  truncate: boolean;
};

const textVariantMap: Record<TextVariant, CSSProperties> = {
  title: {
    fontSize: typographyTokens.fontSize["2xl"],
    fontWeight: typographyTokens.fontWeight.bold,
    lineHeight: String(typographyTokens.lineHeight.tight)
  },
  subtitle: {
    fontSize: typographyTokens.fontSize.lg,
    fontWeight: typographyTokens.fontWeight.semibold,
    lineHeight: String(typographyTokens.lineHeight.normal)
  },
  body: {
    fontSize: typographyTokens.fontSize.md,
    fontWeight: typographyTokens.fontWeight.regular,
    lineHeight: String(typographyTokens.lineHeight.normal)
  },
  caption: {
    fontSize: typographyTokens.fontSize.sm,
    fontWeight: typographyTokens.fontWeight.regular,
    lineHeight: String(typographyTokens.lineHeight.normal)
  },
  metric: {
    fontSize: typographyTokens.fontSize.xl,
    fontWeight: typographyTokens.fontWeight.bold,
    lineHeight: String(typographyTokens.lineHeight.tight)
  },
  label: {
    fontSize: typographyTokens.fontSize.sm,
    fontWeight: typographyTokens.fontWeight.medium,
    lineHeight: String(typographyTokens.lineHeight.normal)
  }
};

const textToneMap: Record<TextTone, string> = {
  default: colorTokens.text.primary,
  muted: colorTokens.text.muted,
  success: colorTokens.brand.success,
  warning: colorTokens.brand.warning,
  danger: colorTokens.brand.danger,
  inverse: colorTokens.text.inverse
};

export const resolveTextElement = (variant: TextVariant): ElementType => {
  if (variant === "title") {
    return "h2";
  }

  if (variant === "subtitle") {
    return "h3";
  }

  if (variant === "caption") {
    return "small";
  }

  if (variant === "label") {
    return "span";
  }

  return "p";
};

export const resolveTextStyles = (options: TextStyleOptions): CSSProperties => {
  return {
    margin: 0,
    color: textToneMap[options.tone],
    fontFamily: typographyTokens.fontFamily.body,
    ...textVariantMap[options.variant],
    ...(options.truncate
      ? {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      : {})
  };
};

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
  truncate?: boolean;
};

export const Text = ({
  as,
  variant = "body",
  tone = "default",
  truncate = false,
  style,
  ...props
}: TextProps) => {
  const Component = as ?? resolveTextElement(variant);
  const resolvedStyle = resolveTextStyles({ variant, tone, truncate });

  return <Component {...props} style={{ ...resolvedStyle, ...style }} />;
};
