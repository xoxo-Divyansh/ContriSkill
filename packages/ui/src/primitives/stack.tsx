import React, { type CSSProperties, type ElementType, type HTMLAttributes } from "react";

import { spacingTokens } from "../tokens/index.js";

export const stackDirections = ["column", "row"] as const;
export type StackDirection = (typeof stackDirections)[number];

export type StackGap = keyof typeof spacingTokens;

export type StackStyleOptions = {
  direction: StackDirection;
  gap: StackGap;
  align: CSSProperties["alignItems"];
  justify: CSSProperties["justifyContent"];
  wrap: boolean;
};

export const resolveStackStyles = (options: StackStyleOptions): CSSProperties => {
  return {
    display: "flex",
    flexDirection: options.direction,
    gap: spacingTokens[options.gap],
    alignItems: options.align,
    justifyContent: options.justify,
    flexWrap: options.wrap ? "wrap" : "nowrap"
  };
};

export type StackProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  direction?: StackDirection;
  gap?: StackGap;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
};

export const Stack = ({
  as,
  direction = "column",
  gap = "md",
  align = "stretch",
  justify = "flex-start",
  wrap = false,
  style,
  ...props
}: StackProps) => {
  const Component = as ?? "div";
  const resolvedStyle = resolveStackStyles({
    direction,
    gap,
    align,
    justify,
    wrap
  });

  return <Component {...props} style={{ ...resolvedStyle, ...style }} />;
};
