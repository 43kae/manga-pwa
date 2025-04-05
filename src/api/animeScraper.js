import axios from 'axios';
import * as cheerio from 'cheerio';

// Scrape anime from animepahe.ru
const fetchAnimeFromPahe = async () => {
    try {
        const url = 'https://animepahe.ru';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const animeList = [];

        $('div.latest-release').each((_, el) => {
            const title = $(el).find('img').attr('alt');
            const image = $(el).find('img').attr('src');
            const link = $(el).find('a').attr('href');

            if (title && image && link) {
                animeList.push({
                    title,
                    image,
                    link: `https://animepahe.ru${link}`,
                });
            }
        });

        return animeList;
    } catch (error) {
        console.error('Error fetching anime from Animepahe:', error.message);
        return []; //returns an empty array if there's an error
    }
};

// Scrape anime from KissAnime.ba
const fetchAnimeFromKissanime = async () => {
    try {
        const url = 'https://kissanime.ba';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const animeList = [];
        $('.listupd.normal').each((_, el) => {
            const title = $(el).find('.name a').text().trim();
            const link = $(el).find('.name a').attr('href');
            const image = $(el).find('img').attr('src');

            if (title && link && image) {
                animeList.push({
                    title,
                    link: `https://kissanime.ba${link}`,
                    image
                });
            }
        });

        return animeList;
    } catch (error) {
        console.error('Error fetching anime from KissAnime:', error.message);
        return []; //returns an empty array if there's an error
    }
};

// // Combine results from all sources
// const fetchAllAnime = async () => {
//     const paheData = await fetchAnimeFromPahe();
//     const kissAnimeData = await fetchAnimeFromKissanime();

//     // Combine all the lists, avoiding duplicates
//     const combinedAnime = [
//         ...paheData,
//         ...kissAnimeData
//     ];

//     return combinedAnime;
// };

// export { fetchAllAnime };

// Utility function to remove duplicates based on the title
const removeDuplicates = (animeList) => {
    const seen = new Set();
    return animeList.filter(anime => {
        const duplicate = seen.has(anime.title);
        seen.add(anime.title);
        return !duplicate;
    });
};

// Update fetchAllAnime to remove duplicates
// const fetchAllAnime = async () => {
//     const paheData = await fetchAnimeFromPahe();
//     const kissAnimeData = await fetchAnimeFromKissanime();

//     // Combine all the lists and remove duplicates
//     const combinedAnime = removeDuplicates([
//         ...paheData,
//         ...kissAnimeData
//     ]);

//     return combinedAnime;
// };

const fetchAllAnime = async () => {
    try {
        const [paheData, kissAnimeData] = await Promise.all([
            fetchAnimeFromPahe(),
            fetchAnimeFromKissanime()
        ]);

        return removeDuplicates([...paheData, ...kissAnimeData]);
    } catch (error) {
        console.error('Error fetching combined anime:', error);
        return [];
    }
};

// Add error handling middleware
const handleScrapingError = (error, source) => {
    console.error(`Error fetching from ${source}:`, error);
    // You could add logging service integration here
    return [];
};

// Add retry mechanism
const fetchWithRetry = async (url, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await axios.get(url);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

// Add rate limiting
const rateLimit = (func, limit) => {
    const queue = [];
    let ongoing = 0;

    return async function (...args) {
        while (ongoing >= limit) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        ongoing++;
        try {
            return await func.apply(this, args);
        } finally {
            ongoing--;
        }
    };
};

// Rate limit the fetch functions
const rateLimitedFetchAnimeFromPahe = rateLimit(fetchAnimeFromPahe, 5);

const rateLimitedFetchAnimeFromKissanime = rateLimit(fetchAnimeFromKissanime, 5);

const rateLimitedFetchAllAnime = rateLimit(fetchAllAnime, 5);

// Export the functions
export { fetchAnimeFromPahe, fetchAnimeFromKissanime };
export { rateLimitedFetchAnimeFromPahe, rateLimitedFetchAnimeFromKissanime, rateLimitedFetchAllAnime };

// Export the utility functions
export { removeDuplicates, handleScrapingError, fetchWithRetry, rateLimit };

// Export the main function  
export { fetchAllAnime };