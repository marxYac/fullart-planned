import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "@/lib/roles";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req); // legge CLERK_WEBHOOK_SIGNING_SECRET in automatico
  } catch (err) {
    console.error("[clerk-webhook] Verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  // ── user.created / user.updated ─────────────────────────────────────────
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata,
    } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      console.warn("[clerk-webhook] No email for user", id);
      return new Response("OK", { status: 200 });
    }

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || null;
    const role = ((public_metadata as Record<string, unknown>)?.role as UserRole) ?? "client";

    await db
      .insert(users)
      .values({ clerkId: id, email, name, imageUrl: image_url, role })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          name,
          imageUrl: image_url,
          role,
          updatedAt: new Date(),
        },
      });

    console.log(`[clerk-webhook] Upserted user ${id} (${email}) as "${role}"`);
  }

  // ── user.deleted ─────────────────────────────────────────────────────────
  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await db.delete(users).where(eq(users.clerkId, id));
      console.log(`[clerk-webhook] Deleted user ${id} from DB`);
    }
  }

  return new Response("OK", { status: 200 });
}
