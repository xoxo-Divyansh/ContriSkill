import React, { type CSSProperties, type ElementType, type HTMLAttributes } from "react";

import { spacingTokens } from "../tokens/index.js";

export const containerWidths = ["sm", "md", "lg", "xl", "full"] as const;
export type ContainerWidth = (typeof containerWidths)[number];

export type ContainerPadding = keyof typeof spacingTokens;

const maxWidthMap: Record<ContainerWidth, string> = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  full: "100%"
};

export type ContainerStyleOptions = {
  maxWidth: ContainerWidth;
  paddingX: ContainerPadding;
  paddingY: ContainerPadding;
  centered: boolean;
};

export const resolveContainerStyles = (options: ContainerStyleOptions): CSSProperties => {
  return {
    width: "100%",
    maxWidth: maxWidthMap[options.maxWidth],
    paddingInline: spacingTokens[options.paddingX],
    paddingBlock: spacingTokens[options.paddingY],
    marginInline: options.centered ? "auto" : undefined
  };
};

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  maxWidth?: ContainerWidth;
  paddingX?: ContainerPadding;
  paddingY?: ContainerPadding;
  centered?: boolean;
};

export const Container = ({
  as,
  maxWidth = "xl",
  paddingX = "xl",
  paddingY = "none",
  centered = true,
  style,
  ...props
}: ContainerProps) => {
  const Component = as ?? "div";
  const resolvedStyle = resolveContainerStyles({
    maxWidth,
    paddingX,
    paddingY,
    centered
  });

  return <Component {...props} style={{ ...resolvedStyle, ...style }} />;
};
