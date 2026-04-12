"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useVoiceChat(roomCode: string) {
  const [isVoiceJoined, setIsVoiceJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socket = getSocket();

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    setIsVoiceJoined(false);
  }, []);

  const initPeerConnection = useCallback(async (to?: string) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("voice:signal", { 
          code: roomCode, 
          signal: { type: "candidate", candidate: event.candidate },
          to 
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [roomCode, socket]);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsVoiceJoined(true);
      setError(null);

      // Tell others we joined voice
      socket.emit("voice:signal", { code: roomCode, signal: { type: "join" } });
    } catch (err) {
      console.error("Voice join error:", err);
      setError("Mic permission denied");
    }
  };

  const leaveVoice = () => {
    cleanup();
    socket.emit("voice:signal", { code: roomCode, signal: { type: "leave" } });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  useEffect(() => {
    const handleSignal = async ({ signal, from }: { signal: any, from: string }) => {
      if (!isVoiceJoined) return;

      try {
        if (signal.type === "join") {
          // Others joined, we initiate offer
          const pc = await initPeerConnection(from);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("voice:signal", { code: roomCode, signal: offer, to: from });
        } 
        else if (signal.type === "offer") {
          const pc = await initPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("voice:signal", { code: roomCode, signal: answer, to: from });
        } 
        else if (signal.type === "answer") {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          }
        } 
        else if (signal.type === "candidate") {
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
        else if (signal.type === "leave") {
            // Opponent left
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            setRemoteStream(null);
        }
      } catch (err) {
        console.error("Signal handling error:", err);
      }
    };

    socket.on("voice:signal", handleSignal);
    return () => {
      socket.off("voice:signal", handleSignal);
    };
  }, [socket, isVoiceJoined, roomCode, initPeerConnection]);

  return {
    isVoiceJoined,
    isMuted,
    remoteStream,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
