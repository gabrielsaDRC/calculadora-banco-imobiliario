import React, { useState } from 'react';
import { Plus, Settings, Play } from 'lucide-react';
import { createSession, updateSessionButtons } from '../lib/database';
import type { Session } from '../types';

interface SessionCreatorProps {
  onSessionCreated: (session: Session, hostPlayerId: string) => void;
}

export const SessionCreator: React.FC<SessionCreatorProps> = ({ onSessionCreated }) => {
  const [hostName, setHostName] = useState('');
  const [hostBalance, setHostBalance] = useState(15000);
  const [loading, setLoading] = useState(false);
  const [showCustomButtons, setShowCustomButtons] = useState(false);
  const [defaultButtons, setDefaultButtons] = useState([100, 200, 500, 1000, 2000, 5000]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;

    setLoading(true);
    try {
      const { session, player } = await createSession(hostName.trim(), defaultButtons, hostBalance);
      onSessionCreated(session, player.id);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      alert('Erro ao criar sessão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateButtonValue = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newButtons = [...defaultButtons];
    newButtons[index] = numValue;
    setDefaultButtons(newButtons);
  };

  const addButton = () => {
    if (defaultButtons.length < 8) {
      setDefaultButtons([...defaultButtons, 100]);
    }
  };

  const removeButton = (index: number) => {
    if (defaultButtons.length > 1) {
      setDefaultButtons(defaultButtons.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-5xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">Banco Imobiliário</h1>
          <p className="text-gray-700 font-medium">Calculadora Digital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="hostName" className="block text-sm font-medium text-gray-700 mb-2">
              Seu Nome (Host)
            </label>
            <input
              id="hostName"
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="hostBalance" className="block text-sm font-medium text-gray-700 mb-2">
              Seu Saldo Inicial
            </label>
            <input
              id="hostBalance"
              type="number"
              value={hostBalance}
              onChange={(e) => setHostBalance(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowCustomButtons(!showCustomButtons)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3"
            >
              <Settings size={16} />
              Personalizar Botões de Valores
            </button>

            {showCustomButtons && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Configure os valores dos botões de transação rápida:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {defaultButtons.map((value, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => updateButtonValue(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        min="1"
                      />
                      {defaultButtons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {defaultButtons.length < 8 && (
                  <button
                    type="button"
                    onClick={addButton}
                    className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                  >
                    <Plus size={14} />
                    Adicionar Botão
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !hostName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? (
              'Criando Sessão...'
            ) : (
              <>
                <Play size={20} />
                Criar Sessão
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};