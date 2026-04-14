"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
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
    <div className="fixed bottom-6 right-6 z-[100] font-pixelify">
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessage(false);
        }}
        className="relative w-14 h-14 bg-pink-600 border-4 border-black shadow-[4px_4px_0_0_#9d174d] flex items-center justify-center text-white group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-black animate-bounce" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            className="absolute bottom-20 right-0 w-80 h-[400px] bg-white border-4 border-black flex flex-col mb-4 mr-0 shadow-[8px_8px_0_0_#ff1493]"
          >
            {/* Header */}
            <div className="p-4 bg-pink-50 border-b-2 border-pink-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 animate-pulse" />
                <span className="text-[10px] font-press-start font-bold text-pink-500 uppercase tracking-widest">COMMS</span>
              </div>
              <span className="text-[10px] text-pink-200 font-press-start">{roomCode}</span>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-white"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-pink-100 space-y-2">
                  <MessageCircle size={32} />
                  <p className="text-[10px] font-press-start uppercase tracking-tighter">Empty Log</p>
                </div>
              )}
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-bold text-pink-300 uppercase">{msg.username}</span>
                  </div>
                  <div className={`max-w-[85%] px-4 py-2 border-2 text-sm ${
                    msg.username === username 
                      ? 'bg-pink-500 border-pink-300 text-white' 
                      : 'bg-pink-50 border-pink-100 text-pink-600'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form 
              onSubmit={sendMessage}
              className="p-4 bg-pink-50/50 border-t-2 border-pink-100 flex gap-2"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-white border-2 border-pink-100 px-4 py-2 text-xs text-pink-900 focus:outline-none focus:border-pink-500 transition-all placeholder:text-pink-100"
              />
              <button
                type="submit"
                className="w-10 h-10 bg-pink-600 border-2 border-black flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-[2px_2px_0_0_#4A0030]"
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



