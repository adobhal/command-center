export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
} as const;

export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  AI_REQUESTS_PER_MINUTE: 20,
  FILE_UPLOAD_SIZE_MB: 10,
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;
