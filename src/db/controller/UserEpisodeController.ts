import { UserEpisode } from "../entity/UserEpisode";
import DatabaseController from "../DatabaseController";
import { MoreThan } from "typeorm";

class _UserEpisodeController {

    getDBTable() {
        return DatabaseController.getConnection().getRepository(UserEpisode);
    }

    async getUnsendUserEpisodes(timestamp: Date) {
        return await this.getDBTable().find({
            where: { added: MoreThan(timestamp.getTime()) }
        });
    }

    async exists(chatId: number, episodeId: string) {
        return (await this.getDBTable().findOneBy({ chatId, episodeId })) != null;
    }

    async add(chatId: number, podcastId: string, episodeId: string) {

        if (!await this.exists(chatId, episodeId)) {

            const userEpisode = new UserEpisode();

            userEpisode.chatId = chatId;
            userEpisode.added = Date.now();
            userEpisode.episodeId = episodeId;
            userEpisode.podcastId = podcastId;

            await this.getDBTable().save(userEpisode);
        }
    }
}

const UserEpisodeController = new _UserEpisodeController();

export default UserEpisodeController;