import { sum } from './utils.js';

export class Wager {
  constructor(id, options) {
    this.id = id;
    this.options = options;
    this.participants = [];
    this.pool = 0;
  }

  getParticipantById(participantid) {
    return this.participants.find(participant => participant.id = participantid);
  }

  addParticipant(participantid, option, amount) {
    if (!this.options.includes(option)) return "no option";
    if (this.participants.find(this.getParticipantById(participantid))) return "already in";
    if (Number.isNaN(amount)) return "NaN";
    if (amount <= 0) return "bad amount";
    this.pool += amount;
    const participant = new Participant(participantid, option, amount)
    this.participants.push(participant);
    return participant;
  }

  declareWinners(option) {
    this.winners = this.participants.filter(participant => participant.option === option);
    const losers = this.participants.filter(participant => participant.option !== option);
    return { winners: this.winners, losers };
  }

  determineWinnings(participant) {
    if (!this.winners) return 'no winners';
    const winnerTotal = this.winners.map(participant => participant.amount).reduce(sum);
    const percentage = participant.amount / winnerTotal;
    return Math.ceil(percentage * this.pool);
  }
}

class Participant {
  constructor(id, option, amount) {
    this.id = id;
    this.option = option;
    this.amount = amount;
  }
}