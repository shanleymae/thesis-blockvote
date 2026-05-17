/** Human-readable labels for Prisma enum values shown in the UI. */
export function formatRoleLabel(role: string): string {
  switch (role) {
    case 'SUPERADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'VOTER':
      return 'Voter';
    default:
      return role;
  }
}
