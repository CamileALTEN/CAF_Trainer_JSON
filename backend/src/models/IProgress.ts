export interface IProgress {
  username: string;           // identifiant CAF
  moduleId: string;
  visited:  string[];         // IDs d’items validés
  status?: Record<string, string>; // itemId -> statut détaillé
}
