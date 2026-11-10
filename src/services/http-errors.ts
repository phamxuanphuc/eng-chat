import { ApiError } from './api-error';

export const geminiStatusError = (status: number | undefined, serverMessage: string | undefined, model: string): ApiError | null => {
  if (status === 400) {
    return serverMessage ? new ApiError('error.invalidRequest', { detail: serverMessage }) : new ApiError('error.geminiBadRequest');
  }
  if (status === 401 || status === 403) return new ApiError('error.geminiInvalidKey');
  if (status === 404) return new ApiError('error.geminiModelNotFound', { model });
  if (status === 429) return new ApiError('error.geminiQuota');
  if (status && status >= 500) return new ApiError('error.serverUnavailable', { status });
  return null;
};

export const openAiStatusError = (status: number | undefined, serverMessage: string | undefined, model: string): ApiError | null => {
  if (status === 400) {
    return serverMessage ? new ApiError('error.invalidRequest', { detail: serverMessage }) : new ApiError('error.openaiBadRequest');
  }
  if (status === 401 || status === 403) return new ApiError('error.openaiInvalidKey', { status, detail: serverMessage || '' });
  if (status === 404) return new ApiError('error.openaiNotFound', { model });
  if (status === 429) return new ApiError('error.openaiQuota', { detail: serverMessage || '' });
  if (status && status >= 500) return new ApiError('error.serverUnavailable', { status });
  return null;
};
