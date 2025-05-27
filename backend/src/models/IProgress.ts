export interface IProgress {
  username: string;           // identifiant CAF
  moduleId: string;
  started: string[];          // IDs d’items démarrés/en cours
  visited: string[];          // IDs d’items terminés
}
