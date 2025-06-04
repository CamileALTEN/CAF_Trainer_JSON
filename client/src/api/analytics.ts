import axios from 'axios';

export interface IAnalytics {
  traffic: {
    uniqueVisitorsToday: number;
    uniqueVisitorsWeek: number;
    uniqueVisitorsMonth: number;
    pageViews: number;
    bounceRate: number;
    bounceDiff: number;
    avgSessionDuration: string;
    sessionsPerUser: number;
    peakHours: { hour: string; sessions: number }[];
  };
  behavior: {
    topPages: { page: string; views: number }[];
    visitsByHour: { hour: string; sessions: number }[];
  };
  content: {
    topContents: { content: string; views: number }[];
    favorites: { content: string; count: number }[];
  };
  session: {
    avgDuration: string;
    trend: number[];
  };
  tickets: {
    weeks: { week: string; created: number; resolved: number }[];
  };
  accounts: {
    bySite: { site: string; count: number }[];
  };
}

export const getAnalytics = async (): Promise<IAnalytics> =>
  (await axios.get('/api/analytics')).data;
