import ArticleController from "../db/controller/ArticleController";
import BlacklistController from "../db/controller/BlackListController";
import SourceController from "../db/controller/SourceController";
import UserArticleController from "../db/controller/UserArticleController";
import { Episode } from "../db/entity/Episode";
import { Source } from "../db/entity/Podcast";
import { UserArticle } from "../db/entity/UserEpisode";
import Log from "../utils/Logger";
import BotController from "./BotController";

export default class ArticleSender {
    async sendArticles(sendingDuration: number) {
        //group userArticles by user
        const groupedUserArticles = this.groupUserArticles(await this.getUnseenUserArticles(sendingDuration));

        await Promise.all(groupedUserArticles.map(async ([chatId, userArticles]) => {
            // get unseed articles of an user
            const articles = await Promise.all(
                userArticles.map(ua => ArticleController.getArticle(ua.articleId))
            );

            const sendableArticles = await this.getNonBlockedArticles(chatId, articles.filter(a => a !== null) as Episode[]);

            await Promise.all(sendableArticles.map(async article => {
                //find the sourceId
                const sourceId = userArticles.find(ua => ua.articleId === article.articleId)!.sourceId;

                this.sendMessage(chatId, article, await SourceController.getSource(sourceId) as Source);
            }));

            Log.debug(`Sent ${sendableArticles.length} unread articles to ${chatId}.`);
        }));
    }

    getMessage(article: Episode, source: Source) {
        const hashtags = "#" + article.getTags().join(" #");
        const sourceUrl = SourceController.getUrlOfSource(source);

        return `<b><a href="${article.link}">${article.title}</a></b>\n` +
            article.previewText +
            `\n\nFrom: <a href="${sourceUrl}">${source.urlPart}</a>\n` +
            hashtags;
    }

    sendMessage(chatId: number, article: Episode, source: Source) {
        const message = this.getMessage(article, source!);

        if (!!article.imageURL) {
            BotController.sendPhoto(chatId, article.imageURL, message).catch(e => {
                Log.error(`Could not send article ${article.articleId} because ${e.message}. The message was: ${message}`);
            });
        } else {
            BotController.sendHtmlMessage(chatId, message).catch(e => {
                Log.error(`Could not send article ${article.articleId} because ${e.message}. The message was: ${message}`);
            });
        }
    }

    async getNonBlockedArticles(chatId: number, articles: Episode[]) {
        const blockedTags = (await BlacklistController.getBlockedTags(chatId)).map(tag => tag.tag);

        return articles.filter(article => {
            return !blockedTags.some(blockedTag => article.getTags().includes(blockedTag));
        });
    }

    async getUnseenUserArticles(sendingDuration: number) {
        const timestamp = new Date(Date.now() - sendingDuration * 60 * 1000); //now minus x minutes

        const userArticles = await UserArticleController.getUnsendUserArticles(timestamp);
        Log.debug(`Found ${userArticles.length} new unsent articles.`);

        return userArticles;
    }

    groupUserArticles(userArticles: UserArticle[]): [number, UserArticle[]][] {
        const articles = new Map<number, UserArticle[]>();

        // group userarticles by chatId
        userArticles.forEach(ua => {
            const oneUsersArticles = articles.get(ua.chatId) || [];

            oneUsersArticles.push(ua);

            articles.set(ua.chatId, oneUsersArticles);
        });

        return Array.from(articles.entries());
    }
}