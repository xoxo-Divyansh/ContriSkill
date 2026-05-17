import { ContributionDomainError } from "./errors.js";
import { contributionCollaborationTransitions, contributionPostTransitions } from "./states.js";
import type { ContributionCollaborationState, ContributionPostState } from "./types.js";

const canTransition = <TState extends string>(
  currentState: TState,
  nextState: TState,
  allowedTransitions: Record<TState, readonly TState[]>
): boolean => {
  return allowedTransitions[currentState].includes(nextState);
};

export const assertValidPostTransition = (
  currentState: ContributionPostState,
  nextState: ContributionPostState
): void => {
  const allowed = canTransition(currentState, nextState, contributionPostTransitions);
  if (!allowed) {
    throw new ContributionDomainError(
      "CONTRIBUTION_INVALID_TRANSITION",
      `Invalid post transition from "${currentState}" to "${nextState}".`,
      { currentState, nextState }
    );
  }
};

export const assertValidCollaborationTransition = (
  currentState: ContributionCollaborationState,
  nextState: ContributionCollaborationState
): void => {
  const allowed = canTransition(currentState, nextState, contributionCollaborationTransitions);
  if (!allowed) {
    throw new ContributionDomainError(
      "CONTRIBUTION_INVALID_TRANSITION",
      `Invalid collaboration transition from "${currentState}" to "${nextState}".`,
      { currentState, nextState }
    );
  }
};

export const transitionPostState = (
  currentState: ContributionPostState,
  nextState: ContributionPostState
): ContributionPostState => {
  assertValidPostTransition(currentState, nextState);
  return nextState;
};

export const transitionCollaborationState = (
  currentState: ContributionCollaborationState,
  nextState: ContributionCollaborationState
): ContributionCollaborationState => {
  assertValidCollaborationTransition(currentState, nextState);
  return nextState;
};
