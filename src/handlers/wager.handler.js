export class WagerHandler extends EventTarget {
  parse(content) {
    const [, wagerid, args] = content.match(/^!wager \"(.+?)\" (.+)/ig);
    // SAMPLE: !wager "wagerid" bet 1000 "option" 
    if (args.includes('bet ')) {
      args.replace('bet ', '');
      const [, amount, option] = args.match(/(\d+) \"(.+?)\"/);
      return { command: "bet", bet, amount, option, wagerid };
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