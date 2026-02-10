
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DocumentState {
  name: string;
  content: string;
  isProcessing: boolean;
  pageCount: number;
}

export enum TabType {
  PROJECT_BLUEPRINT = 'PROJECT_BLUEPRINT',
  LIVE_SOLVER = 'LIVE_SOLVER'
}

export enum AppStage {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD'
}
