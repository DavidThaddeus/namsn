export function errorMessage(error: unknown): unknown {
  return error && typeof error === 'object' && 'message' in error
    ? (error as { message: unknown }).message
    : error;
}
