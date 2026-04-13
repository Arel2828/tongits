"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, User } from "lucide-react";
import { getSocket } from "@/lib/socket";

interface Message {
  id: string;
  username: string;
  message: string;
  time: string;
}

interface ChatProps {
  roomCode: string;
  username: string;
}

export default function Chat({ roomCode, username }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on("chat:message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen) setHasNewMessage(true);
    });

    return () => {
      socket.off("chat:message");
    };
  }, [socket, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit("chat:send", { code: roomCode, message, username });
    setMessage("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessage(false);
        }}
        className="relative w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border-2 border-blue-400 group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 animate-bounce" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            className="absolute bottom-20 right-0 w-80 h-[400px] bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col mb-4 mr-2"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-800/50 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Table Chat</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono">{roomCode}</span>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 opacity-50">
                  <MessageCircle size={32} />
                  <p className="text-[10px] uppercase tracking-tighter">No messages yet</p>
                </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{msg.username}</span>
                    <span className="text-[10px] text-zinc-700">{msg.time}</span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    msg.username === username 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-zinc-800 text-white rounded-tl-none'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form 
              onSubmit={sendMessage}
              className="p-4 bg-zinc-800/30 border-t border-white/5 flex gap-2"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-black/40 border border-white/5 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
              />
              <button
                type="submit"
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


