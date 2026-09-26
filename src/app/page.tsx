'use client';

import React from 'react';
import ChessBoard from '@/components/ChessBoard';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-amber-500 selection:text-slate-950">
      <ChessBoard />
    </main>
  );
}
