import { oneOf } from './utils.js';

export class Roulette {
  constructor() {
    this.betting = true;
    this.serverState = {};
    this.bets = [];
    this.playerMessages = {};
  }

  static get options() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36];
  }

  static get helpText() {
    return `\`\`\`
bet name        - description                              - payout
${this.betTypes.map(type => `${type.name}${" ".repeat(15 - type.name.length)} - ${type.desc}${" ".repeat(40 - type.desc.length)} - ${type.payout}`).join("\n")}
\`\`\`
groups are picked by the first number in the group - so \`corner 1\` would cover the numbers \`1, 2, 4, 5\`
usage: \`!roulette bet [amount] [common-name] [placement]\`
example: \`!roulette bet 100 straight-up 18\`
to view the table use: \`!roulette table\``;
  }

  static get betTypes() {
    return [
      { name: "straight-up", desc: "Any single number including 0", validate: (num) => num >= 0 && num <= 36, getNumbers: (num) => [num], payout: 35 },
      {
        name: "split-horiz", desc: "Any two adjoining numbers horizontal",
        validate: (num) => num % 3 !== 0 && num > 0,
        getNumbers: (num) => [num, num + 1], payout: 17
      },
      {
        name: "split-vert", desc: "Any two adjoining numbers vertical",
        validate: (num) => num < 34 && num > 0,
        getNumbers: (num) => [num, num + 3], payout: 17
      },
      { name: "basket-low", desc: "0,1,2", validate: () => true, getNumbers: () => [0, 1, 2], payout: 11 },
      { name: "basket-high", desc: "0,2,3", validate: () => true, getNumbers: () => [0, 2, 3], payout: 11 },
      {
        name: "street", desc: "any three numbers horizontal",
        validate: (num) => num % 3 === 1 && num > 0,
        getNumbers: (num) => [num, num + 1, num + 2], payout: 11
      },
      {
        name: "corner", desc: "any four adjoining numbers in a block",
        validate: (num) => num % 3 !== 0 && num < 34 && num > 0,
        getNumbers: (num) => [num, num + 1, num + 3, num + 4], payout: 8
      },
      {
        name: "six-line", desc: "any six numbers from two rows",
        validate: (num) => num % 3 === 1 && num < 34 && num > 0,
        getNumbers: (num) => [num, num + 1, num + 2, num + 3, num + 4, num + 5], payout: 5
      },
      {
        name: "column", desc: "the numbers in the column",
        validate: (num) => num < 4 && num > 0,
        getNumbers: (num) => {
          const numbers = [];
          for (let i = num; i <= 36; i = i + 3) numbers.push(i);
          return numbers;
        }, payout: 2
      },
      {
        name: "dozen", desc: "1: 1 - 12, 2: 13 - 24, 3: 25 - 36",
        validate: (num) => num < 4 && num > 0,
        getNumbers: (num) => {
          if (num === 1) return "x".repeat(12).split('').map((n, i) => i + 1)
          if (num === 2) return "x".repeat(12).split('').map((n, i) => i + 13)
          if (num === 3) return "x".repeat(12).split('').map((n, i) => i + 25)
        }, payout: 2
      },
      { name: "odd", desc: "odd numbers", validate: () => true, getNumbers: () => "x".repeat(36).split('').map((n, i) => i + 1).filter(n => n % 2 === 1), payout: 1 },
      { name: "even", desc: "even numbers", validate: () => true, getNumbers: () => "x".repeat(36).split('').map((n, i) => i + 1).filter(n => n % 2 === 0), payout: 1 },
      { name: "red", desc: "red numbers", validate: () => true, getNumbers: () => [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36], payout: 1 },
      { name: "black", desc: "black numbers", validate: () => true, getNumbers: () => [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35], payout: 1 },
      { name: "half", desc: "first or second half of the numbers", validate: (num) => num < 3 && num > 0, getNumbers: (num) => "x".repeat(18).split('').map((n, i) => i + (num == 1 ? 1 : 19)), payout: 1 },
    ]
  }

  static get bettingTimeout() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, 15000);
    })
  }

  get spinTimeout() {
    const landing = oneOf(Roulette.options);
    const winners = {};
    const losers = {};
    for (const { amount, betNumbers, payout, player, betType } of this.bets) {
      if (betNumbers.map(number => Number(number)).includes(landing)) {
        const winAmount = Number(amount) * Number(payout);
        if (!winners[player.id]) winners[player.id] = { amount: 0, betTypes: new Set() };
        winners[player.id].amount += winAmount;
        winners[player.id].betTypes.add(betType);
      } else {
        if (!losers[player.id]) losers[player.id] = { amount: 0, betTypes: new Set() };
        losers[player.id].amount += amount;
        losers[player.id].betTypes.add(betType);
      }
    }

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ landing, winners, losers });
      }, 5000);
    })
  }
}