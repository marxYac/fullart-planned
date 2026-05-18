import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { services } from "./schema";


async function seed() {
  console.log("Seeding database...");

  // Seed Services
  const servicesData = [
    {
      name: "Taglio",
      duration: 50,
      price: 1700,
      category: "hair",
      description: "Taglio moderno rifinito a forbice e macchinetta."
    },
    {
      name: "Barba",
      duration: 20,
      price: 800,
      category: "beard",
      description: "Modellatura barba con panno caldo."
    },
    {
      name: "Taglio e Barba",
      duration: 60,
      price: 2500,
      category: "hair",
      description: "Il rituale completo per capelli e barba."
    },
    {
      name: "Wellness Spa",
      duration: 45,
      price: 3500,
      category: "wellness",
      description: "Trattamento relax per cute e capelli."
    }
  ];

  console.log("Inserting services...");
  for (const service of servicesData) {
    await db.insert(services).values(service).onConflictDoNothing();
  }



  console.log("Seeding completed!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
