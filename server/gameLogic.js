/**
 * Tongits Game Logic
 * Authoritative game state engine
 */

class TongitsGame {
  constructor() {
    this.deck = this.createDeck();
    this.players = []; // { id, username, hand, melds, points, isDealer, isConnected }
    this.turnIndex = 0;
    this.drawPile = [];
    this.discardPile = [];
    this.status = 'WAITING'; // WAITING, PLAYING, ENDED
    this.winner = null;
    this.roundReason = ''; // Tongits, Call Draw, Fight
    this.rematchReady = new Set();
    this.disconnectTimeout = null;
  }

  createDeck() {
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, value: this.getCardValue(rank) });
      }
    }
    return this.shuffle(deck);
  }

  getCardValue(rank) {
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    if (rank === 'A') return 1;
    return parseInt(rank);
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  addPlayer(id, username) {
    if (this.players.length >= 2) return false;
    this.players.push({
      id,
      username,
      hand: [],
      melds: [],
      points: 0,
      isDealer: this.players.length === 0,
      isConnected: true,
      hasMelded: false,
      isBurned: false,
    });
    return true;
  }

  start() {
    if (this.players.length < 2) return false;
    this.deck = this.createDeck();
    this.drawPile = [...this.deck];
    this.discardPile = [];
    this.status = 'PLAYING';

    // Deal: Dealer gets 13, other gets 12
    const dealer = this.players.find(p => p.isDealer);
    const opponent = this.players.find(p => !p.isDealer);

    dealer.hand = this.drawPile.splice(0, 13);
    opponent.hand = this.drawPile.splice(0, 12);
    
    this.turnIndex = this.players.findIndex(p => p.isDealer);
    this.updatePoints();
    return true;
  }

  updatePoints() {
    this.players.forEach(p => {
      p.points = p.hand.reduce((sum, card) => sum + card.value, 0);
    });
  }

  drawFromStock(playerId) {
    if (this.status !== 'PLAYING') return null;
    const player = this.players[this.turnIndex];
    if (player.id !== playerId) return null;
    if (this.drawPile.length === 0) return this.endGameByDraw();

    const card = this.drawPile.pop();
    player.hand.push(card);
    this.updatePoints();
    return card;
  }

  drawFromDiscard(playerId) {
    if (this.status !== 'PLAYING') return null;
    const player = this.players[this.turnIndex];
    if (player.id !== playerId) return null;
    if (this.discardPile.length === 0) return null;

    const card = this.discardPile.pop();
    player.hand.push(card);
    this.updatePoints();
    return card;
  }

  discard(playerId, cardIndex) {
    if (this.status !== 'PLAYING') return false;
    const player = this.players[this.turnIndex];
    if (player.id !== playerId) return false;

    const [card] = player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    
    if (player.hand.length === 0) {
      this.win(player, 'Tongits');
      return true;
    }

    this.turnIndex = (this.turnIndex + 1) % this.players.length;
    this.updatePoints();
    return true;
  }

  meld(playerId, cardIndices) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    // Sort indices descending to avoid splice issues
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    const potentialMeld = sortedIndices.map(idx => player.hand[idx]);

    if (this.isValidMeld(potentialMeld)) {
      sortedIndices.forEach(idx => player.hand.splice(idx, 1));
      player.melds.push(potentialMeld);
      player.hasMelded = true;
      this.updatePoints();
      return true;
    }
    return false;
  }

  isValidMeld(cards) {
    if (cards.length < 3) return false;
    
    // Check if Set (Same Rank)
    const sameRank = cards.every(c => c.rank === cards[0].rank);
    if (sameRank) return true;

    // Check if Sequence (Consecutive Ranks, Same Suit)
    const sameSuit = cards.every(c => c.suit === cards[0].suit);
    if (sameSuit) {
      const sorted = [...cards].sort((a, b) => this.rankToOrder(a.rank) - this.rankToOrder(b.rank));
      for (let i = 0; i < sorted.length - 1; i++) {
        if (this.rankToOrder(sorted[i+1].rank) !== this.rankToOrder(sorted[i].rank) + 1) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  rankToOrder(rank) {
    const order = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
    return order[rank];
  }

  sapaw(playerId, targetPlayerId, meldIndex, cardIndices) {
    const player = this.players.find(p => p.id === playerId);
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!player || !targetPlayer) return false;

    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    const cardsToAdd = sortedIndices.map(idx => player.hand[idx]);
    
    const originalMeld = targetPlayer.melds[meldIndex];
    if (this.isValidMeld([...originalMeld, ...cardsToAdd])) {
      sortedIndices.forEach(idx => player.hand.splice(idx, 1));
      targetPlayer.melds[meldIndex].push(...cardsToAdd);
      player.hasMelded = true; // Sapaw counts as having melded
      this.updatePoints();
      return true;
    }
    return false;
  }

  callDraw(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.hasMelded) return false;

    // In 2-player Tongits, Call Draw is usually undisputed or challenged.
    // We'll implement it as: Player calls, opponent can Challenge/Fight or Fold.
    // For simplicity, we'll auto-compare points for now.
    
    const opponent = this.players.find(p => p.id !== playerId);
    if (player.points < opponent.points) {
      this.win(player, 'Call Draw');
    } else {
      this.win(opponent, 'Fight/Challenge');
    }
    return true;
  }

  win(player, reason) {
    this.status = 'ENDED';
    this.winner = player;
    this.roundReason = reason;

    // Check for Burn (opponent has no melds)
    const loser = this.players.find(p => p.id !== player.id);
    if (loser && !loser.hasMelded) {
      loser.isBurned = true;
    }
  }

  endGameByDraw() {
    this.status = 'ENDED';
    const sorted = [...this.players].sort((a, b) => a.points - b.points);
    this.winner = sorted[0];
    this.roundReason = 'Draw Pile Empty';
    return null;
  }

  requestRematch(playerId) {
    this.rematchReady.add(playerId);
    if (this.rematchReady.size >= this.players.length) {
      this.rematchReady.clear();
      this.start();
      return true; // Restarted
    }
    return false; // Still waiting
  }

  getState(playerId) {
    return {
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        handCount: p.hand.length,
        hand: p.id === playerId ? p.hand : [], // Only send player's own hand
        melds: p.melds,
        points: p.id === playerId ? p.points : null,
        isDealer: p.isDealer,
        isConnected: p.isConnected,
        hasMelded: p.hasMelded,
        isBurned: p.isBurned,
      })),
      drawPileCount: this.drawPile.length,
      discardPile: this.discardPile,
      status: this.status,
      winner: this.winner ? { id: this.winner.id, username: this.winner.username } : null,
      roundReason: this.roundReason,
      turnId: this.players[this.turnIndex]?.id,
      rematchCount: this.rematchReady.size,
    };
  }
}

module.exports = TongitsGame;
