import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { pop } from '../lib/motion';

interface QRBlockProps {
  value: string;
  size?: number;
  onClick?: () => void;
}

export const QRBlock: React.FC<QRBlockProps> = ({ value, size = 200, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="relative cursor-pointer inline-block"
    >
      <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-ink/5">
        <QRCode
          value={value}
          size={size}
          level="H"
          className="mx-auto"
          style={{ 
            height: "auto",
            maxWidth: "100%",
            width: "100%",
            display: "block"
          }}
          viewBox={`0 0 ${size} ${size}`}
        />
      </div>

      {/* Bouncing "Scan me" arrow */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-2"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              className="flex items-center gap-2 text-accent font-scribble text-lg"
            >
              <span>Scan me</span>
              <motion.svg
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </motion.svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};