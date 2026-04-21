const SEARCH_RESULT_DURATION = 6000;

const getMessages = (word: string): Record<number, string[]> => ({
  1: [
    `Ready to learn ${word}?`,
    `A new discovery: ${word}!`,
    `Conquering ${word} today!`,
  ],
  2: [
    `Wait, didn't you look up ${word}?`,
    `${word} again?`,
    `Memorizing ${word}?`,
  ],
  3: [
    `HOW DO YOU NOT REMEMBER ${word}?!`,
    `You just saw ${word} a moment ago...`,
    `Are you even trying with ${word}?`,
  ],
  4: [
    "FORGETFULNESS OVER 9000!",
    `I'M LOSING MY PATIENCE WITH ${word}!`,
    `WRITE ${word} 100 TIMES NOW!`,
  ],
});

function getMessageIndex(word: string, level: number, poolLength: number) {
  if (poolLength <= 1) return 0;

  const seed = `${word}-${level}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }

  return Math.abs(hash) % poolLength;
}

export function getSearchToastLevel(searchCount: number) {
  if (searchCount === 1) return 1;
  if (searchCount <= 3) return 2;
  if (searchCount <= 6) return 3;
  return 4;
}

export function getSearchResultToast(word: string, searchCount: number) {
  const level = getSearchToastLevel(searchCount);
  const pool = getMessages(word)[level] || getMessages(word)[4];
  const index = getMessageIndex(word, level, pool.length);

  return {
    level,
    title: `Search Hit #${searchCount}`,
    description: pool[index],
    duration: SEARCH_RESULT_DURATION,
  };
}
