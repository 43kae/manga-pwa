const axios = require('axios');
const cheerio = require('cheerio');

// Scrape anime from animepahe.ru
const fetchAnimeFromPahe = async () => {
    try {
        const url = 'https://animepahe.ru';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const animeList = [];
        $('.last_episodes li').each((index, element) => {
            const title = $(element).find('.name').text().trim();
            const image = $(element).find('img').attr('src');
            const link = 'https://animepahe.ru' + $(element).find('a').attr('href');

            animeList.push({
                title,
                image,
                link
            });
        });

        return animeList;
    } catch (error) {
        console.error('Error fetchin anime from Animepahe:', error);
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
        $('.anime_item').each((index, element) => {
            const title = $(element).find('.name').text().trim();
            const image = $(element).find('img').attr('src');
            const link = 'https://kissanime.ba' + $(element).find('a').attr('href');

            animeList.push({
                title,
                image,
                link
            });
        });

        return animeList;
    } catch (error) {
        console.error('Error fetchin anime from KissAnime:', error);
        return []; //returns an empty array if there's an error
    }
};

// Combine results from all sources
const fetchAllAnime = async () => {
    const paheData = await fetchAnimeFromPahe();
    const kissAnimeData = await fetchAnimeFromKissanime();

    // Combine all the lists, avoiding duplicates
    const combinedAnime = [
        ...paheData,
        ...kissAnimeData
    ];

    return combinedAnime;
};

module.exports = { fetchAllAnime };