import BlacklistController from "../db/controller/BlackListController";
import { BlacklistedKeyword } from "../db/entity/BlacklistedKeyword";
import { getSpotifyAuthUrl } from "../handler/SpotifyHandler";
import BotController from "./BotController";
import { Content } from "./Content";

export function attachBlacklistListeners() {

    BotController.addListener("init", false, (chatId) => {
        return `For the bot to be able to notify you about new episodes you need to give it the permissions.
Click here: *${getSpotifyAuthUrl(chatId.toString())}*.`;
    });

    BotController.addListener("block", true, async (chatID, keywordString) => {
        const tags = await BlacklistController.addTag(chatID, keywordString);

        return `Successfully blocked the keyword *${tags}*.\r\n` +
            `You will not receive edisodes containing this keyword in the title anymore.`;
    });

    BotController.addListener("block", false, () => Content.block, { disablePreview: true });

    BotController.addListener("unblock", true, async (chatId, keywordNr) => {

        return BlacklistController.removeTag(chatId, keywordNr).then(keyword => {
            return `The keyword *${keyword}* was successfully unblocked.`;
        }).catch(error => {
            return error.message;
        });
    });

    BotController.addListener("unblock", false, () => Content.unblock, { disablePreview: true });

    BotController.addListener("blacklist", false, async (chatId) => {
        let keywords = getFormattedList(await BlacklistController.getBlockedTags(chatId));

        if (keywords.length === 0) {
            keywords = "No keywords are blocked.";
        }

        return `*Your blocked keywords:*\r\n\r\n${keywords}`;
    }, { disablePreview: true });
}

function getFormattedList(keywords: BlacklistedKeyword[]) {
    return keywords
        .map((keyword, index) => `*${index + 1}*: ${keyword.keyword}`)
        .join("\r\n");
}