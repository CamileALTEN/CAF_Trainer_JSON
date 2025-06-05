import axios from 'axios';

export interface IAnalytics {
  counts: {
    accounts: number;
    modules: number;
    items: number;
  };
  visitors: {
    today: number;
    week: number;
    month: { count: number; label: string };
  };
  sessions: {
    caf: number;
    manager: number;
    avgDurationCaf: number;
    avgDurationManager: number;
    byHour: { hour: string; avg: number }[];
  };
  favorites: { itemId: string; title: string; count: number }[];
  sites: { site: string; count: number }[];
}

export const getAnalytics = async (): Promise<IAnalytics> =>
  (await axios.get('/api/analytics')).data;
