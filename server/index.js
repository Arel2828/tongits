const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const roomManager = require('./roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Fallback to all for now
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

const broadcastState = (code, game) => {
  game.players.forEach(p => {
    io.to(p.id).emit('game:update', game.getState(p.id));
  });
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('room:create', ({ username }) => {
    const code = roomManager.createRoom();
    const game = roomManager.getRoom(code);
    game.addPlayer(socket.id, username);
    socket.join(code);
    socket.emit('room:joined', { code, game: game.getState(socket.id) });
  });

  socket.on('room:join', ({ code, username }) => {
    try {
      const game = roomManager.getRoom(code);
      if (!game) {
        return socket.emit('error', 'Room not found');
      }

      // Try reconnection first
      if (game.reconnectPlayer(null, socket.id, username)) {
        socket.join(code);
        if (game.disconnectTimeout) {
            const allConnected = game.players.every(p => p.isConnected);
            if (allConnected) {
                clearTimeout(game.disconnectTimeout);
                game.disconnectTimeout = null;
            }
        }
        socket.emit('room:joined', { code, game: game.getState(socket.id) });
        broadcastState(code, game);
        return;
      }

      if (game.addPlayer(socket.id, username)) {
        socket.join(code);
        socket.emit('room:joined', { code, game: game.getState(socket.id) });
        broadcastState(code, game);
        
        // Auto-start if 2 players
        if (game.players.length === 2) {
          game.start();
          broadcastState(code, game);
        }
      } else {
        socket.emit('error', 'Room full');
      }
    } catch (err) {
      console.error("Error in room:join:", err);
      socket.emit('error', 'Internal server error');
    }
  });

  socket.on('game:draw-stock', ({ code }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.drawFromStock(socket.id);
    broadcastState(code, game);
  });

  socket.on('game:draw-discard', ({ code, cardIndices, sapawData }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.drawFromDiscard(socket.id, cardIndices, sapawData);
    broadcastState(code, game);
  });

  socket.on('game:meld', ({ code, cardIndices }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.meld(socket.id, cardIndices);
    broadcastState(code, game);
  });

  socket.on('game:sapaw', ({ code, targetPlayerId, meldIndex, cardIndices }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.sapaw(socket.id, targetPlayerId, meldIndex, cardIndices);
    broadcastState(code, game);
  });

  socket.on('game:discard', ({ code, cardIndex }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.discard(socket.id, cardIndex);
    broadcastState(code, game);
  });

  socket.on('game:call-draw', ({ code }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.callDraw(socket.id);
    broadcastState(code, game);
  });

  socket.on("game:respond-challenge", ({ code, response }) => {
    const game = roomManager.getRoom(code);
    if (game) {
      const success = game.respondToChallenge(socket.id, response);
      if (success) {
        broadcastState(code, game);
      }
    }
  });

  socket.on('game:rematch', ({ code }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.requestRematch(socket.id);
    broadcastState(code, game);
  });
  
  socket.on('game:auto-sort', ({ code }) => {
    const game = roomManager.getRoom(code);
    if (!game) return;
    game.autoSort(socket.id);
    broadcastState(code, game);
  });

  socket.on('chat:send', ({ code, message, username }) => {
    io.to(code).emit('chat:message', { 
      id: Date.now().toString(),
      username, 
      message, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    });
  });

  socket.on('voice:signal', ({ code, signal, to }) => {
    if (to) {
      io.to(to).emit('voice:signal', { signal, from: socket.id });
    } else {
      socket.to(code).emit('voice:signal', { signal, from: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find room the player was in
    for (const [code, game] of roomManager.rooms.entries()) {
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        player.isConnected = false;
        broadcastState(code, game);
        
        // Start 5-minute countdown for reconnection
        if (game.disconnectTimeout) clearTimeout(game.disconnectTimeout);
        game.disconnectTimeout = setTimeout(() => {
          if (game.players.some(p => !p.isConnected)) {
            roomManager.removeRoom(code);
            io.to(code).emit('error', 'Game ended due to player disconnection');
          }
        }, 300000); // 5 minutes
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
