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
        // console.log(episode)
        // console.log((await this.getDBTable().findOneBy({ id:episode.id })) )

        if (!(await this.exists(episode.id))) {

            await this.getDBTable().save(episode);
            Log.debug(`Added new episode ${episode.id} with the title '${episode.title}'.`);
        }

        await UserEpisodeController.add(chatId, episode.showId, episode.id);
    }

    startEpisodeFetching(fetchingDuration: number) {
        DatabaseController.getConnection().getRepository(User).find().then(users => {
            Log.info(`Triggering fetching of new episodes. Next fetch is in ${fetchingDuration} minutes.`);

            users.forEach((user, i) => {
                setTimeout(() => this.fetchNewEpisodes(user), i * 3000);
            });
            setTimeout(() => this.startEpisodeFetching(fetchingDuration), fetchingDuration * 60 * 1000);
        });
    }

    async fetchNewEpisodes(user: User) {
        Log.info(`Starting to fetch new episodes for user ${user.chatId}.`);
        const fetcher = await EpisodeFetcher.init(user.refreshToken, user.chatId);

        const podcastItems = await fetcher.getPodcasts();
        Log.debug(`Found ${podcastItems.length} podcasts for user ${user.chatId}.`);

        await Promise.all(podcastItems.map(async podcast => {
            const episodes = await fetcher.getLatestEpisodes(podcast);

            await Promise.all(episodes.map(episode => this.addEpisode(podcast.chatId, episode)));
        }));
    }

    async startEpisodeSending(sendingDuration: number) {
        this.sendNewEpisodes(sendingDuration);
        setTimeout(() => this.startEpisodeSending(sendingDuration), sendingDuration * 60 * 1000);
    }

    async sendNewEpisodes(sendingDuration: number) {
        Log.info(`Triggering sending of new episodes. Next send is in ${sendingDuration} minutes.`);

        await new EpisodeSender().sendArticles(sendingDuration);

        Log.debug(`Finished sending unseen episodes.`);
    }

    async manualTrigger(chatId: number) {
        Log.info(`Manually triggering fetching of new episodes for user ${chatId}.`);

        const user = await DatabaseController.getConnection().getRepository(User).findOneBy({ chatId });
        await this.fetchNewEpisodes(user!);
        await this.sendNewEpisodes(2);
    }
}
