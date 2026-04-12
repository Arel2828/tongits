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
    
    // Set expiry cleanup
    setTimeout(() => {
      this.rooms.delete(code);
    }, 30 * 60 * 1000); // 30 minutes expiry

    return code;
  }

  getRoom(code) {
    return this.rooms.get(code);
  }

  removeRoom(code) {
    this.rooms.delete(code);
  }
}

module.exports = new RoomManager();
