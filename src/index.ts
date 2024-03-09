import express from 'express';
import { EpisodeFetcher } from './fetcher/EpisodeFetcher';
import DatabaseController from './db/DatabaseController';
import BotController from './telegram/BotController';
import { Content } from './telegram/Content';
import Log from './utils/Logger';
import { spotifyApi } from './handler/SpotifyHandler';
import { attachBlacklistListeners } from './telegram/Listeners';
import UserController from './db/controller/UserController';
import { User } from './db/entity/User';
import EpisodeController from './db/controller/EpisodeController';

const app = express();

// Spotify redirects to this route after authentication
app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code as string;
    const chatId = Number(req.query.state);

    if (error) {
        Log.error('Callback Error:', error);
        res.send(`The authentification with Spotify did not work: ${error}`);
        return;
    }

    spotifyApi.authorizationCodeGrant(code).then(data => {
        const user = User.from(chatId, data.body['refresh_token'], Date.now());
        (new UserController()).add(user);

        res.send('<h1>Congratulations the bot is now connected! As soon as a new episode is comming out you will receive a notification from the bot. You can close this tab.</h1>');
    }).catch(error => {
        Log.error('Error getting access tokens:', error);
        res.send(`Error getting access tokens: ${error}`);
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

        const controller = new EpisodeController();
        controller.startEpisodeFetching(fetchingDuration);
        controller.startEpisodeSending(sendingDuration);
    }).catch(e => {
        Log.error(e.message, e);
        process.exit(1);
    });
});
