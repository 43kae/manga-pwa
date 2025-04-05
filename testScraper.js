// testScraper.js

import { fetchAnimeFromPahe, fetchAnimeFromKissanime, fetchAllAnime } from './src/api/animeScraper.js';

const testAnimePahe = async () => {
    const data = await fetchAnimeFromPahe();
    console.log('AnimePahe data:', data);
};

const testKissAnime = async () => {
    const data = await fetchAnimeFromKissanime();
    console.log('KissAnime data:', data);
};

const testAllAnime = async () => {
    const data = await fetchAllAnime();
    console.log('Combined Anime data:', data);
};

// Choose which one to test
// testAnimePahe(); // Test only AnimePahe
testKissAnime(); // Test only KissAnime
// testAllAnime(); // Test all combined
