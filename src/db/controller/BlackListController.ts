import { BlacklistedKeyword } from "../entity/BlacklistedKeyword";
import DatabaseController from "../DatabaseController";
import Log from "../../utils/Logger";
import { convertTagToCheckableString as convertKeywordToCheckableString, convertToReadableTag as convertToReadableKeyword } from "../../utils/TagUtils";

class _BacklistController {

    getDBTable() {
        return DatabaseController.getConnection().getRepository(BlacklistedKeyword);
    }

    async exists(chatId: number, keyword: string) {
        return (await this.getDBTable().findOneBy({ keyword: keyword, chatId })) != null;
    }

    async getBlockedKeywords(chatId: number) {
        return await this.getDBTable().findBy({ chatId });
    }

    async addKeyword(chatId: number, rawKeywordString: string) {
        Log.debug(`User ${chatId} is trying to block the keyword(s) '${rawKeywordString}'.`);

        const keyword = convertKeywordToCheckableString(rawKeywordString);

        if (!await this.exists(chatId, keyword)) {
            const keywordToBeBlocked = new BlacklistedKeyword();

            keywordToBeBlocked.chatId = chatId;
            keywordToBeBlocked.keyword = keyword;


            await this.getDBTable().save(keywordToBeBlocked);
            Log.info(`Successfully added blocking of the keyword '${keyword}' for user ${chatId}.`);
        }

        return convertToReadableKeyword(keyword);
    }

    async removeKeyword(chatID: number, index: string): Promise<string> {

        if (!await this.isValidId(chatID, index)) {
            throw Error("The id is not valid.");
        }

        const item = (await this.getBlockedKeywords(chatID))[Number(index) - 1];

        this.getDBTable().remove(item);

        return convertToReadableKeyword(item.keyword); //=name of keyword
    }

    async isValidId(chatId: number, id: string) {
        const items = await this.getBlockedKeywords(chatId);

        if (isNaN(id as unknown as number)) {
            Log.debug(`The user ${chatId} tried to delete a blocked keyword with the invalid id '${id}'.`);
            return false;
        }

        if (Number(id) < 1 || Number(id) > items.length) {
            Log.debug(`The user ${chatId} tried to delete a blacked keyword with an id that is not in the allowed range: '${id}'.`);
            return false;
        }
        return true;
    }
}

const BlacklistController = new _BacklistController();

export default BlacklistController;