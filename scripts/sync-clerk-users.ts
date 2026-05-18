import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, appointments } from "../src/db/schema";
import { notLike, or, inArray } from "drizzle-orm";
import * as schema from "../src/db/schema";

// ── Setup ────────────────────────────────────────────────────────────────────
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!clerkSecretKey) throw new Error("CLERK_SECRET_KEY non trovato in .env.local");
if (!databaseUrl) throw new Error("DATABASE_URL non trovato in .env.local");

const clerk = createClerkClient({ secretKey: clerkSecretKey });
const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

type UserRole = "super_user" | "admin" | "operator" | "client";

async function main() {
  console.log("🔄 Avvio sync Clerk → Neon...\n");

  // ── Step 1: Trova utenti seed (clerkId non inizia con "user_") ────────────
  const seedUsers = await db
    .select({ id: users.id, clerkId: users.clerkId })
    .from(users)
    .where(notLike(users.clerkId, "user_%"));

  if (seedUsers.length > 0) {
    const seedIds = seedUsers.map((u) => u.id);

    console.log(`🗑  Trovati ${seedUsers.length} utenti seed — elimino appuntamenti collegati...`);

    // Elimina appuntamenti che referenziano gli utenti seed
    await db
      .delete(appointments)
      .where(
        or(
          inArray(appointments.userId, seedIds),
          inArray(appointments.operatorId, seedIds)
        )
      );

    // Ora elimina gli utenti seed
    const deleted = await db
      .delete(users)
      .where(notLike(users.clerkId, "user_%"))
      .returning({ clerkId: users.clerkId });

    console.log(`   Eliminati ${deleted.length} utenti seed dal DB:`);
    deleted.forEach((u) => console.log(`   - ${u.clerkId}`));
  } else {
    console.log("✅ Nessun utente seed da eliminare.");
  }


  // ── Step 2: Fetch tutti gli utenti da Clerk con paginazione ──────────────
  let allClerkUsers: Awaited<ReturnType<typeof clerk.users.getUserList>>["data"] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const page = await clerk.users.getUserList({ limit, offset });
    allClerkUsers = allClerkUsers.concat(page.data);
    if (page.data.length < limit) break;
    offset += limit;
  }

  console.log(`\n📋 Trovati ${allClerkUsers.length} utenti in Clerk.`);

  // ── Step 3: Upsert nel DB ─────────────────────────────────────────────────
  let upserted = 0;
  let skipped = 0;

  for (const user of allClerkUsers) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.warn(`⚠  Utente ${user.id} senza email — saltato.`);
      skipped++;
      continue;
    }

    const name =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null;
    const role =
      ((user.publicMetadata as Record<string, unknown>)?.role as UserRole) ??
      "client";
    const imageUrl = user.imageUrl ?? null;

    await db
      .insert(users)
      .values({ clerkId: user.id, email, name, imageUrl, role })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: { email, name, imageUrl, role, updatedAt: new Date() },
      });

    console.log(`   ✓ ${user.id} — ${email} (${role})`);
    upserted++;
  }

  console.log(`\n✅ Sync completata.`);
  console.log(`   Upsertati: ${upserted}`);
  console.log(`   Saltati:   ${skipped}`);
}

main().catch((err) => {
  console.error("❌ Errore durante la sync:", err);
  process.exit(1);
});
