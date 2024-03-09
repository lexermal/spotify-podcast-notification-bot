import { URL } from "url";
import { ArticleFetcher } from "../../../fetcher/ArticleFetcher";
import SourceController from "../../../db/controller/SourceController";
import { Source } from "../../../db/entity/Podcast";
import BotController from "../../BotController";
import { Content } from "../../Content";

export function attachSourceListeners() {

    BotController.addListener("add", true, async (chatId, url) => {
        if (!isValidURL(url)) {
            return "The provided url is not valid.";
        }

        const source = SourceController.urlToSource(chatId, new URL(url));

        if (!await ArticleFetcher.isFetchable(SourceController.getFeedUrl(source))) {
            return `The url should be of type ${source.type} but the RSS feed was not fetchable.` +
                ` Are you sure you provided a url to a blog that uses the Medium.com CMS?`;
        }

        SourceController.addSource(chatId, source.type, source.urlPart);

        return `The ${source.type} *${source.urlPart}* ${Content.added}`;
    });

    BotController.addListener("add", false, () => Content.add, { disablePreview: true });

    BotController.addListener("remove", true, (chatId, removeSourceId) => {

        return SourceController.removeSource(chatId, removeSourceId).then(sourceName => {
            return `*${sourceName}* was successfully removed.`;
        }).catch(error => {
            return error.message;
        });
    });

    BotController.addListener("remove", false, async (chatId) => {
        const sourceList = await getSourceList(chatId);

        return `${Content.remove}\r\n\r\n\r\n${sourceList}`;
    }, { disablePreview: true });

    BotController.addListener("list", false, async (chatId) => {
        return getSourceList(chatId);
    }, { disablePreview: true });
}

async function getSourceList(chatId: number) {
    let sources = getFormattedList(await SourceController.getSources(chatId));

    if (sources.length === 0) {
        sources = "No sources are in your list.";
    }

    return `*Your medium sources:*\r\n${sources}`;
}

function getFormattedList(sources: Source[]) {
    return sources
        .map((source, index) => `*${index + 1}*: [${source.urlPart}](${SourceController.getUrlOfSource(source)})`)
        .join("\r\n");
}

function isValidURL(string: string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}