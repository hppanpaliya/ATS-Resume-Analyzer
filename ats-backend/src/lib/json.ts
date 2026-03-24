export const safeJsonParse = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
