import React, { useState } from 'react';
import { Play, Users } from 'lucide-react';
import { SessionCreator } from './components/SessionCreator';
import { SessionJoiner } from './components/SessionJoiner';
import { GameSession } from './components/GameSession';
import type { Session } from './types';

type AppState = 'home' | 'create' | 'join' | 'game';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('home');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

  const handleSessionCreated = (session: Session, playerId: string) => {
    setCurrentSession(session);
    setCurrentPlayerId(playerId);
    setCurrentState('game');
  };

  const handleSessionJoined = (session: Session, playerId: string) => {
    setCurrentSession(session);
    setCurrentPlayerId(playerId);
    setCurrentState('game');
  };

  const handleLeaveSession = () => {
    setCurrentSession(null);
    setCurrentPlayerId('');
    setCurrentState('home');
  };

  if (currentState === 'game' && currentSession && currentPlayerId) {
    return (
      <GameSession
        session={currentSession}
        currentPlayerId={currentPlayerId}
        onLeave={handleLeaveSession}
      />
    );
  }

  if (currentState === 'create') {
    return <SessionCreator onSessionCreated={handleSessionCreated} />;
  }

  if (currentState === 'join') {
    return (
      <SessionJoiner 
        onSessionJoined={handleSessionJoined} 
        onBack={() => setCurrentState('home')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-3xl shadow-2xl p-10 w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-6xl">🏠</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">Banco Imobiliário</h1>
          <p className="text-gray-700 font-medium">Calculadora Digital</p>
          <p className="text-sm text-gray-600 mt-2">
            Gerencie o dinheiro do jogo de forma digital
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentState('create')}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 px-6 rounded-2xl font-bold transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
          >
            <Play size={24} />
            Criar Nova Sessão
          </button>

          <button
            onClick={() => setCurrentState('join')}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 px-6 rounded-2xl font-bold transition-all duration-300 text-lg shadow-lg transform hover:scale-105"
          >
            <Users size={24} />
            Entrar em Sessão
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-300/50">
          <div className="text-sm text-gray-700 space-y-2">
            <p>• <strong>Host:</strong> Crie uma sessão e gerencie jogadores</p>
            <p>• <strong>Jogador:</strong> Entre com o código da sessão</p>
            <p>• <strong>Recursos:</strong> Transferências, histórico e mais</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;