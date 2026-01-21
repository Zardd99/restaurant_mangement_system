export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T, E = string>(value: T): Result<T, E> => ({
  ok: true,
  value,
});
export const Err = <T = never, E = string>(error: E): Result<T, E> => ({
  ok: false,
  error,
});
