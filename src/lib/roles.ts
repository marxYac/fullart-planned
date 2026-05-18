import { auth } from "@clerk/nextjs/server";

export type UserRole = "super_user" | "admin" | "operator" | "client";

const roleHierarchy: Record<UserRole, number> = {
  super_user: 4,
  admin: 3,
  operator: 2,
  client: 1,
};

export async function getCurrentUserRole(): Promise<UserRole> {
  const { sessionClaims } = await auth(); // Aggiunto await
  return (sessionClaims?.metadata as { role?: UserRole })?.role || "client";
}

export async function hasRole(role: UserRole) {
  const currentRole = await getCurrentUserRole();
  return currentRole === role;
}

export async function hasMinimumRole(minRole: UserRole) {
  const currentRole = await getCurrentUserRole();
  return roleHierarchy[currentRole] >= roleHierarchy[minRole];
}
