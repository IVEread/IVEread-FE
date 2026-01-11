export const peopleEmojiMap: Record<string, string> = {
  지민: '🧑‍🎓',
  서준: '👩‍💻',
  수아: '🧑‍🎨',
  민호: '👨‍🔬',
  민지: '👩‍💼',
  유진: '🌼',
  원영: '🎀',
  명성: '🧑‍🚀',
};

export const getPersonEmoji = (name: string, fallback?: string) => {
  const trimmed = name.trim();
  if (!trimmed) {
    return fallback ?? '😊';
  }
  if (trimmed === '나') {
    return fallback ?? '😊';
  }
  return peopleEmojiMap[trimmed] ?? trimmed.slice(0, 1);
};
