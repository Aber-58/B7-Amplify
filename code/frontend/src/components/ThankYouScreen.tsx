import React from 'react';
import { motion } from 'framer-motion';

interface ThankYouScreenProps {
  winner: {
    heading: string;
    cluster_id: number;
    totalEngagement: number;
    opinionsCount: number;
    messagesCount: number;
  } | null;
  onClose: () => void;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ winner, onClose }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white shadow-2xl overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-6 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Close button */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink/10 hover:bg-ink/20 flex items-center justify-center transition-all"
          >
            <span className="text-xl">×</span>
          </motion.button>
          
          {/* Header with trophy */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-3"
            >
              🏆
            </motion.div>
            <h2 className="font-display font-bold text-3xl text-ink mb-2">
              Round Complete! 🎉
            </h2>
            <p className="font-display text-lg text-ink/70">
              Thank you for participating!
            </p>
          </div>
          
          {/* Winner cluster */}
          {winner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-xl p-4 mb-6 border-2 border-purple-200"
            >
              <p className="font-display text-lg text-ink/70 mb-2 text-center">
                The winning cluster:
              </p>
              <h3 className="font-display font-bold text-3xl text-purple-700 mb-4 text-center">
                {winner.heading}
              </h3>
              <div className="flex items-center justify-center gap-6 text-sm text-ink/60 font-display flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span><span className="font-semibold">{winner.totalEngagement}</span> engagement</span>
                </div>
                <div>•</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💭</span>
                  <span><span className="font-semibold">{winner.opinionsCount}</span> opinions</span>
                </div>
                <div>•</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  <span><span className="font-semibold">{winner.messagesCount}</span> messages</span>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Project introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-ink/10"
          >
            <h3 className="font-display font-bold text-xl text-ink mb-2 text-center">
              About Amplify.io
            </h3>
            <p className="font-display text-sm text-ink/70 leading-relaxed mb-3 text-center">
              Amplify.io is a collective intelligence platform that uses advanced AI and machine learning to cluster similar opinions and find consensus. 
              Your voice helps shape meaningful discussions and discover common ground.
            </p>
            
            {/* Technologies */}
            <div className="mt-4 pt-4 border-t border-ink/10">
              <p className="font-display font-semibold text-xs text-ink/60 mb-2 text-center">
                Built with cutting-edge technologies:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
              'React', 'TypeScript', 'Flask', 'Python', 'AI/ML', 
              'HDBSCAN', 'Sentence Transformers', 'D3.js', 'Framer Motion',
              'WebSocket', 'SQLite', 'Mistral AI', 'NLP', 'Sentiment Analysis',
              'Clustering Algorithms', 'Vector Embeddings', 'RESTful API'
            ].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-xs font-display font-medium text-purple-700 border border-purple-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* GitHub link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <motion.a
              href="https://github.com/yourusername/amplify.io"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-display font-semibold shadow-lg hover:shadow-xl transition-all mb-3 text-sm"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>View on GitHub</span>
            </motion.a>
            <p className="font-display text-sm text-ink/50 mt-2">
              Interested in the algorithms and implementation? Check out our code!
            </p>
          </motion.div>
          
          {/* Close button */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 w-full px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-display font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
          >
            Continue Viewing
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

