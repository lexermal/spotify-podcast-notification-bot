import { Episode } from "../entity/Episode";
import Log from "../../utils/Logger";
import EpisodeSender from "../../telegram/EpisodeSender";
import DatabaseController from "../DatabaseController";
import UserEpisodeController from "./UserEpisodeController";
import { EpisodeFetcher } from "../../fetcher/EpisodeFetcher";
import { User } from "../entity/User";

export default class EpisodeController {

    getDBTable() {
        return DatabaseController.getConnection().getRepository(Episode);
    }

    getEpisode(id: string): Promise<Episode | null> {
        return this.getDBTable().findOneBy({ id });
    }

    async exists(id: string) {
        return (await this.getDBTable().findOneBy({ id })) != null;
    }

    async addEpisode(chatId: number, episode: Episode) {

        if (!await this.exists(episode.id)) {

            await this.getDBTable().save(episode);
            Log.debug(`Added new episode ${episode.id} with the title '${episode.title}'.`);
        }

        UserEpisodeController.add(chatId, episode.showId, episode.id);
    }

    startEpisodeFetching(fetchingDuration: number) {
        DatabaseController.getConnection().getRepository(User).find().then(users => {
            users.forEach((user, i) => {
                setTimeout(() => {
                    this.fetchNewEpisodes(user, fetchingDuration);
                }, i * 2000);
            });
        });
    }

    async fetchNewEpisodes(user: User, fetchingDuration: number) {
        Log.info("Starting to fetch new episodes for " + user.chatId);
        const fetcher = await EpisodeFetcher.init(user.refreshToken, user.chatId);

        const podcastItems = await fetcher.getPodcasts();
        Log.debug(`Found ${podcastItems.length} podcasts for user ${user.chatId}.`);

        await Promise.all(podcastItems.map(async podcast => {
            const episodes = await fetcher.getLatestEpisodes(podcast);

            await Promise.all(episodes.map(episode => this.addEpisode(podcast.chatId, episode)));
        }));

        Log.debug(`Finished fetching new episodes. Waiting for ${fetchingDuration} minutes.`);

        setTimeout(() => this.fetchNewEpisodes(user, fetchingDuration), fetchingDuration * 60 * 1000);
    }

    async startEpisodeSending(sendingDuration: number) {
        this.sendNewEpisodes(sendingDuration);
    }


    async sendNewEpisodes(sendingDuration: number) {
        Log.info("Start sending new episodes.");

        await new EpisodeSender().sendArticles(sendingDuration);

        Log.debug(`Finished sending unseen episodes. Waiting ${sendingDuration} minutes.`);
        setTimeout(() => this.sendNewEpisodes(sendingDuration), sendingDuration * 60 * 1000);
    }
}
