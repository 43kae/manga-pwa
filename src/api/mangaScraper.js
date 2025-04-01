const axios = require('axios');
const cheerio = require('cheerio');

// Scrape popular manga data from MangaDex
const fetchMangaFromMangaDex = async () => {
    try {
        //URL for the popular manga page on MangaDex
        const url = 'https://mangadex.org/';
        const { data } = await axios.get(url); //Fetch HTML content

        const $ = cheerio.load(data); //Load HTML into Cheerio

        const mangaList = [];
        $('.card').each((index, element) => {
            const title = $(element).find('.card-title').text().trim();
            const image = $(element).find('img').attr('src');
            const link = 'https://mangadex.org' + $(element).find('a').attr('href');

            mangaList.push({
                title,
                image,
                link
            });
        });

        return mangaList; //Return an array of manga data
    } catch (error) {
        console.error('Error fetching manga from MangaDex:', error);
        return [];
    }
};

//Scrape manga from MangaPark
const fetchMangaFromMangaPark = async () => {
    try {
        const url = 'https://mangapark.net/';
        const { data } = await axios.get(url); //Fetch HTML content

        const $ = cheerio.load(data); //Load HTML into Cheerio

        const mangaList = [];
        $('.manga_item').each((index, element) => {
            const title = $(element).find('.manga-title').text().trim();
            const image = $(element).find('img').attr('src');
            const link = 'https://mangapark.net' + $(element).find('a').attr('href');

            mangaList.push({
                title,
                image,
                link
            });
        });

        return mangaList; //Return an array of manga data
    } catch (error) {
        console.error('Error fetching manga from MangaPark:', error);
        return [];
    }
};

// Combine results from all sources
const fetchAllManga = async () => {
    const mangaDexData = await fetchMangaFromMangaDex();
    const mangaParkData = await fetchMangaFromMangaPark();

    // Combine all the lists into one, and avoid duplicates
    const combinedManga = [
        ...mangaDexData,
        ...mangaParkData
    ];

    return combinedManga;
};

module.exports = { fetchAllManga };