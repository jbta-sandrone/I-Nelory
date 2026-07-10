export type MoodOption = {
  name: string;
  emoji: string;
};

export type ApiTag = {
  id?: string;
  name: string;
  color?: string | null;
};

export const MOOD_OPTIONS: MoodOption[] = [
  { emoji: "😊", name: "Happy" },
  { emoji: "😁", name: "Excited" },
  { emoji: "🥳", name: "Celebrating" },
  { emoji: "😍", name: "Loved" },
  { emoji: "🥰", name: "Grateful" },
  { emoji: "😌", name: "Peaceful" },
  { emoji: "🤩", name: "Inspired" },
  { emoji: "😎", name: "Confident" },
  { emoji: "💪", name: "Motivated" },
  { emoji: "😂", name: "Funny" },
  { emoji: "🌈", name: "Hopeful" },
  { emoji: "✨", name: "Proud" },
  { emoji: "🤔", name: "Thoughtful" },
  { emoji: "📚", name: "Productive" },
  { emoji: "😴", name: "Relaxed" },
  { emoji: "🌤", name: "Calm" },
  { emoji: "🧘", name: "Mindful" },
  { emoji: "😶", name: "Neutral" },
  { emoji: "😢", name: "Sad" },
  { emoji: "😔", name: "Disappointed" },
  { emoji: "😞", name: "Lonely" },
  { emoji: "😰", name: "Anxious" },
  { emoji: "😤", name: "Frustrated" },
  { emoji: "😡", name: "Angry" },
  { emoji: "😓", name: "Stressed" },
  { emoji: "🥺", name: "Emotional" },
];

export const SUGGESTED_TAGS = [
  "Travel",
  "Family",
  "Friends",
  "Relationship",
  "Birthday",
  "Celebration",
  "Vacation",
  "Beach",
  "Nature",
  "Food",
  "Coffee",
  "School",
  "College",
  "Work",
  "Fitness",
  "Gaming",
  "Music",
  "Reading",
  "Pets",
  "Home",
  "Shopping",
];

export function getMoodEmoji(mood?: string | null) {
  return MOOD_OPTIONS.find((option) => option.name === mood)?.emoji ?? "";
}

export function formatMoodLabel(mood?: string | null) {
  const moodName = mood?.trim();

  if (!moodName) {
    return "No mood";
  }

  const emoji = getMoodEmoji(moodName);
  return emoji ? `${emoji} ${moodName}` : moodName;
}

export function getMemoryTagNames(
  tags?: Array<ApiTag | string> | null,
): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seenTags = new Set<string>();

  return tags
    .map((tag) => (typeof tag === "string" ? tag : tag.name))
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag) {
        return false;
      }

      const key = tag.toLowerCase();

      if (seenTags.has(key)) {
        return false;
      }

      seenTags.add(key);
      return true;
    });
}
