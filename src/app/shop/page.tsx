import { db } from "@/db";
import { products } from "@/db/schema";
import { ShopClient } from "./shop-client";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const allProducts = await db.query.products.findMany({
    orderBy: [desc(products.id)],
  });

  return <ShopClient products={allProducts} />;
}
