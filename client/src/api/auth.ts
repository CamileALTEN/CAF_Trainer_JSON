             // client/src/api/auth.ts
      
             export type Role = 'admin' | 'manager' | 'caf' | 'user';
      
export interface IUser {
  id:        string;
  username:  string;
  role:       Role;

  // CAF fields
  site?:        string;
  cafTypeId?:   string;
  managerIds?:  string[];

  // manager fields
  sites?:       string[];
}
