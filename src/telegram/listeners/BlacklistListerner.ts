import BlacklistController from "../../db/controller/BlackListController";
import { BlacklistedTag } from "../../db/entity/BlacklistedTag";
import BotController from "../BotController";
import { Content } from "../Content";

export function attachBlacklistListeners() {

    BotController.addListener("block", true, async (chatID, tagString) => {
        const preparedTags = await BlacklistController.addTag(chatID, tagString);

        return `Successfully blocked the tag *${preparedTags}*.\r\n` +
            `You will not receive articles containing this tag anymore.`;
    });

    BotController.addListener("block", false, () => Content.block, { disablePreview: true });

    BotController.addListener("unblock", true, async (chatId, removeTagId) => {

        return BlacklistController.removeTag(chatId, removeTagId).then(tagName => {
            return `Blocked tag *${tagName}* was successfully removed.`;
        }).catch(error => {
            return error.message;
        });
    });

    BotController.addListener("unblock", false, () => Content.unblock, { disablePreview: true });

    BotController.addListener("blacklist", false, async (chatId) => {
        let tags = getFormattedList(await BlacklistController.getBlockedTags(chatId));

        if (tags.length === 0) {
            tags = "No tags are blocked.";
        }

        return `*Your blocked tags:*\r\n\r\n${tags}`;
    }, { disablePreview: true });
}

function getFormattedList(tags: BlacklistedTag[]) {
    return tags
        .map((tag, index) => `*${index + 1}*: ${tag.tag}`)
        .join("\r\n");
}