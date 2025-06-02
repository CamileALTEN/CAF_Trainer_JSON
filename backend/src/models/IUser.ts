/* backend/src/models/IUser.ts
─────────────────────────── */

export type Role = 'admin' | 'manager' | 'caf' | 'user';

export interface IUser {
    id:        string;
    username:  string;
    password:  string;
    role:      Role;                 // admin | manager | caf | user
    site?:     string;               // site d'affectation (manager ou CAF)
    managerId?: string;              // CAF ➟ manager référent
}