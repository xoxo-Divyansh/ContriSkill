import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionDomainEvent,
  ContributionPost,
  ContributionRepository,
  ContributionEventRepository
} from "@contriskill/domain";

import type { RequestActor } from "../auth/types";

export type ContributionServiceDependencies = {
  repository: ContributionRepository;
  eventRepository: ContributionEventRepository;
  unitOfWork?: ContributionUnitOfWork;
};

export type ContributionUnitOfWork = {
  run<T>(work: () => Promise<T>): Promise<T>;
};

export type CreateContributionInput = {
  type: ContributionPost["type"];
  title: string;
  description: string;
  difficulty: ContributionPost["difficulty"];
  creditOffer: number;
};

export type UpdateContributionInput = Partial<
  Pick<CreateContributionInput, "title" | "description" | "difficulty" | "creditOffer">
>;

export type TransitionContributionInput = {
  postId: string;
  nextState: ContributionPost["state"];
  reason?: string;
};

export type SubmitContributionApplicationInput = {
  postId: string;
  message: string;
};

export type AcceptContributionApplicationInput = {
  postId: string;
  applicationId: string;
};

export type ContributionServiceResult<T> = {
  data: T;
  events: ContributionDomainEvent[];
};

export type ContributionService = {
  createContribution(
    actor: RequestActor | undefined,
    input: CreateContributionInput
  ): Promise<ContributionServiceResult<ContributionPost>>;
  updateContribution(
    actor: RequestActor | undefined,
    postId: string,
    input: UpdateContributionInput
  ): Promise<ContributionServiceResult<ContributionPost>>;
  cancelContribution(
    actor: RequestActor | undefined,
    postId: string,
    reason?: string
  ): Promise<ContributionServiceResult<ContributionPost>>;
  transitionContribution(
    actor: RequestActor | undefined,
    input: TransitionContributionInput
  ): Promise<ContributionServiceResult<ContributionPost>>;
  submitApplication(
    actor: RequestActor | undefined,
    input: SubmitContributionApplicationInput
  ): Promise<ContributionServiceResult<ContributionApplication>>;
  acceptApplication(
    actor: RequestActor | undefined,
    input: AcceptContributionApplicationInput
  ): Promise<ContributionServiceResult<ContributionCollaboration>>;
};
