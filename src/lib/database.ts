import { supabase } from './supabase';
import type { Session, Player, Transaction } from '../types';

// Session operations
export const createSession = async (hostName: string, defaultButtons: number[] = [100, 200, 500, 1000, 2000, 5000], hostBalance: number = 15000) => {
  const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data: session, error: sessionError } = await supabase
    .from('ngl-games-banco-imobiliario-sessions')
    .insert({
      session_code: sessionCode,
      default_buttons: defaultButtons
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // Create host player
  const { data: player, error: playerError } = await supabase
    .from('ngl-games-banco-imobiliario-players')
    .insert({
      session_id: session.id,
      name: hostName,
      is_host: true,
      balance: hostBalance,
      initial_balance: hostBalance
    })
    .select()
    .single();

  if (playerError) throw playerError;

  // Update session with host_id
  await supabase
    .from('ngl-games-banco-imobiliario-sessions')
    .update({ host_id: player.id })
    .eq('id', session.id);

  return { session, player };
};

export const getSessionByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-sessions')
    .select('*')
    .eq('session_code', code)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
};

export const deleteSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('ngl-games-banco-imobiliario-sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
};

export const updateSessionButtons = async (sessionId: string, buttons: number[]) => {
  const { error } = await supabase
    .from('ngl-games-banco-imobiliario-sessions')
    .update({ default_buttons: buttons })
    .eq('id', sessionId);

  if (error) throw error;
};

export const getSessionDetailsById = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-sessions')
    .select('default_buttons')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
};
// Player operations
export const createPlayer = async (sessionId: string, name: string, initialBalance: number = 15000) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-players')
    .insert({
      session_id: sessionId,
      name,
      balance: initialBalance,
      initial_balance: initialBalance
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSessionPlayers = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-players')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const updatePlayerBalance = async (playerId: string, newBalance: number) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-players')
    .update({ balance: newBalance })
    .eq('id', playerId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePlayer = async (playerId: string) => {
  const { error } = await supabase
    .from('ngl-games-banco-imobiliario-players')
    .delete()
    .eq('id', playerId);

  if (error) throw error;
};

export const resetAllPlayersBalance = async (sessionId: string) => {
  // Get all players in the session
  const { data: players, error: fetchError } = await supabase
    .from('ngl-games-banco-imobiliario-players')
    .select('id, initial_balance')
    .eq('session_id', sessionId);

  if (fetchError) throw fetchError;

  // Update each player's balance to their initial balance
  const updates = players.map(player => 
    supabase
      .from('ngl-games-banco-imobiliario-players')
      .update({ balance: player.initial_balance })
      .eq('id', player.id)
  );

  const results = await Promise.all(updates);
  const error = results.find(result => result.error)?.error;

  if (error) throw error;
};

// Transaction operations
export const createTransaction = async (
  sessionId: string,
  fromPlayerId: string | null,
  toPlayerId: string | null,
  amount: number,
  previousBalance: number,
  newBalance: number,
  description: string
) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-transactions')
    .insert({
      session_id: sessionId,
      from_player_id: fromPlayerId,
      to_player_id: toPlayerId,
      amount,
      previous_balance: previousBalance,
      new_balance: newBalance,
      description
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSessionTransactions = async (sessionId: string, limit: number = 50) => {
  const { data, error } = await supabase
    .from('ngl-games-banco-imobiliario-transactions')
    .select(`
      *,
      from_player:ngl-games-banco-imobiliario-players!from_player_id(name),
      to_player:ngl-games-banco-imobiliario-players!to_player_id(name)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  
  return data.map(transaction => ({
    ...transaction,
    from_player_name: transaction.from_player?.name,
    to_player_name: transaction.to_player?.name
  }));
};