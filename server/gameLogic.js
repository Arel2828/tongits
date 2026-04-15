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
    this.hasDrawn = false; // Track if current player has already drawn
    this.pendingChallenge = null; // { callerId }
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
      sapawLock: false,
    });
    return true;
  }

  start() {
    if (this.players.length < 2) return false;

    // Rotate dealer if there's a previous winner
    if (this.winner) {
      const winnerId = this.winner.id;
      this.players.forEach(p => p.isDealer = (p.id === winnerId));
    }

    this.deck = this.createDeck();
    this.drawPile = [...this.deck];
    this.discardPile = [];
    this.status = 'PLAYING';
    this.winner = null;
    this.roundReason = '';
    this.pendingChallenge = null;

    // Reset all players for the new round
    this.players.forEach(p => {
      p.hand = [];
      p.melds = [];
      p.hasMelded = false;
      p.isBurned = false;
      p.sapawLock = false;
      p.points = 0;
    });

    // Deal: Dealer gets 13, other gets 12
    const dealer = this.players.find(p => p.isDealer);
    const opponent = this.players.find(p => !p.isDealer);

    dealer.hand = this.drawPile.splice(0, 13);
    opponent.hand = this.drawPile.splice(0, 12);
    
    this.turnIndex = this.players.findIndex(p => p.isDealer);
    this.hasDrawn = false;
    this.updatePoints();
    return true;
  }

  updatePoints() {
    this.players.forEach(p => {
      // Points only count for unmelded cards in hand
      const { score } = this.solveMelds(p.hand);
      p.points = score;
    });
  }

  drawFromStock(playerId) {
    if (this.status !== 'PLAYING' || this.hasDrawn) return null;
    const player = this.players[this.turnIndex];
    if (player.id !== playerId) return null;
    if (this.drawPile.length === 0) return this.endGameByDraw();

    const card = this.drawPile.pop();
    player.hand.push(card);
    this.hasDrawn = true;
    this.updatePoints();
    return card;
  }

  drawFromDiscard(playerId, cardIndices = [], sapawData = null) {
    if (this.status !== 'PLAYING' || this.hasDrawn) return null;
    const player = this.players[this.turnIndex];
    if (player.id !== playerId) return null;
    if (this.discardPile.length === 0) return null;

    const topCard = this.discardPile[this.discardPile.length - 1];

    if (sapawData) {
      // Attempt Sapaw with discard
      const targetPlayer = this.players.find(p => p.id === sapawData.targetPlayerId);
      if (!targetPlayer) return null;
      
      const originalMeld = targetPlayer.melds[sapawData.meldIndex];
      const sortedIndices = [...cardIndices].sort((a, b) => b - a);
      const handCards = sortedIndices.map(idx => player.hand[idx]);
      
      if (this.isValidMeld([...originalMeld, topCard, ...handCards])) {
        // Success: Atomic Draw + Sapaw
        this.discardPile.pop();
        sortedIndices.forEach(idx => player.hand.splice(idx, 1));
        
        const newMeld = [...originalMeld, topCard, ...handCards];
        newMeld.sort((a, b) => this.rankToOrder(a.rank) - this.rankToOrder(b.rank));
        targetPlayer.melds[sapawData.meldIndex] = newMeld;
        
        player.hasMelded = true;
        this.hasDrawn = true;
        targetPlayer.sapawLock = true;
        this.updatePoints();
        return topCard;
      }
    } else {
      // Attempt Meld with discard
      const sortedIndices = [...cardIndices].sort((a, b) => b - a);
      const handCards = sortedIndices.map(idx => player.hand[idx]);
      const potentialMeld = [topCard, ...handCards];

      if (this.isValidMeld(potentialMeld)) {
        // Success: Atomic Draw + Meld
        this.discardPile.pop();
        sortedIndices.forEach(idx => player.hand.splice(idx, 1));
        
        potentialMeld.sort((a, b) => this.rankToOrder(a.rank) - this.rankToOrder(b.rank));
        
        player.melds.push(potentialMeld);
        player.hasMelded = true;
        this.hasDrawn = true;
        this.updatePoints();
        return topCard;
      }
    }

    return null; // Invalid combination: Discard card stays where it is
  }

  discard(playerId, cardIndex) {
    if (this.status !== 'PLAYING' || !this.hasDrawn) return false;
    const player = this.players[this.turnIndex];
    if (player.id !== playerId) return false;

    const [card] = player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    
    if (player.hand.length === 0) {
      this.win(player, 'Tongits');
      return true;
    }

    this.turnIndex = (this.turnIndex + 1) % this.players.length;
    this.hasDrawn = false; // Reset for next player
    player.sapawLock = false; // Unlock player after they finish their turn
    this.updatePoints();
    return true;
  }

  meld(playerId, cardIndices) {
    if (!this.hasDrawn) return false;
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    // Sort indices descending to avoid splice issues
    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    const potentialMeld = sortedIndices.map(idx => player.hand[idx]);

    if (this.isValidMeld(potentialMeld)) {
      sortedIndices.forEach(idx => player.hand.splice(idx, 1));
      
      // Sort the meld for clean visual display (especially for sequences)
      potentialMeld.sort((a, b) => this.rankToOrder(a.rank) - this.rankToOrder(b.rank));
      
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
    if (!this.hasDrawn) return false;
    const player = this.players.find(p => p.id === playerId);
    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!player || !targetPlayer) return false;

    const sortedIndices = [...cardIndices].sort((a, b) => b - a);
    const cardsToAdd = sortedIndices.map(idx => player.hand[idx]);
    
    const originalMeld = targetPlayer.melds[meldIndex];
    if (this.isValidMeld([...originalMeld, ...cardsToAdd])) {
      sortedIndices.forEach(idx => player.hand.splice(idx, 1));
      
      const newMeld = [...originalMeld, ...cardsToAdd];
      newMeld.sort((a, b) => this.rankToOrder(a.rank) - this.rankToOrder(b.rank));
      targetPlayer.melds[meldIndex] = newMeld;
      
      player.hasMelded = true; // Sapaw counts as having melded
      targetPlayer.sapawLock = true;
      this.updatePoints();
      return true;
    }
    return false;
  }

  callDraw(playerId) {
    const player = this.players.find(p => p.id === playerId);
    // Requirements: Must be start of turn (!hasDrawn), must have melded, and not sapawed
    if (!player || !player.hasMelded || this.hasDrawn || player.sapawLock) return false;

    // Set state to pending challenge
    this.status = 'CHALLENGE_PENDING';
    this.pendingChallenge = { callerId: playerId };
    return true;
  }

  respondToChallenge(playerId, response) {
    if (this.status !== 'CHALLENGE_PENDING' || !this.pendingChallenge) return false;
    
    const caller = this.players.find(p => p.id === this.pendingChallenge.callerId);
    const opponent = this.players.find(p => p.id !== this.pendingChallenge.callerId);
    
    if (playerId !== opponent.id) return false; // Only the challenged person can respond

    if (response === 'FOLD') {
      this.win(caller, 'Opponent Folded');
    } else if (response === 'CHALLENGE') {
      if (caller.points < opponent.points) {
        this.win(caller, 'Challenge Won');
      } else {
        // Defender wins ties
        this.win(opponent, 'Challenge Won (Defender)');
      }
    }
    
    this.pendingChallenge = null;
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

  autoSort(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    const { melds, unmelded } = this.solveMelds(player.hand);
    
    // Flatten melds and append unmelded cards
    const sortedHand = [];
    melds.forEach(m => sortedHand.push(...m));
    sortedHand.push(...unmelded);

    player.hand = sortedHand;
    return true;
  }

  solveMelds(hand) {
    const cards = [...hand];
    const possibleMelds = [];

    // Helper for Rank groups (Sets)
    const rankGroups = {};
    cards.forEach(c => {
      if (!rankGroups[c.rank]) rankGroups[c.rank] = [];
      rankGroups[c.rank].push(c);
    });

    for (const rank in rankGroups) {
      const group = rankGroups[rank];
      if (group.length >= 3) {
        if (group.length === 3) possibleMelds.push(group);
        if (group.length === 4) {
          possibleMelds.push(group);
          group.forEach((_, i) => {
            const subset = [...group];
            subset.splice(i, 1);
            possibleMelds.push(subset);
          });
        }
      }
    }

    // Helper for Suit groups (Runs)
    const suitGroups = { 'S': [], 'H': [], 'D': [], 'C': [] };
    cards.forEach(c => suitGroups[c.suit].push(c));

    for (const suit in suitGroups) {
      const group = suitGroups[suit].sort((a, b) => this.rankToOrder(a.rank) - this.rankToOrder(b.rank));
      for (let i = 0; i < group.length; i++) {
        for (let len = 3; i + len <= group.length; len++) {
          const sequence = group.slice(i, i + len);
          let valid = true;
          for (let k = 0; k < sequence.length - 1; k++) {
            if (this.rankToOrder(sequence[k+1].rank) !== this.rankToOrder(sequence[k].rank) + 1) {
              valid = false;
              break;
            }
          }
          if (valid) possibleMelds.push(sequence);
          else break;
        }
      }
    }

    // Recursive search for best combination
    let bestScore = cards.reduce((sum, c) => sum + c.value, 0);
    let bestMeldSet = [];

    const findBest = (remainingCards, meldIndex, currentMeldSet) => {
      const currentScore = remainingCards.reduce((sum, c) => sum + c.value, 0);
      if (currentScore < bestScore) {
        bestScore = currentScore;
        bestMeldSet = [...currentMeldSet];
      }

      if (meldIndex >= possibleMelds.length || bestScore === 0) return;

      for (let i = meldIndex; i < possibleMelds.length; i++) {
        const meld = possibleMelds[i];
        if (meld.every(mc => remainingCards.some(rc => rc.suit === mc.suit && rc.rank === mc.rank))) {
          const nextRemaining = remainingCards.filter(rc => !meld.some(mc => mc.suit === rc.suit && mc.rank === rc.rank));
          findBest(nextRemaining, i + 1, [...currentMeldSet, meld]);
        }
      }
    };

    findBest(cards, 0, []);

    const meldedCardIds = new Set();
    bestMeldSet.forEach(meld => meld.forEach(c => meldedCardIds.add(`${c.suit}-${c.rank}`)));
    const unmelded = cards.filter(c => !meldedCardIds.has(`${c.suit}-${c.rank}`));

    return { melds: bestMeldSet, unmelded, score: bestScore };
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
        sapawLock: p.sapawLock,
        canCallDraw: p.id === this.players[this.turnIndex]?.id && !this.hasDrawn && p.hasMelded && !p.sapawLock,
      })),
      drawPileCount: this.drawPile.length,
      discardPile: this.discardPile,
      status: this.status,
      winner: this.winner ? { id: this.winner.id, username: this.winner.username } : null,
      roundReason: this.roundReason,
      turnId: this.players[this.turnIndex]?.id,
      rematchCount: this.rematchReady.size,
      pendingChallenge: this.pendingChallenge,
      hasDrawn: this.hasDrawn,
    };
  }
}

module.exports = TongitsGame;
