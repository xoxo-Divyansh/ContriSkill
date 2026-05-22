"use client";

import { Text } from "@contriskill/ui";
import React from "react";
import type { HTMLAttributes, ReactNode } from "react";

import styles from "./workspace-foundation.module.css";

type StatusTone = "default" | "success" | "warning" | "danger";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const statusToneClassMap: Record<StatusTone, string> = {
  default: styles.statusDefault as string,
  success: styles.statusSuccess as string,
  warning: styles.statusWarning as string,
  danger: styles.statusDanger as string
};

export const StatusBadge = ({ label, tone = "default" }: StatusBadgeProps) => {
  return <span className={`${styles.statusBadge} ${statusToneClassMap[tone]}`}>{label}</span>;
};

type WorkspacePanelProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  subtle?: boolean;
};

export const WorkspacePanel = ({
  eyebrow,
  title,
  description,
  actions,
  footer,
  subtle = false,
  children,
  className,
  ...props
}: WorkspacePanelProps) => {
  return (
    <section
      {...props}
      className={[
        styles.surfacePanel,
        subtle ? styles.surfacePanelSubtle : "",
        className ?? ""
      ].join(" ")}
    >
      <div className={styles.panelHeader}>
        {eyebrow ? <p className={styles.panelEyebrow}>{eyebrow}</p> : null}
        <div className={styles.panelTitleRow}>
          <div>
            <Text variant="subtitle">{title}</Text>
            {description ? <p className={styles.panelDescription}>{description}</p> : null}
          </div>
          {actions}
        </div>
      </div>
      <div className={styles.panelBody}>{children}</div>
      {footer ? <div className={styles.panelFooter}>{footer}</div> : null}
    </section>
  );
};

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export const MetricCard = ({ label, value, helper }: MetricCardProps) => {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      {helper ? <p className={styles.metricHelper}>{helper}</p> : null}
    </div>
  );
};

type EmptyStateProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export const EmptyState = ({ title, description, actions }: EmptyStateProps) => {
  return (
    <div className={styles.emptyState}>
      <Text variant="subtitle">{title}</Text>
      <Text tone="muted">{description}</Text>
      {actions ? <div className={styles.emptyStateActions}>{actions}</div> : null}
    </div>
  );
};
