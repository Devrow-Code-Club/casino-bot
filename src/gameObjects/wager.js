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
    console.table(this.bets);
    const currentBet = this.bets.find(bet => bet.user === author.id);
    if (currentBet) {
      channel.send(`:suspicious_eyes: You already have a bet on this wager, remember? You wagered ${format(currentBet.amount)} on "${currentBet.choice}".`);
      return false;
    }
    const match = content.match(/bet\s+(-?\d+?)\s+\"(.+?)\"/);
    if (!match) {
      channel.send(`Sorry ${mention(author.id)} but I don't understand your bet. :clenched: (!wager "wager id" bet integerAmount "valid option")`)
      return false;
    }
    const [, amountString, choice] = match;
    if (!this.options.length) {
      console.table(this.options);
      channel.send(`:clenched: This doesn't appear to be a current wager.`)
      return false;
    }
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

  async declare({ content, author, channel }) {
    //example: !wager "wagerid" declare "option1" "option2" "option3" "..."
    if (this.options.length > 0) {
      channel.send(`:eyes: This wager has already been declared ${mention(author.id)}.`);
      return false;
    }
    const match = content.match(/declare\s+"(.+)"/);
    const options = Array.from(new Set(match[1].split(/"\s+"/)));
    if (options.length < 2) {
      channel.send(`:eyes: You are going to need more than 1 option ${mention(author.id)}.`)
      return false;
    }
    this.options = [...options];
    channel.send(`:tada: Awesome ${mention(author.id)}. We have a new wager set! Anyone who wants in use \`!wager "${this.id}" bet integerAmount "option"\` Valid options: ["${this.options.join('", "')}"]`);
    return true;
  }

  async handle({ content, channel, author }) {
    const match = content.match(/\!wager \"(.+?)\"/) || [];
    const [, wagerid] = match;
    if (!wagerid) {
      channel.send(`:clenched: Sorry ${mention(author.id)}, I'm not sure what wager you are talking about.`);
      return false;
    }
    const commandMatch = content.match(new RegExp(`\"${wagerid}\"\\s+(bet|winner|declare)`)) || [];
    const [, command] = commandMatch;

    console.table({ content, wagerid, command });

    if (!command) {
      channel.send(`:suspicious_eyes: And what do you want to do with "${wagerid}", ${mention(author.id)}?`);
      return false;
    }


    return this[command]({ content, author, channel });

  }
}