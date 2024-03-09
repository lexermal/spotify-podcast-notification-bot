import Log from "../utils/Logger";
import { Episode } from "../db/entity/Episode";
import { setAccessToken, spotifyApi } from "../handler/SpotifyHandler";

interface Podcast {
    id: string;
    name: string;
    chatId: number;
}

export class EpisodeFetcher {
    private static instance: EpisodeFetcher;
    private chatID: number;

    private constructor() { }

    public static async init(refreshToken: string, chatId: number) {
        await setAccessToken(refreshToken);

        EpisodeFetcher.instance = new EpisodeFetcher();
        EpisodeFetcher.instance.chatID = chatId;
        return EpisodeFetcher.instance;
    }

    public async getPodcasts(offset = 0): Promise<Podcast[]> {
        const savedShowsResponse = await spotifyApi.getMySavedShows({ limit: 50, offset }).catch(error => {
            Log.error('Error at fetching the podcastss:', error);
            return { body: { items: [], total: 0 } };
        });
        const responseBody = savedShowsResponse.body;

        //filter out the podcasts that are not from the last 48h
        const shows = responseBody.items
        .filter(show => new Date(show.added_at).getTime() > Date.now() - 48 * 60 * 60 * 1000)
        .map(show => {
            return { id: show.show.id, name: show.show.name, chatId: this.chatID};
        });

        Log.debug(`Fetched ${shows.length} of ${responseBody.total} podcasts (${offset / 50 + 1}. bulk) for user ${this.chatID}.`);
        if (responseBody.total > offset + 50) {
            shows.concat(await this.getPodcasts(offset + 50));
        }
        return shows;
    }

    public async getLatestEpisodes(podcast: Podcast): Promise<Episode[]> {
        const showId = podcast.id;
        const episodesResponse = await spotifyApi.getShowEpisodes(showId).catch(error => {
            Log.error(`Error at fetching the latest episode for show ${showId}:`, error);
            return { body: { items: [] } };
        });

        return episodesResponse.body.items.map(e => this.toEpisode(podcast, e));
    };

    private toEpisode(show: Podcast, item: SpotifyApi.EpisodeObjectSimplified) {
        const episode = new Episode();
        episode.id = item.id;
        episode.title = item.name;
        episode.link = item.external_urls.spotify;
        episode.pubDate = item.release_date;
        episode.duration = Math.floor(item.duration_ms / 1000);
        episode.description = this.prepareDescription(item.description);
        episode.showName = show.name;
        episode.imageURL = item.images[0].url;
        episode.showId = show.id;

        return episode;
    }

    private prepareDescription(text: string) {
        if (text.length < 150) {
            return text;
        }

        const shortenedString = text.substring(0, 150);
        const lastSpace = shortenedString.lastIndexOf(" ");

        return shortenedString.substring(0, lastSpace) + "...";
    }
}