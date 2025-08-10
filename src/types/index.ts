export interface Session {
  id: string;
  session_code: string;
  host_id?: string;
  is_active: boolean;
  default_buttons: number[];
  created_at: string;
}

export interface Player {
  id: string;
  session_id: string;
  name: string;
  balance: number;
  initial_balance: number;
  is_host: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  session_id: string;
  from_player_id?: string;
  to_player_id?: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  description: string;
  created_at: string;
}

export interface TransactionWithNames extends Transaction {
  from_player_name?: string;
  to_player_name?: string;
}