import fs from 'fs';
import https from 'https';

// Validation List: All Guessable Wordle Words (~12,900 words)
const validUrl = 'https://raw.githubusercontent.com/tabatkins/wordle-list/main/words';

// Generation List: Google 10k Most Common English Words
// We will filter this to getting the top ~1000 5-letter words.
const commonUrl = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt';

const outputPath = './src/utils/wordList.ts';

const fetchUrl = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve(data));
    res.on('error', reject);
  });
});

const run = async () => {
  console.log('Fetching lists...');
  try {
    const [validData, commonData] = await Promise.all([
      fetchUrl(validUrl),
      fetchUrl(commonUrl)
    ]);

    // Process Valid Words (Wordle List - ~2300)
    const validWords = validData.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length === 5 && /^[a-z]+$/.test(w))
      .sort();

    // Process Common Words (Google 10k -> Filter 5-letter -> Top 2000)
    const commonRaw = commonData.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length === 5 && /^[a-z]+$/.test(w));

    // Take top 2000 common words to ensure variety
    const topCommon = commonRaw.slice(0, 2000);

    // CRITICAL: Intersection Strategy.
    // Only keep common words that are ALSO in the official Wordle list.
    // This strips out proper nouns like "Clark", "Texas", etc. which are common but not valid game words.
    const commonWords = topCommon.filter(w => validWords.includes(w)).sort();

    // The Valid list determines what is "accepted" as input.
    // The Common list determines what is chosen for Start/End words.

    const content = `
export const VALID_WORDS = ${JSON.stringify(validWords, null, 2)};
export const COMMON_WORDS = ${JSON.stringify(commonWords, null, 2)};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`Saved ${validWords.length} valid words and ${commonWords.length} highly common start/end words.`);

  } catch (err) {
    console.error('Error:', err);
  }
};

run();
