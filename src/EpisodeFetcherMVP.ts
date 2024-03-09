import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { EpisodeFetcher } from './fetcher/EpisodeFetcher';
import DatabaseController from './db/DatabaseController';
import ArticleController from './db/controller/ArticleController';
import BotController from './telegram/BotController';
import { Content } from './telegram/Content';
import { attachBlacklistListeners } from './telegram/listeners/BlacklistListerner';
import { attachSourceListeners } from './telegram/listeners/SourceListener';
import Log from './utils/Logger';

const app = express();

const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.DOMAIN_URL + '/callback',
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Redirect users to this route to start the authentication process
app.get('/login', (_, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(["user-library-read"], "userABC", false));
});

// endpoint to get the user's subscribed podcasts and their episodes
app.get('/me', async (req, res) => {
    const refreshToken = req.query.refresh_token as string;

    try {
        const fetcher = await EpisodeFetcher.init(refreshToken, 0)
        const podcasts = await fetcher.getPodcasts();

        const podcastsAndEpisodes = await Promise.all(podcasts.map(async podcast => {
            const episodes = await fetcher.getLatestEpisodes(podcast);
            return { podcast, episodes };
        }));
        res.json(podcastsAndEpisodes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching subscribed podcasts and their episodes' });
    }
});

// Spotify redirects to this route after authentication
app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code as string;
    const telegramUserId = req.query.state;
    console.log('telegramUserId:', telegramUserId);

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi.authorizationCodeGrant(code).then(data => {
        res.redirect(process.env.DOMAIN_URL + `/me?refresh_token=${data.body['refresh_token']}`);
    }).catch(error => {
        console.error('Error getting Tokens:', error);
        res.send(`Error getting Tokens: ${error}`);
    });
});

app.listen(3000, () => {
    console.log('Server running at ' + process.env.DOMAIN_URL);
    initBot();
});

function initBot() {
    DatabaseController.initDB().then(() => {
        // attachSourceListeners();
        // attachBlacklistListeners();

        BotController.setWelcomeMessage(() => Content.start);

        BotController.setHelpMessage(() => Content.help);

        BotController.launch();

        Log.info("Successfully started Medium News bot!");


        Log.info("Starting to fetch new articles and send out unread ones.");

        const fetchingDuration = Number(process.env.FETCHING_DURATION || 5); //minutes
        const sendingDuration = Number(process.env.SENDING_DURATION || 6); //minutes

        // ArticleController.startArticleFetching(fetchingDuration);

        // ArticleController.startArticleSending(sendingDuration);
    }).catch(e => {
        Log.error(e.message, e);
        process.exit(1);
    });
}