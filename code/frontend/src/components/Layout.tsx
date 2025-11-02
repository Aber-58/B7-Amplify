import React from 'react';
import { SentimentLegend } from './SentimentLegend';
import { useClusterStore } from '../store/clusterStore';
import { getPaperTextureStyle } from '../lib/paper-texture';

interface LayoutProps {
  children: React.ReactNode;
  showLegend?: boolean;
  showHeader?: boolean;
}

export function Layout({ children, showLegend = true, showHeader = false }: LayoutProps) {
  const { muted, toggleMute, badges } = useClusterStore();
  const paperTexture = getPaperTextureStyle();

  return (
    <div className="min-h-screen" style={paperTexture}>
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-ink/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-scribble text-2xl text-ink font-bold">
              consensus.io
            </h1>
            <div className="flex items-center gap-4">
              {badges.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display text-ink/70">Badges:</span>
                  <span className="font-scribble text-accent text-lg">
                    {badges.length}
                  </span>
                </div>
              )}
              <button
                onClick={toggleMute}
                className="px-3 py-1.5 rounded-lg border-2 border-ink/20 hover:bg-ink/5 transition-colors font-display text-sm"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </header>
      )}
      
      <main className="relative">
        {children}
      </main>

      {showLegend && <SentimentLegend />}
    </div>
  );
}

