import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();

const io = new Server(httpServer, {
  // DO NOT change the path — Caddy forwards based on it
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const PORT = 3005;

// ── Types ────────────────────────────────────────────────────────────────────

interface JoinPayload {
  reference: string;
}

interface BroadcastPayload {
  reference: string;
  data: Record<string, unknown>;
}

// ── Connection handling ──────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[tracking-ws] client connected: ${socket.id}`);

  /**
   * Client joins a room specific to a baggage reference.
   * Room name format: bag:<reference>  (e.g. bag:Hajj26-MLQGY7)
   */
  socket.on('join', (payload: JoinPayload) => {
    const { reference } = payload;

    if (!reference || typeof reference !== 'string') {
      console.warn(`[tracking-ws] invalid join payload from ${socket.id}`);
      return;
    }

    const room = `bag:${reference}`;
    socket.join(room);
    console.log(`[tracking-ws] ${socket.id} joined room ${room}`);
  });

  /**
   * Demo / testing endpoint.
   * Any connected client can emit a `broadcast` event to simulate a new scan
   * being pushed to everyone tracking the same reference.
   */
  socket.on('broadcast', (payload: BroadcastPayload) => {
    const { reference, data } = payload;

    if (!reference || typeof reference !== 'string') {
      console.warn(`[tracking-ws] invalid broadcast payload from ${socket.id}`);
      return;
    }

    const room = `bag:${reference}`;
    const enriched = {
      ...data,
      _broadcastAt: new Date().toISOString(),
      _source: socket.id,
    };

    io.to(room).emit('scan-event', enriched);
    console.log(`[tracking-ws] broadcast to ${room}:`, enriched);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[tracking-ws] client disconnected: ${socket.id} (${reason})`);
  });

  socket.on('error', (err) => {
    console.error(`[tracking-ws] socket error (${socket.id}):`, err);
  });
});

// ── Start server ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[tracking-ws] tracking WebSocket server running on port ${PORT}`);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string) {
  console.log(`[tracking-ws] received ${signal}, shutting down…`);
  io.close();
  httpServer.close(() => {
    console.log('[tracking-ws] server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));