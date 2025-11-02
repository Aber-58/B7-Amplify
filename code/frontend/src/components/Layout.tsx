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
  const { badges } = useClusterStore();
  const paperTexture = getPaperTextureStyle();

  return (
    <div className="min-h-screen" style={paperTexture}>
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-ink/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-scribble text-2xl text-ink font-bold">
              amplify.io
            </h1>
            <div className="flex items-center gap-4">
              {badges.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 shadow-md">
                  <span className="text-sm font-display text-white font-semibold">🏆</span>
                  <span className="text-sm font-display text-white font-semibold">{badges.length} Badge{badges.length !== 1 ? 's' : ''}</span>
                </div>
              )}
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

