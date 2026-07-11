// The application quota covers memory image/video files only.
// Album covers and profile avatars are intentionally excluded.
export const USER_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;

export const STORAGE_ALERT_THRESHOLDS = [80, 90, 100] as const;
