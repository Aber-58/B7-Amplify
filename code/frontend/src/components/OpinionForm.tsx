import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { pop, drawIn } from '../lib/motion';

interface OpinionFormProps {
  onSubmit: (opinion: string, rating: number) => void;
  topicTitle?: string;
  username?: string;
  loading?: boolean;
}

export const OpinionForm: React.FC<OpinionFormProps> = ({
  onSubmit,
  topicTitle,
  username,
  loading = false,
}) => {
  const [opinion, setOpinion] = useState('');
  const [rating, setRating] = useState(5);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!opinion.trim()) {
      alert('Please enter your opinion before submitting.');
      return;
    }

    if (rating < 1 || rating > 10) {
      alert('Please enter a rating between 1 and 10.');
      return;
    }

    onSubmit(opinion, rating);
    setShowSuccess(true);
    
    // Reset form after a short delay
    setTimeout(() => {
      setOpinion('');
      setRating(5);
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {topicTitle && (
        <div className="text-center mb-8">
          <p className="text-lg text-ink/60 mb-2">You are participating in:</p>
          <h1 className="text-3xl font-display font-bold text-ink">{topicTitle}</h1>
        </div>
      )}

      {username && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-4 mb-6 border border-ink/10">
          <p className="text-sm text-ink/70">
            Filling out poll as: <span className="font-medium text-ink">{username}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-card p-6 border border-ink/10">
        <div className="space-y-6">
          {/* Opinion textarea with floating label */}
          <div className="relative">
            <motion.textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(opinion.length > 0)}
              placeholder=" "
              rows={4}
              className="w-full px-4 py-3 border-2 border-ink/20 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors resize-none font-scribble text-lg bg-paper/50"
              disabled={loading || showSuccess}
            />
            <motion.label
              initial={false}
              animate={{
                y: isFocused || opinion.length > 0 ? -32 : 0,
                x: isFocused || opinion.length > 0 ? 8 : 16,
                scale: isFocused || opinion.length > 0 ? 0.85 : 1,
                color: isFocused || opinion.length > 0 ? '#6C63FF' : '#6B7280',
              }}
              transition={{ duration: 0.2 }}
              className="absolute left-4 top-3 font-scribble text-lg pointer-events-none origin-left"
            >
              Your Opinion
            </motion.label>
          </div>

          {/* Rating input */}
          <div>
            <label className="block text-sm font-display font-medium text-ink/70 mb-2">
              Rating (1-10)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="flex-1 h-2 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-accent"
                disabled={loading || showSuccess}
              />
              <span className="text-2xl font-scribble text-accent w-12 text-center">
                {rating}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading || showSuccess}
            whileHover={!loading && !showSuccess ? { scale: 1.02 } : {}}
            whileTap={!loading && !showSuccess ? { scale: 0.98 } : {}}
            className="w-full bg-accent text-white py-3 px-4 rounded-lg font-display font-medium transition-all relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showSuccess ? (
              <motion.div
                initial="initial"
                animate="animate"
                variants={drawIn}
                className="flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
                <span>Submitted!</span>
              </motion.div>
            ) : (
              <span>{loading ? 'Submitting...' : 'Submit'}</span>
            )}
            
            {/* Ink fill effect on hover */}
            <motion.div
              className="absolute inset-0 bg-ink opacity-0"
              whileHover={{ opacity: 0.1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </div>
      </form>
    </div>
  );
};