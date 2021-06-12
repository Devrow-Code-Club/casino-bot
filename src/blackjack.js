import { oneOf, sum } from './utils.js';
import canvas from 'canvas';
const { createCanvas, loadImage } = canvas;

export class BlackJack {
  constructor(deck, devMode) {
    this.deck = Array.isArray(deck) ? deck : this.freshDeck;
    console.log(this.deck);
    this.players = [];
    this.startWait = devMode ? 1 : 15;
    this.startTime = new Date();
    this.startTime.setSeconds(this.startTime.getSeconds() + this.startWait);
    this.startPromise = new Promise(resolve => setTimeout(resolve, this.startWait * 1000 - 500));
    this.startBuffer = new Promise(resolve => setTimeout(resolve, this.startWait * 1000 + 500));
    this.messages = {};
  }

  get freshDeck() {
    if (this.onFreshDeck) this.onFreshDeck();
    return [
      ['♠', '♣', '♥', '♦'].map(suit =>
        Array(9)
          .fill(1)
          .map((_, i) => i + 2)
          .concat(['J', 'Q', 'K', 'A'])
          .map(card => `${card}${suit}`),
      ),
    ].flat(2);
  }

  get startingIn() {
    return Math.ceil((this.startTime - new Date()) / 1000);
  }

  get allStand() {
    return this.players.every(player => player.stand || player.busted);
  }

  get allBusted() {
    return this.players.every(player => player.busted);
  }

  get dealerAceShowing() {
    return this.dealer.cards[1].includes('A');
  }

  get insuranceOffered() {
    return Boolean(this._insuranceOffered);
  }

  async playerStand(playerid) {
    const player = this.getPlayerById(playerid);
    delete player.lastCardDisplay;
    if (player.splitCards && player.cards === player.splitCards[0]) {
      player.cards = player.splitCards[1];
      player.dealCard(this.getCard());
      this.currentPlayer = player;
      return player;
    }
    player.stand = true;
    this.currentPlayer = this.getNextPlayer();
    return this.currentPlayer;
  }

  notifyMessage() {
    if (this._insuranceOffered) this._insuranceOffered();
  }

  initDealer() {
    this.dealer = new BlackJackPlayer({ id: 0, cards: [this.getCard(), this.getCard()] });
  }

  offerInsurance() {
    return new Promise(resolve => {
      this._insuranceOffered = () => {
        if (!this.players.every(player => player.insuranceResolved)) return;
        delete this._insuranceOffered;
        resolve();
      };
    });
  }

  settleDealer() {
    while (this.dealer.cardTotal <= 16 || (this.dealer.cardTotal === 17 && this.dealer.soft)) {
      this.dealer.dealCard(this.getCard());
    }
  }

  dealPlayers(force = []) {
    for (let card = 0; card < 2; card++) {
      this.players.forEach(player => {
        player.dealCard(this.getCard(force[card]));
      });
    }
  }

  getPlayerById(id) {
    return this.players.find(player => player.id === id);
  }

  addPlayer(playerid, options = {}) {
    const { initialCard = [] } = options;
    const player = new BlackJackPlayer({ id: playerid, cards: initialCard });
    this.players.push(player);
    return player;
  }

  getNextPlayer() {
    return this.players.find(player => !player.stand && !player.busted);
  }

  placeBet(player, bet) {
    this.getPlayerById(player).bet = bet;
  }

  getCard(face) {
    if (this.deck.length <= 0) this.deck = this.freshDeck;
    if (face) {
      const forceCard = this.deck.splice(
        this.deck.indexOf(this.deck.find(card => card.includes(face))),
        1,
      )[0];
      return forceCard;
    }
    return this.deck.splice(this.deck.indexOf(oneOf(this.deck)), 1)[0];
  }

  checkWinners() {
    const winFilter = player =>
      (player.blackjack && !this.dealer.blackjack) ||
      (player.cardTotal <= 21 &&
        (player.cardTotal > this.dealer.cardTotal || this.dealer.cardTotal > 21));
    const loseFilter = player =>
      (!player.blackjack && this.dealer.blackjack) ||
      player.cardTotal > 21 ||
      (player.cardTotal < this.dealer.cardTotal && this.dealer.cardTotal <= 21);
    const standoffFilter = player =>
      (player.blackjack && this.dealer.blackjack) ||
      (player.cardTotal <= 21 &&
        this.dealer.cardTotal <= 21 &&
        player.cardTotal === this.dealer.cardTotal);
    const winners = this.players.filter(winFilter);
    const losers = this.players.filter(loseFilter);
    const standoffs = this.players.filter(standoffFilter);
    const splitters = this.players.filter(player => Array.isArray(player.splitCards));
    splitters.forEach(player => (player.cards = player.splitCards[0]));
    winners.push(...splitters.filter(winFilter));
    losers.push(...splitters.filter(loseFilter));
    standoffs.push(...splitters.filter(standoffFilter));
    return [winners, losers, standoffs];
  }
}

class BlackJackPlayer {
  constructor({ id, cards = [] }) {
    this.id = id;
    this.cards = cards;
  }

  dealCard(card) {
    this.cards.push(card);
  }

  get busted() {
    return this.cardTotal > 21;
  }

  get cardTotal() {
    if (!this.cards) return 0;
    const cardsNumberized = this.cards.map(card =>
      Number(
        card
          .match(/\d?\d?\w?/)[0]
          .replace(/[jqk]/gi, '10')
          .replace(/a/gi, '11'),
      ),
    );
    let total = cardsNumberized.reduce(sum);
    while (total > 21 && cardsNumberized.includes(11)) {
      cardsNumberized.splice(cardsNumberized.indexOf(11), 1, 1);
      total = cardsNumberized.reduce(sum);
    }
    this.soft = false;
    if (cardsNumberized.includes(11)) this.soft = true;
    return total;
  }

  get cardFaces() {
    return this.cards.map(card => card.match(/\d?\d?\w?/)[0]);
  }

  get blackjack() {
    return this.cards.length === 2 && this.cardTotal === 21;
  }

  async deleteLastCardMessage() {
    if (this.lastCardDisplay) return this.lastCardDisplay.delete();
    return;
  }

  async sendCards() {
    return [
      `<@${this.id}> cards: (\`${this.cardTotal}\`)`,
      {
        files: [
          {
            attachment: await this.displayCards(),
            name: 'player-cards.jpg',
          },
        ],
      },
    ];
  }

  async displayCards(hideFirst) {
    const cardBack = hideFirst ? await loadImage('./src/images/devrow-code-club.png') : '';
    const canvas = createCanvas(75 * this.cards.length, 100);
    const context = canvas.getContext('2d');
    const cardDimensions = {
      outerWidth: 75,
      outerHeight: 100,
      width: 70,
      height: 95,
    };
    let left = (cardDimensions.outerWidth - cardDimensions.width) / 2;
    const top = (cardDimensions.outerHeight - cardDimensions.height) / 2;
    this.cards.forEach((card, cardIndex) => {
      const [face, suit] = card.replace(/([\w\d]+)/, '$1 ').split(' ');
      context.strokeStyle = '#000';
      context.fillStyle = 'white';
      roundRect(context, left, top, 70, 95, 8, true);
      context.font = '30px monotype';
      context.fillStyle = ['♥', '♦'].includes(suit) ? 'red' : 'black';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      if (hideFirst && cardIndex === 0) {
        context.drawImage(
          cardBack,
          left,
          top + (cardDimensions.height - cardDimensions.width) / 2,
          cardDimensions.width,
          cardDimensions.width,
        );
      } else {
        context.fillText(face, left + cardDimensions.width / 2, cardDimensions.outerHeight / 2);
        context.save();
        context.fillText(suit, left + cardDimensions.width / 5, cardDimensions.outerHeight / 5);
        context.translate(
          left + (cardDimensions.width - cardDimensions.width / 5),
          cardDimensions.outerHeight - cardDimensions.outerHeight / 5,
        );
        context.rotate(Math.PI);
        context.fillText(suit, 0, 0);
        context.restore();
      }
      left += cardDimensions.outerWidth;
    });
    return canvas.createPNGStream();
    //     `${this.id ? `<@${this.id}>` : `dealer's`} cards
    // \`\`\`
    // ${this.cards.map(() => `.-----.`).join('  ')}
    // ${this.cards.map(() => `|     |`).join('  ')}
    // ${this.cards.map((card, index) => `| ${!index && hideFirst ? '    ' : card.length > 2 ? `${card} ` : `${card.replace(/([\w\d])/, '$1 ')} `}
    // |`).join('  ')}
    // ${this.cards.map(() => `|     |`).join('  ')}
    // ${this.cards.map(() => `\`-----'`).join('  ')}
    // ${hideFirst ? '' : `total: ${this.cardTotal}`}
    // \`\`\`
    // ${this.busted ? 'Busted!' : ''}`;
  }
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}
