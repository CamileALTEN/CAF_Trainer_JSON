/* backend/src/models/IUser.ts
─────────────────────────── */

export type Role = 'admin' | 'manager' | 'caf' | 'user';

export interface IUser {
    id:        string;
    username:  string;
    password:  string;
    role:      Role;                 // admin | manager | caf | user

    // ---- CAF fields ----
    site?:        string;           // site d'affectation du CAF
    cafTypeId?:   string;           // type de CAF
    managerIds?:  string[];         // CAF → plusieurs managers référents

    // ---- manager fields ----
    sites?:       string[];         // manager en charge de plusieurs sites
}