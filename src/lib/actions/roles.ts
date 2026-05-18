"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserRole, getCurrentUserRole } from "@/lib/roles";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Internal helper: persist a role change in Clerk metadata + DB
// ---------------------------------------------------------------------------
async function persistRoleChange(targetClerkId: string, role: UserRole) {
  // Sync with Clerk. Seeded / fake users won't exist in Clerk, so we
  // gracefully skip the Clerk update and only persist in the database.
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(targetClerkId, {
      publicMetadata: { role },
    });
  } catch (clerkErr: unknown) {
    const isNotFound =
      typeof clerkErr === "object" &&
      clerkErr !== null &&
      "status" in clerkErr &&
      (clerkErr as { status: number }).status === 404;
    if (!isNotFound) throw clerkErr;
    console.warn(
      `[persistRoleChange] User "${targetClerkId}" not found in Clerk — DB-only update.`
    );
  }

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.clerkId, targetClerkId));

  revalidatePath("/admin");
  revalidatePath("/book-appointment");

  return { success: true };
}

// ---------------------------------------------------------------------------
// Core: assign any role — full RBAC guards applied here
// ---------------------------------------------------------------------------
export async function assignRole(targetClerkId: string, role: UserRole) {
  const { userId: callerClerkId } = await auth();
  if (!callerClerkId) throw new Error("Unauthorized");

  // Cannot change your own role
  if (callerClerkId === targetClerkId) {
    throw new Error("Non puoi modificare il tuo ruolo dalla dashboard");
  }

  const callerRole = await getCurrentUserRole();

  const targetUser = await db.query.users.findFirst({
    where: eq(users.clerkId, targetClerkId),
  });
  if (!targetUser) throw new Error("Utente non trovato");

  // Nobody can touch a super_user account
  if (targetUser.role === "super_user") {
    throw new Error("Non è possibile modificare un super user");
  }

  if (callerRole === "super_user") {
    // Super user: unrestricted (except the rules above)
  } else if (callerRole === "admin") {
    // Admin: can only assign client / operator to client / operator targets
    const allowedTargetRoles: UserRole[] = ["client", "operator"];
    const allowedAssignRoles: UserRole[] = ["client", "operator"];

    if (!allowedTargetRoles.includes(targetUser.role)) {
      throw new Error("Non hai i permessi per modificare questo utente");
    }
    if (!allowedAssignRoles.includes(role)) {
      throw new Error("Non hai i permessi per assegnare questo ruolo");
    }
  } else {
    throw new Error("Unauthorized: permessi insufficienti");
  }

  return persistRoleChange(targetClerkId, role);
}

// ---------------------------------------------------------------------------
// Named helpers used by the admin UI
// ---------------------------------------------------------------------------

/** Promote client → operator. Allowed by admin and super_user. */
export async function upgradeToOperator(targetClerkId: string) {
  return assignRole(targetClerkId, "operator");
}

/** Promote client/operator → admin. Allowed ONLY by super_user. */
export async function upgradeToAdmin(targetClerkId: string) {
  // Extra guard at action level — assignRole enforces it server-side too.
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "super_user") {
    throw new Error("Solo il super user può promuovere un utente ad admin");
  }
  return assignRole(targetClerkId, "admin");
}

/** Demote operator/admin → client. Admin can only demote operator; super_user can demote both. */
export async function rollbackToClient(targetClerkId: string) {
  return assignRole(targetClerkId, "client");
}
