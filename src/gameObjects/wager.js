import { mention, format } from '../utils.js';

export class Wager {
  constructor(id) {
    this.id = id;
    this.bets = [];
    this.options = [];
  }

  get serialized() {
    return {}
  }

  async bet({ content, author, channel }) {
    // example: !wager "wagerName" bet 1000 "option"
    const currentBet = this.bets.find(bet => bet.user === author.id);
    if (currentBet) {
      channel.send(`:suspicious_eyes: You already have a bet on this wager, remember? You wagered ${format(currentBet.amount)} on "${currentBet.choice}".`);
      return false;
    }
    const match = content.match(/bet (-?\d+?) \"(.+?)\"/);
    if (!match) {
      channel.send(`Sorry ${mention(author.id)} but I don't understand your bet. :clenched: (!wager "wager id" bet integerAmount "valid option")`)
      return false;
    }
    const [, amountString, choice] = match;
    if (!this.options.includes(choice)) {
      channel.send(`:eyes: I don't see that option ${mention(author.id)}. Valid options for this wager are "${this.options.join(`", "`)}"`);
      return false;
    }
    const amount = Number(amountString);
    if (amount <= 0) {
      channel.send(`:suspicious_eyes: Thats not a proper amount ${mention(author.id)}. Positive integer amounts only.`);
      return false;
    }
    if (amount > author.state.balance) {
      channel.send(`:clenched: You don't have enough ${mention(author.id)}. You only have ${format(author.state.balance)}.`);
      return false;
    }
    this.bets.push({ userid: author.id, choice, amount });
    channel.send(`:notepad_spiral: Alright ${mention(author.id)}, I have you down for ${format(amount)} on "${choice}".`);
    return true;
  }

  async handle({ content, channel, author }) {
    const match = content.match(/\!wager \"(.+?)\"/) || [];
    const [, wagerid] = match;
    if (!wagerid) {
      channel.send(`:clenched: Sorry ${mention(author.id)}, I'm not sure what wager you are talking about.`);
      return false;
    }
    const commandMatch = content.match(new RegExp(`\"${wagerid}\" (bet|winner|declare)`)) || [];
    const [, command] = commandMatch;

    if (!command) {
      channel.send(`:suspicious_eyes: And what do you want to do with "${wagerid}", ${mention(author.id)}?`);
      return false;
    }

    console.table({ content, wagerid, command });

    return this[command]({ content, author, channel });

  }
}