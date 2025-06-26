export function roleLabel(role: string): string {
  switch (role) {
    case 'manager':
      return 'référent';
    case 'admin':
      return 'admin';
    case 'caf':
      return 'caf';
    case 'user':
      return 'user';
    default:
      return role;
  }
}

