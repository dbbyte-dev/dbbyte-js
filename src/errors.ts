// The DBByte API returns { error: string, hint?: string } on failure.
// There is no `code` field in the current API - do not rely on one.
//
// A 429 can mean two different things and they are NOT both retryable:
// - Burst rate limit: carries a Retry-After header, transient, safe to retry.
// - Plan API request quota exceeded: no Retry-After header, retrying does
//   nothing until the billing period resets or the plan is upgraded.
// Check `retryAfter` rather than the message text to tell them apart.
export class DBByteError extends Error {
  status: number;
  hint?: string;
  retryAfter?: number;

  constructor(
    message: string,
    status: number,
    hint?: string,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "DBByteError";
    this.status = status;
    this.hint = hint;
    this.retryAfter = retryAfter;
  }
}
