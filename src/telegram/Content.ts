export class Content {
    public static help = `
The following commands are available:

/init - Subscribes the bot to your Spotify podcasts.

/list - Get a list of all subscribed sources.

/block ***<keyword or keyword combinations>*** - Blocks episodes containing a curtain keyword or combination of keywords.

/unblock ***<nr>*** - Removes the keyword from the blacklist.

/blacklist - Get a list of blocked keywords.

/help - Show all available commands.

This bot is powered by [Lexermal](https://github.com/lexermal).
`;


    public static start = `
⚡️ *Spotify Podcast Notifier Bot* ⚡️

Never miss episodes of your favorite podcaster and get rid of uninteresting episodes.

`+ Content.help;

    public static add = `
Let the bod notify you about new episodes simply with */init*

*Hint:* You add or remove podcasts in the Spotify app. The bot will then automatically notify you about new episodes.

If you want to see all avaiable commands type /help`;

    public static block = `
Blacklist a keyword. That way episodes containing this keyword in the title will not be send to you.

It works with */block <keyword>*

*Examples:*
/block hello\\_world
Episodes having this keyword will be blocked from getting sent to you.

/block hello\\_world abc
Episodes containing both keywords (hello\\_world AND abc) will be blocked.`;

    public static unblock = `
Removes a keyword from your blocked keywords. After unblocking, future episodes with this keyword will be send.

It works with */unblock <id>*

*Example:*

/unblock 3
Removes the keyword with the id 3 from your blocked keywords.`;

public static connection_successful = `
<html style="background-image: linear-gradient(to left top, #051937, #262e6a, #5c3d99, #a044c1, #ee3cdd); padding: 100px; ">
<body style="font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";">
<center style="margin-top: 2px">
<h1>Congratulations the Spotify Podcast Notifier Telegram Bot is now connected!</h1>
<h3>You can close this tab.</h3>
</center>
`;
}