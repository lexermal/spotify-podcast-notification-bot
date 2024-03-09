import EpisodeController from "../db/controller/EpisodeController";
import BlacklistController from "../db/controller/BlackListController";
import UserEpisodeController from "../db/controller/UserEpisodeController";
import { Episode } from "../db/entity/Episode";
import { UserEpisode } from "../db/entity/UserEpisode";
import Log from "../utils/Logger";
import BotController from "./BotController";

export default class EpisodeSender {
    async sendArticles(sendingDuration: number) {
        //group userEpisodes by user
        const groupedUserEpisodes = this.groupUserEpisodes(await this.getUnseenUserEpisodes(sendingDuration));
        const episodeController = new EpisodeController();

        await Promise.all(groupedUserEpisodes.map(async ([chatId, userEpisodes]) => {
            // get unseed episodes of an user
            const episodes = await Promise.all(
                userEpisodes.map(ua => episodeController.getEpisode(ua.episodeId))
            );

            const sendableEpisodes = await this.getNonBlockedEpisodes(chatId, episodes.filter(a => a !== null) as Episode[]);

            await Promise.all(sendableEpisodes.map(async episode => {
                //find the podcastId
                const podcastId = userEpisodes.find(ua => ua.episodeId === episode.id)!.podcastId;

                this.sendMessage(chatId, episode);
            }));

            Log.debug(`Sent ${sendableEpisodes.length} unseen episodes to ${chatId}.`);
        }));
    }

    getMessage(episode: Episode) {
        return `<b><a href="${episode.link}">${episode.title}</a></b>\n` +
            episode.description +
            `\n\nFrom: ${episode.showName}\n`;
    }

    sendMessage(chatId: number, episode: Episode) {
        const message = this.getMessage(episode);

        if (!!episode.imageURL) {
            BotController.sendPhoto(chatId, episode.imageURL, message).catch(e => {
                Log.error(`Could not send episode ${episode.id} because ${e.message}. The message was: ${message}`);
            });
        } else {
            BotController.sendHtmlMessage(chatId, message).catch(e => {
                Log.error(`Could not send episode ${episode.id} because ${e.message}. The message was: ${message}`);
            });
        }
    }

    async getNonBlockedEpisodes(chatId: number, episodes: Episode[]) {
        const blockedKeywords = (await BlacklistController.getBlockedKeywords(chatId)).map(keyword => keyword.keyword);

        return episodes.filter(episode => {
            return !blockedKeywords.some(blockedTag => episode.title.includes(blockedTag));
        });
    }

    async getUnseenUserEpisodes(sendingDuration: number) {
        const timestamp = new Date(Date.now() - sendingDuration * 60 * 1000); //now minus x minutes

        const userEpisodes = await UserEpisodeController.getUnsendUserEpisodes(timestamp);
        Log.debug(`Found ${userEpisodes.length} new unsent episodes.`);

        return userEpisodes;
    }

    groupUserEpisodes(userEpisodes: UserEpisode[]): [number, UserEpisode[]][] {
        const episodes = new Map<number, UserEpisode[]>();

        // group userepisodes by chatId
        userEpisodes.forEach(ua => {
            const oneUsersEpisodes = episodes.get(ua.chatId) || [];

            oneUsersEpisodes.push(ua);

            episodes.set(ua.chatId, oneUsersEpisodes);
        });

        return Array.from(episodes.entries());
    }
}