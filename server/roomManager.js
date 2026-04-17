const TongitsGame = require('./gameLogic');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // code -> TongitsGame
  }

  createRoom() {
    let code;
    do {
      code = 'TNG-' + Math.floor(1000 + Math.random() * 9000);
    } while (this.rooms.has(code));

    const game = new TongitsGame();
    this.rooms.set(code, game);
    
    this.resetExpiry(code);

    return code;
  }

  resetExpiry(code) {
    const game = this.rooms.get(code);
    if (!game) return;

    if (game.expiryTimeout) {
      clearTimeout(game.expiryTimeout);
    }

    game.expiryTimeout = setTimeout(() => {
      console.log(`Room ${code} expired due to inactivity`);
      this.rooms.delete(code);
    }, 60 * 60 * 1000); // 1 hour inactivity TTL
  }

  getRoom(code) {
    const game = this.rooms.get(code);
    if (game) {
      this.resetExpiry(code);
    }
    return game;
  }

  removeRoom(code) {
    const game = this.rooms.get(code);
    if (game) {
      if (game.expiryTimeout) clearTimeout(game.expiryTimeout);
      if (game.disconnectTimeout) clearTimeout(game.disconnectTimeout);
    }
    this.rooms.delete(code);
  }
}

module.exports = new RoomManager();
