import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Input,
  Label,
  Stack,
  Text
} from "@contriskill/ui";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("ui primitive imports", () => {
  it("renders imported primitives in web runtime safely", () => {
    const html = renderToStaticMarkup(
      createElement(
        Container,
        { as: "section", maxWidth: "md" },
        createElement(
          Card,
          null,
          createElement(CardHeader, null, createElement(Text, { variant: "subtitle" }, "Preview")),
          createElement(
            CardBody,
            null,
            createElement(
              Stack,
              { gap: "sm" },
              createElement(Label, { htmlFor: "preview-input" }, "Sample"),
              createElement(Input, { id: "preview-input", defaultValue: "value" }),
              createElement(Button, null, "Continue")
            )
          )
        )
      )
    );

    expect(html).toContain("Preview");
    expect(html).toContain("Continue");
  });
});
