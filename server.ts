import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || "ZVQpZIZeFkvNaxSKslHgiAEhhwpvwSfXKLJQiXGA";
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyBEYhVFn2QDsumv32BjOBVg89OpUYRzWTk";

  async function searchYouTube(query: string, type: 'video' | 'playlist' = 'video') {
    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: type,
          key: YOUTUBE_API_KEY,
          maxResults: 1
        }
      });
      return response.data.items[0];
    } catch (error) {
      console.error("YouTube API Error:", error);
      return null;
    }
  }

  // API routes
  app.get("/api/random-release", async (req, res) => {
    try {
      const { genre, style, year, country, type = 'release' } = req.query;
      
      console.log(`Searching with: genre=${genre}, style=${style}, year=${year}, country=${country}`);

      // Step 1: Get total count for the search query
      const searchParams = new URLSearchParams({
        token: DISCOGS_TOKEN,
        type: type as string,
        format: 'album',
        per_page: '1',
      });

      if (genre) searchParams.append('genre', genre as string);
      if (style) searchParams.append('style', style as string);
      if (country) searchParams.append('country', country as string);
      
      // Handle decade selection
      if (year) {
        if (year.toString().length === 3) {
          const randomYear = Math.floor(Math.random() * 10) + parseInt(year.toString() + "0");
          searchParams.append('year', randomYear.toString());
        } else {
          searchParams.append('year', year as string);
        }
      }

      const searchUrl = `https://api.discogs.com/database/search?${searchParams.toString()}`;
      const initialResponse = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'DiscogsRandomizer/1.0' }
      });

      const totalItems = initialResponse.data.pagination.items;
      if (totalItems === 0) {
        return res.status(404).json({ error: "No releases found with these filters." });
      }

      const maxItems = Math.min(totalItems, 10000);
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        const randomPage = Math.floor(Math.random() * maxItems) + 1;
        
        const randomResponse = await axios.get(`${searchUrl}&page=${randomPage}`, {
          headers: { 'User-Agent': 'DiscogsRandomizer/1.0' }
        });

        const release = randomResponse.data.results[0];
        if (release && release.id) {
          const detailsResponse = await axios.get(`https://api.discogs.com/releases/${release.id}?token=${DISCOGS_TOKEN}`, {
            headers: { 'User-Agent': 'DiscogsRandomizer/1.0' }
          });
          
          const fullRelease = detailsResponse.data;
          
          // Try to find a YouTube playlist first
          const artist = fullRelease.artists?.[0]?.name || "";
          const title = fullRelease.title || "";
          const query = `${artist} - ${title}`;
          
          let youtubeData = null;

          // 1. Search for a playlist
          const playlist = await searchYouTube(query, 'playlist');
          if (playlist) {
            youtubeData = { type: 'playlist', id: playlist.id.playlistId };
          } else {
            // 2. If no playlist, check Discogs videos
            if (fullRelease.videos && fullRelease.videos.length > 0) {
               // Extract IDs from Discogs videos
               const videoIds = fullRelease.videos.map((v: any) => {
                 // Handle standard watch URLs and short URLs
                 const match = v.uri.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|\?|$)/);
                 return match ? match[1] : null;
               }).filter(Boolean);
               
               if (videoIds.length > 0) {
                 youtubeData = { type: 'videos', ids: videoIds };
               }
            }
            
            // 3. If still no videos, search for the first track or album video
            if (!youtubeData) {
               const video = await searchYouTube(query, 'video');
               if (video) {
                 youtubeData = { type: 'videos', ids: [video.id.videoId] };
               }
            }
          }

          if (youtubeData) {
            console.log(`Found release with YouTube content after ${attempts} attempts: ${fullRelease.title}`);
            return res.json({ ...fullRelease, youtube: youtubeData });
          }
        }
      }

      res.status(404).json({ error: "Could not find a release with YouTube links after several attempts. Try different filters." });
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("Discogs API Error:", errorData || error.message);
      if (errorData?.message === "You are making requests too quickly.") {
        return res.status(429).json({ error: "Discogs rate limit exceeded. Please wait a moment." });
      }
      res.status(500).json({ error: errorData?.message || "Failed to fetch from Discogs." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
