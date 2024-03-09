import SpotifyWebApi from "spotify-web-api-node";
import Log from "../utils/Logger";

const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.DOMAIN_URL + '/callback',
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

function getSpotifyAuthUrl(userId: string) {
    return spotifyApi.createAuthorizeURL(["user-library-read"], userId, false);
}

async function setAccessToken(refreshToken: string) {
    spotifyApi.setRefreshToken(refreshToken);

    await spotifyApi.refreshAccessToken().then((data) => {
        Log.debug('The access token has been refreshed!');

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    }).catch((error) => {
        Log.error('Could not refresh access token', error);
    });
}

export { spotifyApi, getSpotifyAuthUrl, setAccessToken };