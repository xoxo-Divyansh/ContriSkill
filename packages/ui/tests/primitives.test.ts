import { describe, expect, it } from "vitest";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Input,
  Label,
  Stack,
  Text,
  resolveButtonStyles,
  resolveCardStyles,
  resolveContainerStyles,
  resolveInputStyles,
  resolveLabelStyles,
  resolveStackStyles,
  resolveTextElement,
  resolveTextStyles
} from "../src";

describe("ui primitives exports", () => {
  it("exports all primitive components", () => {
    expect(Button).toBeDefined();
    expect(Input).toBeDefined();
    expect(Label).toBeDefined();
    expect(Text).toBeDefined();
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardBody).toBeDefined();
    expect(CardFooter).toBeDefined();
    expect(Stack).toBeDefined();
    expect(Container).toBeDefined();
  });
});

describe("primitive style resolvers", () => {
  it("resolves button styles with semantic variant defaults", () => {
    const styles = resolveButtonStyles({
      variant: "primary",
      size: "md",
      disabled: false,
      fullWidth: false
    });

    expect(styles.backgroundColor).toBe("#2563eb");
    expect(styles.borderRadius).toBe("0.5rem");
    expect(styles.minHeight).toBe("2.5rem");
  });

  it("resolves input styles with invalid state", () => {
    const styles = resolveInputStyles({
      size: "md",
      invalid: true,
      disabled: false
    });

    expect(styles.borderColor).toBe("#dc2626");
    expect(styles.width).toBe("100%");
  });

  it("resolves label styles with muted variant", () => {
    const styles = resolveLabelStyles({
      variant: "muted",
      size: "sm"
    });

    expect(styles.color).toBe("#64748b");
  });

  it("resolves text element and styles for metric variant", () => {
    expect(resolveTextElement("metric")).toBe("p");

    const styles = resolveTextStyles({
      variant: "metric",
      tone: "default",
      truncate: false
    });

    expect(styles.fontWeight).toBe(700);
  });

  it("resolves card, stack, and container styles for layout composition", () => {
    const cardStyles = resolveCardStyles({
      variant: "elevated",
      padding: "md"
    });
    const stackStyles = resolveStackStyles({
      direction: "column",
      gap: "md",
      align: "stretch",
      justify: "flex-start",
      wrap: false
    });
    const containerStyles = resolveContainerStyles({
      maxWidth: "lg",
      paddingX: "xl",
      paddingY: "none",
      centered: true
    });

    expect(cardStyles.boxShadow).toContain("rgb");
    expect(stackStyles.display).toBe("flex");
    expect(containerStyles.maxWidth).toBe("64rem");
  });
});
