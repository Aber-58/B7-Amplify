import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pop } from '../lib/motion';
import { sentimentColors, sentimentLabel } from '../lib/colors';

export interface Message {
  text: string;
  author: string;
  timestamp: Date;
  sentiment?: number;
  clusterId?: number;
}

interface ChatBoxProps {
  messages: Message[];
  onSendMessage?: (message: string) => void;
  currentUsername?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentUsername,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[400px] bg-white/80 backdrop-blur-sm rounded-lg shadow-card border border-ink/10 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((message, index) => {
            const sentiment = message.sentiment ?? 0;
            const label = sentimentLabel(sentiment);
            const sentimentColor = sentimentColors[label];
            const isOwnMessage = message.author === currentUsername;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: isOwnMessage ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 shadow-card border-2 ${
                    isOwnMessage ? 'bg-accent/10 border-accent/20' : 'bg-paper border-ink/10'
                  }`}
                  style={{
                    borderColor: message.sentiment !== undefined ? sentimentColor + '40' : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-display text-sm font-medium ${
                      isOwnMessage ? 'text-accent' : 'text-ink/70'
                    }`}>
                      {message.author}
                    </span>
                    {message.clusterId !== undefined && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs px-2 py-0.5 rounded-full bg-ink/10 text-ink/60"
                      >
                        Cluster {message.clusterId}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-ink font-scribble text-sm">{message.text}</p>
                  {message.sentiment !== undefined && (
                    <div className="mt-2 h-1 w-full rounded-full bg-ink/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((message.sentiment + 1) / 2) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: sentimentColor }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-ink/50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {onSendMessage && (
        <form onSubmit={handleSubmit} className="border-t border-ink/10 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border-2 border-ink/20 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none font-scribble text-sm bg-paper/50"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-accent text-white rounded-lg font-display font-medium hover:bg-accent/90 transition-colors"
            >
              Send
            </motion.button>
          </div>
        </form>
      )}
    </div>
  );
};