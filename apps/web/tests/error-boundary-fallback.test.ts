import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import RootError from "../src/app/error";

describe("error boundary fallback", () => {
  it("renders production-safe fallback actions", () => {
    const html = renderToStaticMarkup(
      createElement(RootError, {
        error: new Error("boom"),
        reset: vi.fn()
      })
    );

    expect(html).toContain("runtime problem");
    expect(html).toContain("Try Again");
    expect(html).toContain("Reload Page");
  });
});
