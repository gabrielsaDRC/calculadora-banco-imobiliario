import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import type { Player, TransactionWithNames } from '../types';

interface LeadershipDashboardProps {
  players: Player[];
  transactions: TransactionWithNames[];
}

export const LeadershipDashboard: React.FC<LeadershipDashboardProps> = ({ 
  players, 
  transactions 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Cores para os gráficos
  const playerColors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ];

  // Calcular evolução dos saldos ao longo do tempo
  const balanceEvolution = useMemo(() => {
    const playerBalances: { [key: string]: number } = {};
    players.forEach(player => {
      playerBalances[player.id] = player.initial_balance;
    });

    const evolution = [
      {
        time: 'Início',
        timestamp: new Date().getTime() - (transactions.length + 1) * 60000,
        ...Object.fromEntries(
          players.map(player => [player.name, player.initial_balance])
        )
      }
    ];

    transactions
      .slice()
      .reverse()
      .forEach((transaction, index) => {
        // Atualizar saldos baseado na transação
        if (transaction.to_player_id && players.find(p => p.id === transaction.to_player_id)) {
          const player = players.find(p => p.id === transaction.to_player_id);
          if (player) {
            playerBalances[player.id] = transaction.new_balance;
          }
        }
        
        if (transaction.from_player_id && players.find(p => p.id === transaction.from_player_id)) {
          const player = players.find(p => p.id === transaction.from_player_id);
          if (player) {
            // Para transações de saída, calcular o saldo anterior
            const previousBalance = transaction.previous_balance;
            playerBalances[player.id] = previousBalance - transaction.amount;
          }
        }

        evolution.push({
          time: `T${index + 1}`,
          timestamp: new Date(transaction.created_at).getTime(),
          ...Object.fromEntries(
            players.map(player => [player.name, playerBalances[player.id] || player.balance])
          )
        });
      });

    return evolution;
  }, [players, transactions]);

  // Calcular estatísticas de liderança
  const leadershipStats = useMemo(() => {
    const stats: { [key: string]: { timesLeader: number } } = {};
    
    players.forEach(player => {
      stats[player.name] = { timesLeader: 0 };
    });

    let currentLeader = '';

    balanceEvolution.forEach((point, index) => {
      const playerBalances = players.map(player => ({
        name: player.name,
        balance: point[player.name] as number || 0
      }));

      const leader = playerBalances.reduce((prev, current) => 
        current.balance > prev.balance ? current : prev
      );

      if (leader.name !== currentLeader) {
        currentLeader = leader.name;
        stats[leader.name].timesLeader += 1;
      }
    });

    return Object.entries(stats).map(([name, data], index) => ({
      name,
      timesLeader: data.timesLeader,
      color: playerColors[index % playerColors.length]
    }));
  }, [balanceEvolution, players]);

  // Ranking atual
  const currentRanking = players
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .map((player, index) => ({
      ...player,
      position: index + 1,
      color: playerColors[players.findIndex(p => p.id === player.id) % playerColors.length]
    }));

  return (
    <div className="space-y-6">
      {/* Ranking Atual */}
      <div className="bg-gradient-to-br from-white via-yellow-50 to-orange-50 rounded-2xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
            <Trophy className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            🏆 Ranking Atual
          </h3>
        </div>
        
        <div className="space-y-3">
          {currentRanking.map((player) => (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                player.position === 1 
                  ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 shadow-lg' 
                  : 'bg-white/70 hover:bg-white/90'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  player.position === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  player.position === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                  player.position === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}>
                  {player.position}
                </div>
                <div>
                  <div className="font-bold text-gray-800 flex items-center gap-2">
                    {player.name}
                    {player.is_host && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">HOST</span>}
                    {player.position === 1 && <span className="text-lg">👑</span>}
                  </div>
                  <div className="text-sm text-gray-600">
                    Posição #{player.position}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-800">
                  {formatCurrency(player.balance)}
                </div>
                <div className="text-sm text-gray-600">
                  {player.balance >= player.initial_balance ? '+' : ''}
                  {formatCurrency(player.balance - player.initial_balance)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evolução dos Saldos */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-green-50 rounded-2xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-xl">
            <TrendingUp className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            📈 Evolução dos Saldos
          </h3>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              {players.map((player, index) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={playerColors[index % playerColors.length]}
                  strokeWidth={3}
                  dot={{ fill: playerColors[index % playerColors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: playerColors[index % playerColors.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estatísticas de Liderança */}

      {/* Vezes como Líder */}
      <div className="bg-gradient-to-br from-white via-green-50 to-blue-50 rounded-2xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-xl">
            <Target className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎯 Vezes como Líder
          </h3>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadershipStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Vezes como líder']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="timesLeader" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumo Estatístico */}
      <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-2xl p-6 shadow-xl border border-white/50">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          📊 Resumo da Partida
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{transactions.length}</div>
            <div className="text-sm text-gray-600">Transações</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{players.length}</div>
            <div className="text-sm text-gray-600">Jogadores</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Math.max(...players.map(p => p.balance)))}
            </div>
            <div className="text-sm text-gray-600">Maior Saldo</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(Math.min(...players.map(p => p.balance)))}
            </div>
            <div className="text-sm text-gray-600">Menor Saldo</div>
          </div>
        </div>
      </div>
    </div>
  );
};