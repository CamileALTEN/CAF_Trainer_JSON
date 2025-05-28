export interface IProgress {
  username: string;           // identifiant CAF
  moduleId: string;
  started: string[];          // IDs d’items démarrés/en cours
  needValidation: string[];   // IDs d’items en attente de validation
  visited: string[];          // IDs d’items terminés
}
