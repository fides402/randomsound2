import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import axios from "axios";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || "ZVQpZIZeFkvNaxSKslHgiAEhhwpvwSfXKLJQiXGA";

  try {
    const { genre, style, year, country, type = 'release' } = event.queryStringParameters || {};
    
    console.log(`Searching with: genre=${genre}, style=${style}, year=${year}, country=${country}`);

    // Step 1: Get total count for the search query
    const searchParams = new URLSearchParams({
      token: DISCOGS_TOKEN,
      type: type as string,
      format: 'album',
      per_page: '1',
    });

    if (genre) searchParams.append('genre', genre);
    if (style) searchParams.append('style', style);
    if (country) searchParams.append('country', country);
    
    // Handle decade selection
    if (year) {
      if (year.toString().length === 3) {
        // If it's a decade (e.g., "198"), add a random digit (0-9)
        const randomYear = Math.floor(Math.random() * 10) + parseInt(year.toString() + "0");
        searchParams.append('year', randomYear.toString());
      } else {
        searchParams.append('year', year);
      }
    }

    const searchUrl = `https://api.discogs.com/database/search?${searchParams.toString()}`;
    
    // Initial request to get pagination data
    const initialResponse = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'DiscogsRandomizer/1.0' }
    });

    const totalItems = initialResponse.data.pagination.items;
    if (totalItems === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No releases found with these filters." }),
      };
    }

    // Discogs API limits access to the first 10,000 items
    const maxItems = Math.min(totalItems, 10000);
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      const randomPage = Math.floor(Math.random() * maxItems) + 1;
      
      try {
        const randomResponse = await axios.get(`${searchUrl}&page=${randomPage}`, {
          headers: { 'User-Agent': 'DiscogsRandomizer/1.0' }
        });

        const release = randomResponse.data.results?.[0];
        if (release && release.id) {
          // Fetch full details to check for videos
          const detailsResponse = await axios.get(`https://api.discogs.com/releases/${release.id}?token=${DISCOGS_TOKEN}`, {
            headers: { 'User-Agent': 'DiscogsRandomizer/1.0' }
          });
          
          const fullRelease = detailsResponse.data;
          if (fullRelease.videos && fullRelease.videos.length > 0) {
            console.log(`Found release with videos after ${attempts} attempts: ${fullRelease.title}`);
            return {
              statusCode: 200,
              body: JSON.stringify(fullRelease),
            };
          }
        }
      } catch (innerError) {
        console.warn(`Attempt ${attempts} failed`, innerError);
        // Continue to next attempt
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Could not find a release with YouTube links after several attempts. Try different filters." }),
    };

  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("Discogs API Error:", errorData || error.message);
    
    if (errorData?.message === "You are making requests too quickly.") {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "Discogs rate limit exceeded. Please wait a moment." }),
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorData?.message || "Failed to fetch from Discogs." }),
    };
  }
};

export { handler };
