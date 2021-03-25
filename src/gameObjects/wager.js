import { mention, format } from '../utils.js';

export class Wager {
  constructor(id) {
    this.id = id;
    this.bets = [];
  }

  get serialized() {
    return {}
  }

  async handle({ content, channel, author }) {
    const [, wagerid, args] = content.match(/^!wager \"(.+?)\" (.+)/ig) || [false, false, false];
    if (!wagerid) {
      channel.send(`Sorry ${mention(author.id)}, I'm not sure what wager you are talking about.`);
      return false;
    }
    // SAMPLE: !wager "wagerid" bet 1000 "option" 
    if (args.includes('bet ')) {
      args.replace('bet ', '');
      const [, amount, option] = args.match(/(\d+) \"(.+?)\"/);
      const result = await this.placeBet({ amount, option });
      if (result) return channel.send(`Alright ${mention(author.id)}, I've got you down for ${format(amount)} on \"${option}\".`);
      return channel.send(`I'm sorry, I'm not sure what kind of bet you are making ${mention(author.id)}`);
    }
    //SAMPLE: !wager "wagerid" winner "option"
    if (args.includes('winner ')) {
      args.replace('winner ', '');
      const [, option] = args.match(/\"(.+)\"/);
      return { command: "winner", option, wagerid };
    }
    //SAMPLE: !wager "wagerid" declare "option1" "option2"...
    if (args.includes('declare ')) {
      args.replace('declare ', '');
      const options = args.split(`" "`).map(option => option.replace(`"`, ''));
    }
  }
}