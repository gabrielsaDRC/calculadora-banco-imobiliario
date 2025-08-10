import React from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';
import type { TransactionWithNames } from '../types';

interface TransactionHistoryProps {
  transactions: TransactionWithNames[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock size={48} className="mx-auto mb-4 opacity-50" />
        <p>Nenhuma transação realizada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {transactions.map((transaction) => {
        const isFromBank = !transaction.from_player_id;
        const isToBank = !transaction.to_player_id;
        const isPositive = transaction.amount > 0;

        return (
          <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-gray-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  isFromBank || isToBank 
                    ? 'bg-blue-100 text-blue-600' 
                    : isPositive 
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                }`}>
                  {isFromBank || isToBank ? (
                    <Building2 size={16} />
                  ) : isPositive ? (
                    <ArrowDownLeft size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {transaction.description}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {isFromBank && (
                      <span>Do Banco → {transaction.to_player_name}</span>
                    )}
                    {isToBank && (
                      <span>{transaction.from_player_name} → Banco</span>
                    )}
                    {!isFromBank && !isToBank && (
                      <span>{transaction.from_player_name} → {transaction.to_player_name}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateTime(transaction.created_at)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(transaction.previous_balance)} → {formatCurrency(transaction.new_balance)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};