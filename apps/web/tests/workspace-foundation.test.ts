import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  EmptyState,
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../src/components/workspace/workspace-foundation";

describe("workspace foundation components", () => {
  it("renders workspace panels with metric and status content", () => {
    const html = renderToStaticMarkup(
      createElement(
        WorkspacePanel,
        {
          eyebrow: "Platform",
          title: "Workspace overview",
          description: "Shared contribution context"
        },
        createElement(MetricCard, {
          label: "Participants",
          value: 4,
          helper: "Visible right now"
        }),
        createElement(StatusBadge, {
          label: "Realtime connected",
          tone: "success"
        })
      )
    );

    expect(html).toContain("Workspace overview");
    expect(html).toContain("Participants");
    expect(html).toContain("Realtime connected");
  });

  it("renders empty states with actions", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: "No contributions yet",
        description: "Create the first contribution to get the workspace moving.",
        actions: createElement("span", null, "Create")
      })
    );

    expect(html).toContain("No contributions yet");
    expect(html).toContain("Create the first contribution");
    expect(html).toContain("Create");
  });
});
