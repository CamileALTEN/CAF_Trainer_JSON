export interface IAlertConfig {
  text: string;
  url: string;
  frequency: number; // seconds
  active: boolean;
  lastAck?: string; // ISO date when banner was deactivated
}

export interface IAlertAction {
  id: string;
  date: string;
  items: string[];
  user: string;
  comment?: string;
}
