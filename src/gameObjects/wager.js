import { mention, format } from '../utils.js';
import GIFEncoder from 'gifencoder';
import canvas from 'canvas';
const { createCanvas, loadImage } = canvas;

const encoder = new GIFEncoder(320, 240);

export class Wager {
  constructor(id) {
    this.id = id;
    this.bets = [];
  }

  get serialized() {
    return {}
  }

  async handle({ content, channel, author }) {
    const match = content.match(/\!wager \"(.+?)\"/ig) || [false, false, false];
    const [, wagerid, argsUntrimmed] = match;
    console.table({ match, content, wagerid, argsUntrimmed });
    if (!wagerid) {

      encoder.start();
      encoder.setRepeat(-1);   // 0 for repeat, -1 for no-repeat
      encoder.setDelay(500);  // frame delay in ms
      encoder.setQuality(10);

      const canvas = createCanvas(320, 240);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 320, 240);
      encoder.addFrame(ctx);

      // green rectangle
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, 320, 240);
      encoder.addFrame(ctx);

      // blue rectangle
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(0, 0, 320, 240);
      encoder.addFrame(ctx);


      channel.send([`here is a test`, {
        files: [{
          attachment: encoder.finish(),
          name: 'player-cards.jpg'
        }]
      }]);
      return false;
    }
    if (!argsUntrimmed) {
      channel.send(`And what do you want to do with "${wagerid}", ${mention(author.id)}?`);
      return false;
    }
    const args = argsUntrimmed.trim();
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