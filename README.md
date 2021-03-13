# A bot for running casino games in discord.

To run you'll want to grab a discord bot id and pop it into a `BOTID` environment variable.

If you want to have a test server, make a test Discord server and grab that id and pop it into `TESTSERVER` environment variable.

I also currently run it from a `./db/db.json` file, so make one of those too.

I use `pm2` to daemonize the server