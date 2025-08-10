import React, { useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import { getSessionByCode, createPlayer } from '../lib/database';
import type { Session } from '../types';

interface SessionJoinerProps {
  onSessionJoined: (session: Session, playerId: string) => void;
  onBack: () => void;
}

export const SessionJoiner: React.FC<SessionJoinerProps> = ({ onSessionJoined, onBack }) => {
  const [sessionCode, setSessionCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || !playerName.trim()) return;

    setLoading(true);
    try {
      const session = await getSessionByCode(sessionCode.trim().toUpperCase());
      const player = await createPlayer(session.id, playerName.trim());
      onSessionJoined(session, player.id);
    } catch (error) {
      console.error('Erro ao entrar na sessão:', error);
      alert('Sessão não encontrada ou inválida. Verifique o código e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors mb-6 hover:bg-gray-100 px-3 py-2 rounded-lg"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-5xl">👥</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">Entrar na Sessão</h1>
          <p className="text-gray-700">Digite o código da sessão para participar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700 mb-2">
              Código da Sessão
            </label>
            <input
              id="sessionCode"
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="Ex: ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              maxLength={6}
              required
            />
          </div>

          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Seu Nome
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !sessionCode.trim() || !playerName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? (
              'Entrando...'
            ) : (
              <>
                <Users size={20} />
                Entrar na Sessão
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};