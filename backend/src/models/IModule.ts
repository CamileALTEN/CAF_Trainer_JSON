/* backend/src/models/IModule.ts */

export interface ILink  { label: string; url: string; }

export interface IImage {
src:   string;
width?: number;
align?: 'left' | 'center' | 'right';
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

  quiz?: {
    enabled: boolean;
    question: string;
    options: string[];
    correct: number[]; // index(es) des bonnes réponses
  };

  children?: IItem[];
}

export interface IModule {
id:      string;
title:   string;
summary: string;
enabled: boolean;
items:   IItem[];
}