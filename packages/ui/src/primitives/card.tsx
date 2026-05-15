import React, { type CSSProperties, type HTMLAttributes } from "react";

import { colorTokens, radiusTokens, shadowTokens, spacingTokens } from "../tokens/index.js";

export const cardVariants = ["elevated", "outlined", "subtle"] as const;
export type CardVariant = (typeof cardVariants)[number];

export const cardPaddings = ["none", "sm", "md", "lg"] as const;
export type CardPadding = (typeof cardPaddings)[number];

const paddingMap: Record<CardPadding, string> = {
  none: spacingTokens.none,
  sm: spacingTokens.md,
  md: spacingTokens.lg,
  lg: spacingTokens.xl
};

export type CardStyleOptions = {
  variant: CardVariant;
  padding: CardPadding;
};

export const resolveCardStyles = (options: CardStyleOptions): CSSProperties => {
  if (options.variant === "subtle") {
    return {
      backgroundColor: colorTokens.background.subtle,
      borderRadius: radiusTokens.lg,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: colorTokens.border.subtle,
      boxShadow: shadowTokens.none,
      padding: paddingMap[options.padding]
    };
  }

  if (options.variant === "outlined") {
    return {
      backgroundColor: colorTokens.background.surface,
      borderRadius: radiusTokens.lg,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: colorTokens.border.subtle,
      boxShadow: shadowTokens.none,
      padding: paddingMap[options.padding]
    };
  }

  return {
    backgroundColor: colorTokens.background.surface,
    borderRadius: radiusTokens.lg,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colorTokens.border.subtle,
    boxShadow: shadowTokens.sm,
    padding: paddingMap[options.padding]
  };
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export const Card = ({ variant = "elevated", padding = "md", style, ...props }: CardProps) => {
  const resolvedStyle = resolveCardStyles({ variant, padding });

  return <div {...props} style={{ ...resolvedStyle, ...style }} />;
};

const sectionBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: spacingTokens.sm
};

export const CardHeader = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      style={{
        ...sectionBaseStyle,
        paddingBlockEnd: spacingTokens.md,
        borderBlockEnd: `1px solid ${colorTokens.border.subtle}`,
        ...style
      }}
    />
  );
};

export const CardBody = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      style={{
        ...sectionBaseStyle,
        paddingBlock: spacingTokens.md,
        ...style
      }}
    />
  );
};

export const CardFooter = ({ style, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      style={{
        ...sectionBaseStyle,
        paddingBlockStart: spacingTokens.md,
        borderBlockStart: `1px solid ${colorTokens.border.subtle}`,
        ...style
      }}
    />
  );
};
