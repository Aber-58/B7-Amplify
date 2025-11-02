import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  activeUsers?: number;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentUsername,
  activeUsers,
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

  // Get unique authors from messages
  const uniqueAuthors = new Set(messages.map(m => m.author));
  const chatUserCount = uniqueAuthors.size || activeUsers || 0;

  return (
    <div className="flex flex-col h-full max-h-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-ink/10 overflow-hidden">
      {/* Header with user count */}
      <div className="relative bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-b border-ink/10 px-5 py-3 flex items-center justify-between overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-300 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-300 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
          >
            💬
          </motion.div>
          <h3 className="font-display font-bold text-ink text-base">Live Chat</h3>
        </div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-green-300 shadow-sm"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"
          />
          <span className="font-display text-xs font-semibold text-green-700">
            {chatUserCount} {chatUserCount === 1 ? 'active' : 'active'}
          </span>
        </motion.div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gradient-to-b from-white/80 via-white/60 to-white/40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl mb-2"
            >
              💭
            </motion.div>
            <p className="font-display text-ink/60 text-sm">No messages yet</p>
            <p className="font-scribble text-ink/40 text-xs mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const sentiment = message.sentiment ?? 0;
              const label = sentimentLabel(sentiment);
              const sentimentColor = sentimentColors[label];
              const isOwnMessage = message.author === currentUsername;

              return (
                <motion.div
                  key={`${message.author}-${index}-${message.timestamp.getTime()}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isOwnMessage ? 20 : -20, scale: 0.9 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {!isOwnMessage && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-display font-bold shadow-md"
                    >
                      {message.author.charAt(0).toUpperCase()}
                    </motion.div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 shadow-lg transition-all ${
                      isOwnMessage
                        ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 text-white rounded-tr-sm'
                        : 'bg-white/95 backdrop-blur-sm border border-ink/10 hover:border-ink/20'
                    }`}
                    style={{
                      borderColor: !isOwnMessage && message.sentiment !== undefined ? sentimentColor + '40' : undefined,
                      boxShadow: isOwnMessage 
                        ? '0 4px 12px rgba(139, 92, 246, 0.3)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-display text-xs font-semibold ${
                        isOwnMessage ? 'text-white/90' : 'text-ink/70'
                      }`}>
                        {message.author}
                      </span>
                      {message.clusterId !== undefined && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`text-xs px-2 py-0.5 rounded-full font-display font-medium ${
                            isOwnMessage
                              ? 'bg-white/20 text-white'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          Cluster {message.clusterId}
                        </motion.span>
                      )}
                    </div>
                    <p className={`font-display text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isOwnMessage ? 'text-white' : 'text-ink'
                    }`}>
                      {message.text}
                    </p>
                    {message.sentiment !== undefined && !isOwnMessage && (
                      <div className="mt-3 h-1.5 w-full rounded-full bg-ink/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((message.sentiment + 1) / 2) * 100}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: sentimentColor }}
                        />
                      </div>
                    )}
                    <div className={`text-xs mt-2 font-display ${
                      isOwnMessage ? 'text-white/70' : 'text-ink/50'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isOwnMessage && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-display font-bold shadow-md"
                    >
                      {message.author.charAt(0).toUpperCase()}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {onSendMessage && (
        <form onSubmit={handleSubmit} className="relative border-t border-ink/10 bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-purple-50/50 backdrop-blur-sm px-5 py-4">
          {/* Decorative border glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-50"></div>
          
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 px-5 py-3 border-2 border-ink/15 rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none font-display text-sm bg-white/90 backdrop-blur-sm shadow-sm transition-all placeholder:text-ink/40"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-display font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <span>Send</span>
              <motion.span
                animate={{ x: [0, 2, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ➤
              </motion.span>
            </motion.button>
          </div>
        </form>
      )}
    </div>
  );
};