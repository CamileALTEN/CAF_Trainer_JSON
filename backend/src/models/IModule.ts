/* backend/src/models/IModule.ts */

export interface ILink  { label: string; url: string; }

export interface IImage {
src:   string;
width?: number;
align?: 'left' | 'center' | 'right';
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  correct: number[]; // indexes of good answers
}

export interface IQuiz {
  enabled: boolean;
  questions: IQuizQuestion[];
}

export interface IItem  {
id:        string;
title:     string;
subtitle?: string;
content:   string;

links:     ILink[];
images:    IImage[];
videos:    string[];
  profiles:  string[];
  enabled:   boolean;

  validationRequired?: boolean;
  validationType?: 'auto' | 'manual';

  quiz?: IQuiz;

  children?: IItem[];
}

export interface IModule {
id:      string;
title:   string;
summary: string;
enabled: boolean;
items:   IItem[];
}