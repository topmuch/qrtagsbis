'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ScanEventData {
  [key: string]: unknown;
  _broadcastAt?: string;
  _source?: string;
}

interface UseTrackingSocketReturn {
  /** Whether the socket is currently connected to the server. */
  isConnected: boolean;
  /** The most recent scan event payload received for this reference. */
  lastEvent: ScanEventData | null;
}

/**
 * React hook that connects to the tracking WebSocket mini-service
 * and listens for real-time scan events for a single baggage reference.
 *
 * - Connects via the Caddy gateway: `io("/?XTransformPort=3005")`
 * - On connect, emits a `join` event with the given reference
 * - Returns `{ isConnected, lastEvent }`
 * - Auto-reconnects on disconnect
 * - Cleans up (disconnects) on unmount
 */
export function useTrackingSocket(reference: string): UseTrackingSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ScanEventData | null>(null);

  useEffect(() => {
    // Guard: skip when reference is empty (e.g. page not yet loaded)
    if (!reference) return;

    const socket = io('/?XTransformPort=3005', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join the room for this baggage reference
      socket.emit('join', { reference });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time scan events broadcast to this room
    socket.on('scan-event', (data: ScanEventData) => {
      setLastEvent(data);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [reference]);

  return { isConnected, lastEvent };
}