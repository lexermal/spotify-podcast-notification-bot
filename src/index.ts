import express from 'express';
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
const controller = new EpisodeController();

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

    spotifyApi.authorizationCodeGrant(code).then(async data => {
        const user = User.from(chatId, data.body['refresh_token'], Date.now());
        await (new UserController()).add(user);
        Log.info(`User ${chatId} successfully connected to Spotify.`);

        res.send(Content.connection_successful);
        controller.manualTrigger(chatId);
    }).catch(error => {
        Log.error('Error getting access tokens:', error);
        res.send(`The access token is not valid anymore. Click on the telegram bot link and try again.`);
    });
});

app.listen(3000, () => {
    DatabaseController.initDB().then(() => {
        attachBlacklistListeners();

        BotController.setWelcomeMessage(() => Content.start);
        BotController.setHelpMessage(() => Content.help);
        BotController.launch();

        Log.info("Successfully started the Spotify Podcast Notifier bot.");

        Log.info("Started fetching and sending new episodes.");

        const fetchingDuration = Number(process.env.FETCHING_DURATION || 5); //minutes
        const sendingDuration = Number(process.env.SENDING_DURATION || 6); //minutes

        controller.startEpisodeFetching(fetchingDuration);
        controller.startEpisodeSending(sendingDuration);

        Log.info('The bots callback endpoint is reachable over ' + process.env.DOMAIN_URL + "/callback");
    }).catch(e => {
        Log.error(e.message, e);
        process.exit(1);
    });
});
