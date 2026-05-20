import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionPost
} from "../../../../../lib/api/contribution-client";

export type ContributionWorkspaceState = {
  posts: ContributionPost[];
  applications: ContributionApplication[];
  collaborations: ContributionCollaboration[];
};

const defaultState: ContributionWorkspaceState = {
  posts: [],
  applications: [],
  collaborations: []
};

const contributionStorageKey = "contriskill.contribution.workspace.v1";

const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
};

export const loadContributionWorkspaceState = (): ContributionWorkspaceState => {
  if (!isBrowser()) {
    return defaultState;
  }

  const raw = window.localStorage.getItem(contributionStorageKey);
  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ContributionWorkspaceState>;
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      collaborations: Array.isArray(parsed.collaborations) ? parsed.collaborations : []
    };
  } catch {
    return defaultState;
  }
};

export const saveContributionWorkspaceState = (state: ContributionWorkspaceState): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(contributionStorageKey, JSON.stringify(state));
};
