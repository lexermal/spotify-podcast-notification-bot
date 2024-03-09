import express from 'express';
import { EpisodeFetcher } from './fetcher/EpisodeFetcher';
import DatabaseController from './db/DatabaseController';
import BotController from './telegram/BotController';
import { Content } from './telegram/Content';
import Log from './utils/Logger';
import { getSpotifyAuthUrl, spotifyApi } from './handler/SpotifyHandler';
import { attachBlacklistListeners } from './telegram/Listeners';

const app = express();

// Redirect users to this route to start the authentication process
app.get('/login', (_, res) => {
    res.redirect(getSpotifyAuthUrl('userABC'));
});

// endpoint to get the user's subscribed podcasts and their episodes
app.get('/me', async (req, res) => {
    const refreshToken = req.query.refresh_token as string;
    const telegramUserId = req.query.telegramUserId as unknown as number;

    try {
        const fetcher = await EpisodeFetcher.init(refreshToken, telegramUserId)
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

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi.authorizationCodeGrant(code).then(data => {
        res.redirect(process.env.DOMAIN_URL + `/me?refresh_token=${data.body['refresh_token']}&telegramUserId=${telegramUserId}`);
    }).catch(error => {
        console.error('Error getting Tokens:', error);
        res.send(`Error getting Tokens: ${error}`);
    });
});

app.listen(3000, () => {
    Log.info('The application is running at ' + process.env.DOMAIN_URL);

    DatabaseController.initDB().then(() => {
        attachBlacklistListeners();

        BotController.setWelcomeMessage(() => Content.start);
        BotController.setHelpMessage(() => Content.help);
        BotController.launch();

        Log.info("Successfully started Spotify Podcast Episode Notification bot!");

        Log.info("Starting to fetch new episodes and send out new ones.");

        const fetchingDuration = Number(process.env.FETCHING_DURATION || 5); //minutes
        const sendingDuration = Number(process.env.SENDING_DURATION || 6); //minutes

        // ArticleController.startArticleFetching(fetchingDuration);

        // ArticleController.startArticleSending(sendingDuration);
    }).catch(e => {
        Log.error(e.message, e);
        process.exit(1);
    });
});
