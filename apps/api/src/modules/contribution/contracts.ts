import type {
  ContributionApplication,
  ContributionCollaboration,
  ContributionDomainEvent,
  ContributionPost
} from "@contriskill/domain";

type ApiSuccessEnvelope<TData> = {
  data: TData;
};

type ApiErrorEnvelope = {
  error: {
    code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" | "STATE_CONFLICT";
    message: string;
    details?: Record<string, string | number | boolean>;
  };
};

export type CreateContributionRequestBody = {
  type: ContributionPost["type"];
  title: string;
  description: string;
  difficulty: ContributionPost["difficulty"];
  creditOffer: number;
};

export type UpdateContributionRequestBody = Partial<
  Pick<CreateContributionRequestBody, "title" | "description" | "difficulty" | "creditOffer">
>;

export type CancelContributionRequestBody = {
  reason?: string;
};

export type TransitionContributionRequestBody = {
  nextState: ContributionPost["state"];
  reason?: string;
};

export type SubmitApplicationRequestBody = {
  message: string;
};

export type ContributionApiResponseMeta = {
  events: Pick<ContributionDomainEvent, "id" | "type" | "aggregateType" | "aggregateId">[];
};

export type CreateContributionResponse = ApiSuccessEnvelope<{
  post: ContributionPost;
  meta: ContributionApiResponseMeta;
}>;

export type UpdateContributionResponse = ApiSuccessEnvelope<{
  post: ContributionPost;
  meta: ContributionApiResponseMeta;
}>;

export type CancelContributionResponse = ApiSuccessEnvelope<{
  post: ContributionPost;
  meta: ContributionApiResponseMeta;
}>;

export type TransitionContributionResponse = ApiSuccessEnvelope<{
  post: ContributionPost;
  meta: ContributionApiResponseMeta;
}>;

export type SubmitApplicationResponse = ApiSuccessEnvelope<{
  application: ContributionApplication;
  meta: ContributionApiResponseMeta;
}>;

export type AcceptApplicationResponse = ApiSuccessEnvelope<{
  collaboration: ContributionCollaboration;
  meta: ContributionApiResponseMeta;
}>;

export type ContributionErrorResponse = ApiErrorEnvelope;
