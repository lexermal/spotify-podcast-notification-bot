# Spotify Podcast Notifier Bot

Never miss episodes of your favorite podcasters!

Try it out: [Spotify Podcast Notifier](https://t.me/spotify_podcast_notifier_bot)

## List of available commands

- ***/block*** `<keyword or keyword combinations>` - Blocks episodes that contain a curtain keyword or combination of keywords.

- ***/unblock*** `<nr>` - Removes the keyword from the blacklist.

- ***/blacklist*** - Get the list of blocked keywords.

- ***/help*** - Show all available commands.

## Build the image and run the container

1. ```docker build . -t lexermal/spotify-podcast-notifier-bot:latest```
2. ```docker compose up -d```

## Environment variables

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
DOMAIN_URL=http://localhost:3000
TELEGRAF_TOKEN=your_telegram_token
FETCHING_DURATION=30 # in minutes
SENDING_DURATION=30 # in minutes
```