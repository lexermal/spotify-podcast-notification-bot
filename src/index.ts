import "reflect-metadata";
import { attachBlacklistListeners } from "./telegram/listeners/BlacklistListerner";
import { attachSourceListeners } from "./telegram/listeners/SourceListener";
import { Content } from "./telegram/Content";
import Log from "./utils/Logger";
import ArticleController from "./db/controller/ArticleController";
import DatabaseController from "./db/DatabaseController";
import BotController from "./telegram/BotController";


Log.info("Starting Medium News bot.");

DatabaseController.initDB().then(() => {
    attachSourceListeners();
    attachBlacklistListeners();

    BotController.setWelcomeMessage(() => Content.start);

    BotController.setHelpMessage(() => Content.help);

    BotController.launch();

    Log.info("Successfully started Medium News bot!");


    Log.info("Starting to fetch new articles and send out unread ones.");

    const fetchingDuration = Number(process.env.FETCHING_DURATION || 5); //minutes
    const sendingDuration = Number(process.env.SENDING_DURATION || 6); //minutes

    ArticleController.startArticleFetching(fetchingDuration);

    ArticleController.startArticleSending(sendingDuration);
}).catch(e => {
    Log.error(e.message, e);
    process.exit(1);
});