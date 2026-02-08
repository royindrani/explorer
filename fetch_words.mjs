import fs from 'fs';
import https from 'https';

// Validation List: All Guessable Wordle Words (~12,900 words)
const validUrl = 'https://raw.githubusercontent.com/tabatkins/wordle-list/main/words';
const solutionUrl = 'https://raw.githubusercontent.com/alex1770/wordle/main/wordlist_hidden';
const commonUrl = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt';
// Profanity List: LDNOOBW English List
const profanityUrl = 'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en';

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
    const [validData, solutionData, commonData, profanityData] = await Promise.all([
      fetchUrl(validUrl),
      fetchUrl(solutionUrl),
      fetchUrl(commonUrl),
      fetchUrl(profanityUrl)
    ]);

    // Process Profanity List
    const profanity = new Set(
      profanityData.split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0)
    );

    // Process Wordle Guesses (~12.9k)
    const allGuesses = validData.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length === 5 && /^[a-z]+$/.test(w));

    // Process Wordle Solutions (~2.3k)
    const solutions = solutionData.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length === 5 && /^[a-z]+$/.test(w));

    // Process Google 10k Common Words
    const google10k = commonData.split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length === 5 && /^[a-z]+$/.test(w));

    // REFINED DICTIONARY STRATEGY:
    // 1. Start with the brute-force guess list (~12.9k).
    // 2. Filter: Only keep if word is EITHER:
    //    a) In the Google 10k list (identifies "common" words like TAXES).
    //    b) In the official Wordle Solutions list (ensures answers are playable).
    // 3. CRITICAL: Remove any words that are in the profanity list.
    const validWords = allGuesses.filter(w =>
      (google10k.includes(w) || solutions.includes(w)) && !profanity.has(w)
    ).sort();

    // Generation list: Common words that are also in our valid list.
    const commonWords = google10k.filter(w => validWords.includes(w)).sort();

    const content = `
export const VALID_WORDS = ${JSON.stringify(validWords, null, 2)};
export const COMMON_WORDS = ${JSON.stringify(commonWords, null, 2)};
`;

    fs.writeFileSync(outputPath, content);
    console.log(`Saved ${validWords.length} refined and sanitized valid words.`);
    console.log(`Saved ${commonWords.length} highly common start/end words.`);

    // Safety verification
    console.log(`Sanity Check - TAXES included? ${validWords.includes('taxes')}`);
    console.log(`Sanity Check - TUAN included? ${validWords.includes('tuan')}`);

  } catch (err) {
    console.error('Error:', err);
  }
};

run();
