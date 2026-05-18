import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function seedOperators() {
  try {
    const existing = await db.select().from(users).where(eq(users.role, 'operator'));
    if (existing.length === 0) {
      await db.insert(users).values([
        {
          clerkId: "seed_domenico",
          email: "domenico@fullart.com",
          name: "Domenico",
          role: "operator",
          imageUrl: "https://images.unsplash.com/photo-1618306854515-db87000bfcd5?auto=format&fit=crop&w=300&q=80",
        },
        {
          clerkId: "seed_alessandro",
          email: "alessandro@fullart.com",
          name: "Alessandro",
          role: "operator",
          imageUrl: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?auto=format&fit=crop&w=300&q=80",
        }
      ]);
      console.log("Operators seeded into users table!");
    } else {
      console.log("Operators already exist in users table:", existing);
    }
  } catch (error) {
    console.error("Error seeding operators:", error);
  }
}

seedOperators();
