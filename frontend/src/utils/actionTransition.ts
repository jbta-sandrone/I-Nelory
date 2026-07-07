export const ACTION_TRANSITION_DURATION_MS = 3000;

export const defaultActionMessages = [
  "Saving your memory...",
  "Preserving your moment...",
  "Updating your digital journal...",
  "Organizing your memories...",
  "Almost there...",
];

export function startActionTransition() {
  return Date.now();
}

export function waitForActionTransition(
  startedAt: number,
  duration = ACTION_TRANSITION_DURATION_MS,
) {
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, duration - elapsed);

  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}
