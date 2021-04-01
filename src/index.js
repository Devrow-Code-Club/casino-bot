import Discord from 'discord.js';
import { promises as fs } from 'fs';
import process from 'process';

import { BlackJack } from './blackjack.js';
import { Wager } from './gameObjects/wager.js';
import { Roulette } from './roulette.js';
import { format } from './utils.js';

const DEV_MODE = false;
const BJ_DOWN = false;
const ROULETTE_DOWN = false;
const enableStonks = false;
const DBLOC = './db/db.json';
const games = {};

const jsonDB = JSON.parse(await fs.readFile(DBLOC));
const initBrowser = async () => {
  const puppeteer = await import('puppeteer-core');
  return puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
}

const notifyWinners = (winners) => {
  return `${winners.map(winner => `<@${winner.id}> wins ${winner.blackjack ? `${format(winner.bet * 1.5)} with a blackjack!` : format(winner.bet)}`).join('\n')}`
}

const notifyLosers = (losers) => {
  return `${losers.map(loser => `<@${loser.id}> loses.`).join('\n')}`
}

const notifyStandoffs = (standoffs) => {
  return `${standoffs.map(standoff => `We are at a stand-off, <@${standoff.id}>.`).join('\n')}`
}

const bot = new Discord.Client();
const globalListener = new EventTarget();

bot.on('ready', async () => {
  console.log('ready');
  let settingPresence = false;
  if (enableStonks) {
    const StockSocket = await import('stocksocket/StockSocket.js');
    const stockPresenceChanged = async ({ ticker, price }) => {
      if (settingPresence) return;
      settingPresence = true
      await bot.user.setPresence({ activity: { name: `GME: ${price}`, type: 1 }, status: 'idle' })
      settingPresence = false;
    }

    StockSocket.addTickers(["GME"], stockPresenceChanged);
  }
  if (DEV_MODE) {
    bot.user.setPresence({ activity: { name: 'maintenance', type: 1 }, status: 'dnd' });
    console.table({ BOTID: process.env.BOTID, TESTSERVER: process.env.TESTSERVER });
  }
  else {
    console.log(import.meta.url);
    bot.user.edit({ avatar: './src/images/avatar.png' });
    bot.user.setPresence({ activity: { name: 'casino games', type: 1 }, status: 'idle' });
  }
});

bot.on('message', async ({ channel, author, mentions, content, guild }) => {
  if (author.id === bot.user.id || !/ca[sn]i[ns]o/.test(channel.name) || !content.startsWith("!")) return;
  const serverId = channel.guild.id;

  if (DEV_MODE && serverId !== process.env.TESTSERVER) return channel.send(`Sorry, we are closed right now.`);

  if (!games[serverId]) games[serverId] = { wagers: {} };

  const authorMention = `<@${author.id}>`;

  if (!jsonDB[serverId]) jsonDB[serverId] = { wagers: {} };
  if (!jsonDB[serverId][author.id]) jsonDB[serverId][author.id] = { balance: 1000 };
  if (!jsonDB[serverId][author.id].totals) jsonDB[serverId][author.id].totals = { winAmount: 0, wins: 0, betAmount: 0, bets: 0, loans: 0, loanAmount: jsonDB[serverId][author.id].loan || 0, loanPaid: 0, highestBalance: jsonDB[serverId][author.id].balance, largestBet: 0, largestWin: 0, largestLoanBalance: jsonDB[serverId][author.id].loan || 0 };
  if (!jsonDB[serverId].houseStats) jsonDB[serverId].houseStats = { payouts: 0, income: 0, betTypes: {}, totalBets: 0, totalBetAmount: 0, loanAmount: 0, loans: 0, loanAmountPaid: 0 };

  if (content.startsWith('/casino help') || content.startsWith('!casino help')) channel.send(`To view your devrowcoin balance: !balance
If you run out of devrowcoins: !loan
To pay back your loan: !loan pay [amount]
To play roulette: !roulette [command]
!roulette help
More games coming soon!`)
  if (content.startsWith('/balance') || content.startsWith('!balance')) {
    channel.send(`${authorMention} your balance is: ${format(jsonDB[serverId][author.id].balance || 0)} devrowcoins`);
    if (jsonDB[serverId][author.id].loan) channel.send(`And I would like to remind you ${authorMention} that you owe me ${format(jsonDB[serverId][author.id].loan)} devrowcoins`)
    return;
  }
  if (content.startsWith('/loan') || content.startsWith('!loan')) {
    if (content.includes('pay')) {
      if (!jsonDB[serverId][author.id].loan) return channel.send(`I don't see an outstanding balance ${authorMention}`);
      const [, rawPayment] = content.match(/pay (\d+)/);
      if (!rawPayment) return channel.send(`Ok, how much of your ${jsonDB[serverId][author.id].loan} devrowcoin loan would you like to pay?`);
      const payment = Number(rawPayment);
      if (payment > jsonDB[serverId][author.id].balance) return channel.send(`You don't have enough to do that ${authorMention}.`);
      if (payment > jsonDB[serverId][author.id].loan) return channel.send(`Please ${authorMention}, thats too much. You only owe \`${jsonDB[serverId][author.id].loan}\` devrowcoins.`);
      if (payment == jsonDB[serverId][author.id].balance) return channel.send(`So I can just give you another loan? ${authorMention} that would leave you with nothing.`)
      jsonDB[serverId][author.id].loan -= payment;
      jsonDB[serverId][author.id].totals.loanPaid += payment;
      jsonDB[serverId][author.id].balance -= payment;
      jsonDB[serverId].houseStats.loanAmountPaid += payment;
      channel.send(`Alright, you've paid back ${payment} devrowcoins. Your outstanding loan is \`${jsonDB[serverId][author.id].loan}\` and you have a remaning balance of \`${jsonDB[serverId][author.id].balance}\``);
      fs.writeFile(DBLOC, JSON.stringify(jsonDB));
      return;
    }
    if (jsonDB[serverId][author.id].balance > 0) return channel.send(`I see you have \`${jsonDB[serverId][author.id].balance || 0}\` devrowcoins. Please use up what you have before asking for more ${authorMention}.`);
    jsonDB[serverId][author.id].balance = 1000;
    channel.send(`Sure thing ${authorMention}! Just sign here on the line and we can make that happen.
Excellent! Here is your _loan_ of \`1000\` devrowcoins.`)
    if (!jsonDB[serverId][author.id].loan) jsonDB[serverId][author.id].loan = 0;
    jsonDB[serverId][author.id].loan += 1000;
    jsonDB[serverId][author.id].totals.loans++;
    jsonDB[serverId][author.id].totals.loanAmount += 1000;
    jsonDB[serverId][author.id].totals.largestLoanBalance = Math.max(jsonDB[serverId][author.id].loan, jsonDB[serverId][author.id].totals.largestLoanBalance);
    jsonDB[serverId].houseStats.loans++;
    jsonDB[serverId].houseStats.loanAmount += 1000;
  }
  if (content.startsWith('!stats')) {
    if (content.includes(' self')) {
      return channel.send(`Sure ${authorMention} here are your stats:
\`\`\`
${Object.entries(jsonDB[serverId][author.id].totals).map(([stat, value]) => `${stat}${'.'.repeat(18 - stat.length + 12 - (format(value, true)).length)}${format(value, true)}`).join('\n')}
\`\`\`
`);
    }
    return channel.send(`Sure ${authorMention} here are the server stats:
\`\`\`
${Object.entries(jsonDB[serverId].houseStats).map(([stat, value]) => isNaN(value) ? false : `${stat}${'.'.repeat(18 - stat.length + 12 - (format(value, true)).length)}${format(value, true)}`).filter(n => Boolean(n)).join('\n')}
\`\`\`
`);
  }
  if (content.startsWith('/roulette ') || content.startsWith('!roulette ') || content.startsWith('!r ')) {
    const rouletteCommands = content.split('\n');
    for (const command of rouletteCommands) {
      if (ROULETTE_DOWN && serverId !== process.env.TESTSERVER) return channel.send(`Sorry, roulette is closed right now.`);
      if (command.includes(' table')) {
        // const browser = await initBrowser();
        // const page = await browser.newPage();
        // await page.setViewport({
        //   width: 1200,
        //   height: 400,
        //   deviceScaleFactor: 1,
        // });
        // await page.setContent(await fs.readFile(path.resolve('.', 'src', 'pages', 'roulette-table.html'), { encoding: 'utf-8' }));
        return channel.send({
          files: [{
            attachment: './src/images/custom-roulette-table.jpg',
            // attachment: await page.screenshot({ clip: { x: 0, y: 0, width: 1097, height: 336 } }),
            name: 'roulette-table.jpg'
          }]
        });
      }
      if (command.includes(' help')) {
        await channel.send(Roulette.helpText);
        return;
      }
      if (command.includes(' stats')) {
        return channel.send(`Sure ${authorMention} here are the server stats:
\`\`\`
${Object.entries(jsonDB[serverId].houseStats.betTypes).map(([betType, { wins, losses }]) => `${betType}${'.'.repeat(10 - betType.length + 12 - (format(wins, true)).length)}${format(wins, true)}/${format(wins + losses, true)} - ${Math.round(100 * (wins / (wins + losses)))}%`).join('\n')}
\`\`\`
`);
      }
      if (games[serverId].roulette && !games[serverId].roulette.betting) {
        return channel.send(`Sorry ${authorMention}, bets are closed. Please wait for the next spin.`)
      }
      {
        const match = command.match(/bet (\d+) ([\w-]+) ?(.+)?/);
        if (!match) return channel.send(`Sorry ${authorMention} I'm not sure of the bet you are placing`);
        const [, amount, betType, bet] = match;
        const betTypeOptions = Roulette.betTypes.find(type => type.name === betType);
        if (!betTypeOptions) return channel.send(`Sorry ${authorMention} I'm not sure of the bet you are placing`);
        const validBet = Number(amount) > 0 && betTypeOptions.validate(Number(bet) >= 0 && Number(bet) <= 36 ? Number(bet) : -1);
        const betNumbers = betTypeOptions.getNumbers(Number(bet) >= 0 ? Number(bet) : -1);
        if (!validBet) return channel.send(`Thats not a valid bet ${authorMention}.`);
        if (jsonDB[serverId][author.id].balance - amount < 0) return channel.send(`You don't have enough devrowcoins for that bet ${authorMention}.`)

        if (!games[serverId].roulette) {
          games[serverId].roulette = new Roulette();

          await channel.send('Starting the roulette table spinning.');
          games[serverId].roulette.lastRouletteWheel = await channel.send('https://media.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif');
          Roulette.bettingTimeout.then(async () => {
            games[serverId].roulette.betting = false;
            await channel.send('no more bets');
            const { landing, winners, losers } = await games[serverId].roulette.spinTimeout;
            await games[serverId].roulette.lastRouletteWheel.edit(`\`\`\`diff
+ the wheel lands on ${landing}
\`\`\``);
            await channel.send(`We have \`${landing}\`.`);

            for (const [playerid, { amount, betTypes }] of Object.entries(winners)) {
              jsonDB[serverId][playerid].totals.wins++;
              jsonDB[serverId].houseStats.payouts += amount;
              jsonDB[serverId][playerid].totals.winAmount += amount
              jsonDB[serverId][playerid].totals.largestWin = Math.max(jsonDB[serverId][playerid].totals.largestWin, Number(amount));
              jsonDB[serverId][playerid].balance += Number(amount) + amount;
              jsonDB[serverId][playerid].totals.highestBalance = Math.max(jsonDB[serverId][playerid].totals.highestBalance, jsonDB[serverId][playerid].balance)
              for (const betType of Array.from(betTypes)) {
                jsonDB[serverId].houseStats.betTypes[betType].wins++;
              }
            }
            for (const [playerid, { amount, betTypes }] of Object.entries(losers)) {
              jsonDB[serverId].houseStats.income += Number(amount);
              for (const betType of Array.from(betTypes)) {
                jsonDB[serverId].houseStats.betTypes[betType].losses++;
              }
            }
            if (Object.entries(winners).length > 0) await channel.send(`${Object.entries(winners).map(([playerid, { amount, betTypes }]) => `<@${playerid}> wins ${format(amount)} with \`[${Array.from(betTypes).join(', ')}]\``).join('\n')}`);
            if (Object.entries(losers).length > 0) await channel.send(`${Object.entries(losers).map(([playerid, { betTypes }]) => `<@${playerid}> loses with \`[${Array.from(betTypes).join(', ')}]\``).join('\n')}`);

            delete games[serverId].roulette
            fs.writeFile(DBLOC, JSON.stringify(jsonDB));
          });
        }
        if (!games[serverId].roulette.playerMessages[author.id]) games[serverId].roulette.playerMessages[author.id] = {};

        if (betTypeOptions) {
          jsonDB[serverId][author.id].balance = jsonDB[serverId][author.id].balance - Number(amount);
          jsonDB[serverId][author.id].totals.bets++;
          jsonDB[serverId][author.id].totals.betAmount += Number(amount);
          jsonDB[serverId].houseStats.totalBets++;
          jsonDB[serverId].houseStats.totalBetAmount += Number(amount);
          jsonDB[serverId][author.id].totals.largestBet = Math.max(jsonDB[serverId][author.id].totals.largestBet, Number(amount));
          if (!games[serverId].roulette.playerMessages[author.id].bets)
            games[serverId].roulette.playerMessages[author.id].bets = await channel.send(`${authorMention} I have you for \`${betType}${bet ? ` on ${bet}` : ''}\` for ${format(Number(amount))}.`);
          else
            games[serverId].roulette.playerMessages[author.id].bets = await games[serverId].roulette.playerMessages[author.id].bets.edit(`${games[serverId].roulette.playerMessages[author.id].bets.content}\nAnd \`${betType}${bet ? ` on ${bet}` : ''}\` for ${format(Number(amount))}.`)
          if (!jsonDB[serverId].houseStats.betTypes[betType]) jsonDB[serverId].houseStats.betTypes[betType] = { times: 0, wins: 0, losses: 0 }
          jsonDB[serverId].houseStats.betTypes[betType].times++;

          games[serverId].roulette.bets.push({ amount: Number(amount), betNumbers, payout: betTypeOptions.payout, player: author, betType });
        }
        else
          await channel.send(`Sorry ${authorMention} I'm not sure of the bet you are placing`);
      }
    }
  }
  if (content.startsWith('!blackjack ') || content.startsWith('!bj ')) {

    //TODO: fix split blackjack
    //TODO: unify stand workflow
    if (BJ_DOWN && serverId !== process.env.TESTSERVER) return channel.send(`Sorry - blackjack(beta) is closed right now.`);
    if (content.includes(' help')) {
      return channel.send(`\`\`\`Commands:
!blackjack bet [amount] (starts a game if not in progress)
!blackjack hit
!blackjack stand
!blackjack double down
!blackjack split (if matching card faces)
!blackjack insurance decline/[amount] (if dealer shows an Ace)
\`\`\``)
    }
    if (games[serverId].blackjack && games[serverId].blackjack.getPlayerById(author.id) && games[serverId].blackjack.started && games[serverId].blackjack.getPlayerById(author.id).cardTotal > 21) return channel.send(`Sorry ${authorMention}, you busted.`);
    if (!games[serverId].blackjack && !content.includes(' bet')) return channel.send(`No game in progress, start a game with a \`bet\`.`);
    if (games[serverId].blackjack && games[serverId].blackjack.insuranceOffered && !content.includes(' insurance')) return channel.send(`Lets get your option on insurance first ${authorMention}`);
    if (games[serverId].blackjack && games[serverId].blackjack.currentPlayer && games[serverId].blackjack.currentPlayer.id !== author.id) return channel.send(`Its not your turn ${authorMention}, I'm working with <@${games[serverId].blackjack.currentPlayer.id}>.`);
    if (content.includes(' bet')) {
      const match = content.match(/bet (\d+)/);
      if (!match) return channel.send(`Sorry ${authorMention} I'm not sure of the bet you are placing`);
      const [, amount] = match;
      if (amount > jsonDB[serverId][author.id].balance) return channel.send(`You don't have that much ${authorMention}.`);
      if (!games[serverId].blackjack) {
        games[serverId].blackjack = new BlackJack(DEV_MODE);
        let player = games[serverId].blackjack.addPlayer(author.id);
        player.bet = Number(amount);
        jsonDB[serverId].houseStats.totalBets++;
        jsonDB[serverId].houseStats.totalBetAmount += player.bet;
        jsonDB[serverId][author.id].balance = jsonDB[serverId][author.id].balance - Number(amount);
        if (!games[serverId].blackjack.messages.starting)
          games[serverId].blackjack.messages.starting = await channel.send(`Starting in ${games[serverId].blackjack.startingIn} seconds. Place your bets to get in the game.
Currently in the game:
${games[serverId].blackjack.players.map(player => `<@${player.id}>`).join("\n")}`);
        else
          return games[serverId].blackjack.messages.starting = await games[serverId].blackjack.messages.starting.edit(`Starting in ${games[serverId].blackjack.startingIn} seconds. Place your bets to get in the game.
Currently in the game:
${games[serverId].blackjack.players.map(player => `<@${player.id}>`).join("\n")}`);

        await games[serverId].blackjack.startPromise;
        games[serverId].blackjack.started = true;
        await games[serverId].blackjack.startBuffer;

        games[serverId].blackjack.initDealer();
        games[serverId].blackjack.dealer.lastCardDisplay = await channel.send("dealer's cards", {
          files: [{
            attachment: await games[serverId].blackjack.dealer.displayCards(true),
            name: 'dealer-cards.jpg'
          }]
        });
        games[serverId].blackjack.dealPlayers();
        for (const player of games[serverId].blackjack.players) {
          player.lastCardDisplay = await channel.send(...(await player.sendCards()));
        }
        if (games[serverId].blackjack.dealerAceShowing) {
          await channel.send(`Would anyone like to buy insurance? (\`!blackjack insurance decline/[0 - bet/2]\`)`);
          setTimeout(() => { games[serverId].blackjack.players.forEach(player => player.insuranceResolved = true) }, 15000);
          await games[serverId].blackjack.offerInsurance();
          if (!games[serverId].blackjack.dealer.blackjack) await channel.send(`Dealer does not have blackjack.`);
        }
        if (games[serverId].blackjack.dealer.blackjack) {
          await channel.send(`Dealer has blackjack.`);
          for (const player of games[serverId].blackjack.players) {
            if (player.insurance) {
              const insurancePayout = player.insurance * 2;
              await channel.send(`<@${player.id}>'s insurance pays \`${insurancePayout}\`.`);
              jsonDB[serverId][player.id].balance += insurancePayout;
            }
            for (const playerStand of games[serverId].blackjack.players)
              await games[serverId].blackjack.playerStand(playerStand.id);
          }
        }
        for (const playerCheck of games[serverId].blackjack.players) {
          if (playerCheck.blackjack && !playerCheck.stand) {
            await channel.send(`<@${playerCheck.id}> has a blackjack. Winner!`);
            await games[serverId].blackjack.playerStand(playerCheck.id);
            player = games[serverId].blackjack.currentPlayer;
          }
        }

        if (player && !player.stand) {
          games[serverId].blackjack.currentPlayer = player;
          await channel.send(`<@${player.id}>, lets start with you.`);
          return;
        }
      } else {

        if (games[serverId].blackjack.getPlayerById(author.id)) {
          return channel.send(`I've already got you in the game ${authorMention}.`);
        } else if (!games[serverId].blackjack.started) {
          let player = games[serverId].blackjack.addPlayer(author.id);
          player.bet = Number(amount);
          jsonDB[serverId].houseStats.totalBets++;
          jsonDB[serverId].houseStats.totalBetAmount += player.bet;
          jsonDB[serverId][author.id].balance = jsonDB[serverId][author.id].balance - player.bet;
          return channel.send(`Welcome to the game ${authorMention}.`);
        }
        if (games[serverId].blackjack.started) return channel.send(`Hold on ${authorMention}, there is a game in progress.`)
        if (games[serverId].blackjack)
          await channel.send(`Welcome ${authorMention}, try your luck? The game starts in ${games[serverId].blackjack.startingIn} seconds`);
      }

    }
    if (content.includes(' insurance')) {
      const match = content.match(/insurance (\d+|no|decline)/);
      if (!match) return channel.send(`Not sure what your are saying ${authorMention}.`);
      const [, rawInsurance] = match;
      const player = games[serverId].blackjack.getPlayerById(author.id);
      if (['no', 'decline'].includes(rawInsurance) || rawInsurance === '0') {
        player.insuranceResolved = true;
        games[serverId].blackjack.notifyMessage();
        return channel.send(`${authorMention} declines insurance.`)
      }
      const insurance = Number(rawInsurance);
      if (!insurance || Number.isNaN(insurance) || insurance < 0) return channel.send(`There seems to be a problem with your insurance of ${rawInsurance}, ${authorMention}`);
      if (insurance > jsonDB[serverId][author.id].balance) return channel.send(`You don't have enough to cover insurance of ${format(insurance)}. You only have ${format(jsonDB[serverId][author.id].balance)}, ${authorMention}`);
      if (insurance > player.bet / 2) return channel.send(`That insurance is too high ${authorMention}. You can only go up to ${format(player.bet / 2)}`);
      player.insuranceResolved = true;
      games[serverId].blackjack.notifyMessage();
      player.insurance = insurance;
      jsonDB[serverId][player.id].balance -= insurance;
    }
    if (content.includes(' stand')) {
      await games[serverId].blackjack.playerStand(author.id);
      if (games[serverId].blackjack.currentPlayer) {
        await channel.send(`<@${games[serverId].blackjack.currentPlayer.id}>, you are up.`);
        await games[serverId].blackjack.currentPlayer.deleteLastCardMessage();
        games[serverId].blackjack.currentPlayer.lastCardDisplay = await channel.send(...(await games[serverId].blackjack.currentPlayer.sendCards()));
      }
    }
    if (content.includes(' hit')) {
      const player = games[serverId].blackjack.getPlayerById(author.id)
      player.dealCard(games[serverId].blackjack.getCard());
      await player.deleteLastCardMessage();
      player.lastCardDisplay = await channel.send(...(await player.sendCards()));
      if (player.busted) {
        games[serverId].blackjack.currentPlayer = games[serverId].blackjack.getNextPlayer();
        if (games[serverId].blackjack.currentPlayer) {
          await channel.send(`<@${games[serverId].blackjack.currentPlayer.id}>, you are up.`);
          await games[serverId].blackjack.currentPlayer.deleteLastCardMessage();
          games[serverId].blackjack.currentPlayer.lastCardDisplay = await channel.send(...(await games[serverId].blackjack.currentPlayer.sendCards()));
        }
      }
    }
    if (content.includes(' split')) {
      const player = games[serverId].blackjack.getPlayerById(author.id);
      if (player.cards.length > 2 || Array.isArray(player.splitCards)) return channel.send(`It's only on the original deal ${authorMention}.`);
      if (player.cardFaces[0] !== player.cardFaces[1]) return channel.send(`You can only split if you have two of the same faced cards ${authorMention}.`);
      if (jsonDB[serverId][author.id].balance < player.bet) return channel.send(`${authorMention}, you don't have enough devrowcoin to cover a split.`);
      jsonDB[serverId][author.id].balance -= player.bet;
      player.splitCards = [player.cards.splice(0, 1), player.cards.splice(0, 1)];
      player.cards = player.splitCards[0];
      player.dealCard(games[serverId].blackjack.getCard());
      await player.deleteLastCardMessage();
      player.lastCardDisplay = await channel.send(...(await player.sendCards()));
    }
    if (content.includes(' double down')) {
      const player = games[serverId].blackjack.getPlayerById(author.id);
      if (!player) return channel.send(`Sorry ${authorMention}, it doesn't look like you are in a game.`);
      if (player.cards.length > 2) return channel.send(`It has to be your first move, ${authorMention}.`);
      if (jsonDB[serverId][author.id].balance < player.bet) return channel.send(`${authorMention}, you don't have enough devrowcoin to cover a double down.`);
      jsonDB[serverId][author.id].balance -= player.bet;
      player.bet *= 2;
      player.dealCard(games[serverId].blackjack.getCard());
      await player.deleteLastCardMessage();
      player.lastCardDisplay = await channel.send(...(await player.sendCards()));
      await games[serverId].blackjack.playerStand(player.id);
      if (games[serverId].blackjack.currentPlayer) {
        await channel.send(`<@${games[serverId].blackjack.currentPlayer.id}>, you are up.`);
        await games[serverId].blackjack.currentPlayer.deleteLastCardMessage();
        games[serverId].blackjack.currentPlayer.lastCardDisplay = await channel.send(...(await games[serverId].blackjack.currentPlayer.sendCards()));
      }
    }
    if (games[serverId].blackjack && games[serverId].blackjack.allStand) {
      if (!games[serverId].blackjack.allBusted) {
        games[serverId].blackjack.settleDealer();
      }
      await games[serverId].blackjack.dealer.deleteLastCardMessage();
      await channel.send(`dealer's cards: (\`${games[serverId].blackjack.dealer.cardTotal}\`)`, {
        files: [{
          attachment: await games[serverId].blackjack.dealer.displayCards(),
          name: 'dealer-cards.jpg'
        }]
      });
      const [winners, losers, standoffs] = games[serverId].blackjack.checkWinners();
      if (winners.length > 0) {
        await channel.send(notifyWinners(winners));
        winners.forEach(player => {
          const winAmount = Math.round(player.bet + (player.bet * (player.blackjack ? 1.5 : 1)));
          if (Number.isNaN(winAmount)) return channel.send(`Uh oh, something went wrong and I'm not sure what your bet was <@${player.id}> :clenched:`);
          jsonDB[serverId].houseStats.payouts += winAmount;
          jsonDB[serverId][player.id].balance += winAmount;
        });
      }
      if (losers.length > 0) {
        await channel.send(notifyLosers(losers));
        losers.forEach(player => {
          jsonDB[serverId].houseStats.income += player.bet;
        });
      }
      if (standoffs.length > 0) {
        await channel.send(notifyStandoffs(standoffs));
        standoffs.forEach(player => {
          jsonDB[serverId][player.id].balance += Number.isNaN(player.bet) ? 0 : player.bet;
        });
      }
      fs.writeFile(DBLOC, JSON.stringify(jsonDB));
      return delete games[serverId].blackjack;
    }
  }
  if (content.startsWith('!wager ')) {
    const [, wagerid] = content.match(/^!wager "(.+?)"/) || [, false];
    if (!wagerid) return channel.send(`Please start with a wagerid (\`!wager "{wagerid}" command ...\`) to make or interact with a wager, ${authorMention}. Learn more with \`!wager help\`.`);
    if (!games[serverId].wagers[wagerid]) {
      if (!jsonDB[serverId].wagers) jsonDB[serverId].wagers = {};
      games[serverId].wagers[wagerid] = new Wager(wagerid, jsonDB[serverId].wagers[wagerid]);
    }
    const result = await games[serverId].wagers[wagerid].handle({ content, channel, author });

    if (result) {
      jsonDB[serverId].wagers[wagerid] = games[serverId].wagers[wagerid].serialized;
      fs.writeFile(DBLOC, JSON.stringify(jsonDB));
    }
  }
});
bot.login(process.env.BOTID)

