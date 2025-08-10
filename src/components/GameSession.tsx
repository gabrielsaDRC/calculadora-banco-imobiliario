import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  RotateCcw, 
  LogOut, 
  Copy, 
  Check, 
  DollarSign,
  History,
  Settings,
  ArrowLeftRight
} from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { TransactionHistory } from './TransactionHistory';
import {
  getSessionPlayers,
  createPlayer,
  updatePlayerBalance,
  deletePlayer,
  resetAllPlayersBalance,
  deleteSession,
  createTransaction,
  getSessionTransactions,
  updateSessionButtons,
  getSessionDetailsById
} from '../lib/database';
import type { Session, Player, TransactionWithNames } from '../types';

interface GameSessionProps {
  session: Session;
  currentPlayerId: string;
  onLeave: () => void;
}

export const GameSession: React.FC<GameSessionProps> = ({ session, currentPlayerId, onLeave }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modal states
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Form states
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerBalance, setNewPlayerBalance] = useState(15000);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [sessionButtons, setSessionButtons] = useState<number[]>(session.default_buttons);
  const [tempCustomButtons, setTempCustomButtons] = useState<number[]>(session.default_buttons);

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.is_host || false;

  // Dashboard calculations
  const totalValue = players.reduce((sum, player) => sum + player.balance, 0);
  const richestPlayer = players.reduce((richest, player) => 
    player.balance > richest.balance ? player : richest, players[0] || { balance: 0, name: '' });
  const poorestPlayer = players.reduce((poorest, player) => 
    player.balance < poorest.balance ? player : poorest, players[0] || { balance: 0, name: '' });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [session.id]);

  // Update custom buttons when session data changes
  useEffect(() => {
    setSessionButtons(session.default_buttons);
    setTempCustomButtons(session.default_buttons);
  }, [session.default_buttons]);

  const loadData = async () => {
    try {
      const [playersData, transactionsData] = await Promise.all([
        getSessionPlayers(session.id),
        getSessionTransactions(session.id, 50)
      ]);
      setPlayers(playersData);
      setTransactions(transactionsData);
      
      // Update session data to get latest button configuration
      const sessionData = await getSessionDetailsById(session.id);
      
      if (sessionData) {
        setSessionButtons(sessionData.default_buttons);
        setTempCustomButtons(sessionData.default_buttons);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const copySessionCode = async () => {
    await navigator.clipboard.writeText(session.session_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      await createPlayer(session.id, newPlayerName.trim(), newPlayerBalance);
      setNewPlayerName('');
      setNewPlayerBalance(15000);
      setShowAddPlayer(false);
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar jogador:', error);
      alert('Erro ao adicionar jogador. Tente novamente.');
    }
  };

  const handleQuickTransfer = async (playerId: string, amount: number, isFromBank: boolean = false) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const newBalance = player.balance + amount;
      if (newBalance < 0) {
        alert('Saldo insuficiente para esta transação.');
        return;
      }

      await updatePlayerBalance(playerId, newBalance);
      
      const description = isFromBank 
        ? `Recebeu ${formatCurrency(amount)} do Banco`
        : `Ajuste de saldo: ${amount > 0 ? '+' : ''}${formatCurrency(amount)}`;

      await createTransaction(
        session.id,
        isFromBank ? null : playerId,
        playerId,
        amount,
        player.balance,
        newBalance,
        description
      );

      loadData();
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      alert('Erro ao realizar transferência. Tente novamente.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !transferAmount) return;

    const amount = parseInt(transferAmount);
    if (amount <= 0) return;

    try {
      let fromPlayer: Player | undefined;
      let toPlayer: Player | undefined;

      if (transferFrom !== 'bank') {
        fromPlayer = players.find(p => p.id === transferFrom);
        if (!fromPlayer || fromPlayer.balance < amount) {
          alert('Saldo insuficiente para esta transferência.');
          return;
        }
      }

      if (transferTo !== 'bank') {
        toPlayer = players.find(p => p.id === transferTo);
        if (!toPlayer) return;
      }

      // Update balances
      if (fromPlayer) {
        await updatePlayerBalance(fromPlayer.id, fromPlayer.balance - amount);
      }
      if (toPlayer) {
        await updatePlayerBalance(toPlayer.id, toPlayer.balance + amount);
      }

      // Create transaction record
      const description = transferDescription.trim() || 
        `Transferência de ${fromPlayer?.name || 'Banco'} para ${toPlayer?.name || 'Banco'}`;

      if (toPlayer) {
        await createTransaction(
          session.id,
          fromPlayer?.id || null,
          toPlayer.id,
          amount,
          toPlayer.balance,
          toPlayer.balance + amount,
          description
        );
      }

      if (fromPlayer && transferTo === 'bank') {
        await createTransaction(
          session.id,
          fromPlayer.id,
          null,
          -amount,
          fromPlayer.balance,
          fromPlayer.balance - amount,
          description
        );
      }

      setTransferFrom('');
      setTransferTo('');
      setTransferAmount('');
      setTransferDescription('');
      setShowTransfer(false);
      loadData();
    } catch (error) {
      console.error('Erro ao realizar transferência:', error);
      alert('Erro ao realizar transferência. Tente novamente.');
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Jogador',
      message: `Tem certeza que deseja remover o jogador "${player.name}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await deletePlayer(player.id);
          setConfirmModal({ ...confirmModal, isOpen: false });
          loadData();
        } catch (error) {
          console.error('Erro ao remover jogador:', error);
          alert('Erro ao remover jogador. Tente novamente.');
        }
      },
      type: 'danger'
    });
  };

  const handleResetBalances = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Resetar Saldos',
      message: 'Tem certeza que deseja resetar todos os saldos para os valores iniciais? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await resetAllPlayersBalance(session.id);
          setConfirmModal({ ...confirmModal, isOpen: false });
          loadData();
        } catch (error) {
          console.error('Erro ao resetar saldos:', error);
          alert('Erro ao resetar saldos. Tente novamente.');
        }
      },
      type: 'warning'
    });
  };

  const handleEndSession = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Encerrar Sessão',
      message: 'Tem certeza que deseja encerrar esta sessão? Todos os dados serão perdidos permanentemente.',
      onConfirm: async () => {
        try {
          await deleteSession(session.id);
          setConfirmModal({ ...confirmModal, isOpen: false });
          onLeave();
        } catch (error) {
          console.error('Erro ao encerrar sessão:', error);
          alert('Erro ao encerrar sessão. Tente novamente.');
        }
      },
      type: 'danger'
    });
  };

  const handleUpdateButtons = async () => {
    try {
      await updateSessionButtons(session.id, tempCustomButtons);
      // Update local session object
      session.default_buttons = tempCustomButtons;
      setSessionButtons(tempCustomButtons);
      setShowSettings(false);
      // Reload data to refresh the UI
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar botões:', error);
      alert('Erro ao atualizar botões. Tente novamente.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">🏠 Carregando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-green-700 shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">🏠 Banco Imobiliário</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-green-100">Código da sessão:</span>
                <button
                  onClick={copySessionCode}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-mono transition-all duration-300 text-white border border-white/20"
                >
                  {session.session_code}
                  {copied ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm"
              >
                <History size={18} />
                <span className="hidden sm:inline">Histórico</span>
              </button>
              {isHost && (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm"
                  >
                    <Settings size={18} />
                    <span className="hidden sm:inline">Config</span>
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex items-center gap-2 px-3 py-2 text-red-200 hover:bg-red-500/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-red-300/30 text-sm"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Encerrar</span>
                  </button>
                </>
              )}
              {!isHost && (
                <button
                  onClick={onLeave}
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        <div className="bg-gradient-to-br from-white via-blue-50 to-green-50 rounded-2xl shadow-2xl p-8 mb-8 border border-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold">📊 Dashboard da Partida</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            <div className="text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl sm:text-4xl font-bold mb-2">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-blue-100 font-medium text-sm sm:text-base">💰 Valor Total em Jogo</div>
            </div>
            <div className="text-center bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-base sm:text-lg font-bold mb-1">
                {richestPlayer?.name || 'N/A'}
              </div>
              <div className="text-xl sm:text-2xl font-bold mb-2">
                {richestPlayer ? formatCurrency(richestPlayer.balance) : 'R$ 0,00'}
              </div>
              <div className="text-green-100 font-medium text-sm sm:text-base">👑 Jogador Mais Rico</div>
            </div>
            <div className="text-center bg-gradient-to-br from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="text-base sm:text-lg font-bold mb-1">
                {poorestPlayer?.name || 'N/A'}
              </div>
              <div className="text-xl sm:text-2xl font-bold mb-2">
                {poorestPlayer ? formatCurrency(poorestPlayer.balance) : 'R$ 0,00'}
              </div>
              <div className="text-red-100 font-medium text-sm sm:text-base">📉 Jogador Mais Pobre</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
          {isHost && (
            <button
              onClick={() => setShowAddPlayer(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <Plus size={18} />
              <span className="hidden xs:inline">Adicionar</span> Jogador
            </button>
          )}
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            <ArrowLeftRight size={18} />
            Transferência
          </button>
          {isHost && (
            <button
              onClick={handleResetBalances}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <RotateCcw size={18} />
              <span className="hidden xs:inline">Resetar</span> Saldos
            </button>
          )}
        </div>

        {/* Players Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <div key={player.id} className="bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-2xl shadow-xl p-4 sm:p-6 border border-white/50 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                    {player.name}
                    {player.is_host && <span className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs whitespace-nowrap">👑 HOST</span>}
                  </h3>
                  <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-2">
                    {formatCurrency(player.balance)}
                  </p>
                </div>
                {isHost && !player.is_host && (
                  <button
                    onClick={() => handleDeletePlayer(player)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg p-2 transition-all duration-300"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-600 bg-green-100 px-3 py-1 rounded-full">💰 Receber do Banco</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sessionButtons.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickTransfer(player.id, amount, true)}
                      className="bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-800 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                      +{formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-600 bg-red-100 px-3 py-1 rounded-full">💸 Pagar</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sessionButtons.map((amount) => (
                    <button
                      key={-amount}
                      onClick={() => handleQuickTransfer(player.id, -amount)}
                      className="bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-800 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={player.balance < amount}
                    >
                      -{formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          onClick={() => setShowTransfer(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110"
        >
          <ArrowLeftRight size={24} />
        </button>
      </div>

      {/* Add Player Modal */}
      <Modal isOpen={showAddPlayer} onClose={() => setShowAddPlayer(false)} title="Adicionar Jogador">
        <form onSubmit={handleAddPlayer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Jogador
            </label>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Digite o nome"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saldo Inicial
            </label>
            <input
              type="number"
              value={newPlayerBalance}
              onChange={(e) => setNewPlayerBalance(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              min="0"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowAddPlayer(false)}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-base"
            >
              Adicionar
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Realizar Transferência">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              De:
            </label>
            <select
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              <option value="">Selecionar origem</option>
              <option value="bank">🏦 Banco</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  👤 {player.name} - {formatCurrency(player.balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para:
            </label>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              <option value="">Selecionar destino</option>
              <option value="bank">🏦 Banco</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  👤 {player.name} - {formatCurrency(player.balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor
            </label>
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Digite o valor"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              min="1"
              required
            />
          </div>
          
          {/* Quick Amount Buttons for Transfer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valores Rápidos:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sessionButtons.map((amount) => (
                <button
                  key={`quick-${amount}`}
                  type="button"
                  onClick={() => setTransferAmount(amount.toString())}
                  className="bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-800 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
              placeholder="Ex: Compra de propriedade"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowTransfer(false)}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-base"
            >
              Transferir
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Histórico de Transações">
        <TransactionHistory transactions={transactions} />
      </Modal>

      {/* Settings Modal */}
      {isHost && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Configurações da Sessão">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Botões de Valores Rápidos
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tempCustomButtons.map((value, index) => (
                  <input
                    key={index}
                    type="number"
                    value={value}
                    onChange={(e) => {
                      const newButtons = [...tempCustomButtons];
                      newButtons[index] = parseInt(e.target.value) || 0;
                      setTempCustomButtons(newButtons);
                    }}
                    className="px-3 py-3 border border-gray-300 rounded-lg text-base"
                    min="1"
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => {
                  setTempCustomButtons(sessionButtons);
                  setShowSettings(false);
                }}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateButtons}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-base"
              >
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
};