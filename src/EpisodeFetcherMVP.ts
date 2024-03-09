require('dotenv').config();
import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';

const app = express();

const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.CALLBACK_URL,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Redirect users to this route to start the authentication process
app.get('/login', (req, res) => {
    const scopes = ["user-library-read"];
    res.redirect(spotifyApi.createAuthorizeURL(scopes, "", true));
});

// /me endpoint to get the user's subscribed podcasts and their episodes
app.get('/me', async (req, res) => {
    const refreshToken = req.query.refresh_token as string;
    await setAccessToken(refreshToken);

    try {
        const podcastsAndEpisodes = await fetchSubscribedPodcastsAndEpisodes();
        res.json(podcastsAndEpisodes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching subscribed podcasts and their episodes' });
    }
});

// Spotify redirects to this route after authentication
app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code as string;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi.authorizationCodeGrant(code).then(async data => {
        console.log('body:', data.body);
        const refreshToken = data.body['refresh_token'];

        await setAccessToken(refreshToken);


        res.redirect(`http://localhost:3000/me?refresh_token=${refreshToken}`);
    }).catch(error => {
        console.error('Error getting Tokens:', error);
        res.send(`Error getting Tokens: ${error}`);
    });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});


// Function to fetch subscribed podcasts and their episodes
async function fetchSubscribedPodcastsAndEpisodes() {
    try {
        // First, get the user's saved shows (podcasts)
        const savedShowsResponse = await spotifyApi.getMySavedShows({ limit: 50 });
        const savedShows = savedShowsResponse.body.items;

        // Loop through the saved shows to fetch episodes for each show
        const podcastsAndEpisodes = await Promise.all(savedShows.map(async (showItem) => {
            const showId = showItem.show.id;
            const episodesResponse = await spotifyApi.getShowEpisodes(showId);
            const episodes = episodesResponse.body.items;
            return {
                show: showItem.show.name,
                episodes: episodes.map(episode => ({
                    id: episode.id,
                    title: episode.name,
                    release_date: episode.release_date,
                    duration_seconds: episode.duration_ms / 1000,
                    description: episode.description,
                    access_url: episode.external_urls.spotify,
                    image: episode.images[0].url
                }))
            };
        }));
        console.log('Subscribed podcasts and their episodes:', JSON.stringify(podcastsAndEpisodes, null, 2));

        return podcastsAndEpisodes;
    } catch (error) {
        console.error('Error fetching subscribed podcasts and their episodes:', error);
        throw error; // Rethrow the error for further handling if necessary
    }
}

async function setAccessToken(refreshToken: string) {
    spotifyApi.setRefreshToken(refreshToken);
    await spotifyApi.refreshAccessToken().then((data) => {
        console.log('The access token has been refreshed!');

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    }).catch((error) => {
        console.error('Could not refresh access token', error);
    });
}