import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductsClient } from "./products-client";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const allProducts = await db.query.products.findMany({
    orderBy: [desc(products.id)],
  });

  return <ProductsClient products={allProducts} />;
}
