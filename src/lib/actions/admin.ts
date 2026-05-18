"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, services, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUserRole } from "@/lib/roles";
import { revalidatePath } from "next/cache";


export async function deleteUser(targetClerkId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.clerkId, targetClerkId),
  });

  if (!targetUser) throw new Error("User not found");

  if (targetUser.role === "super_user") {
    throw new Error("Cannot delete super_user");
  }

  if (callerRole === "admin" && targetUser.role === "admin") {
    throw new Error("Admin cannot delete other admins or super_users");
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(targetClerkId);
  } catch (err) {
    console.warn("Clerk delete user failed, probably not found", err);
  }

  await db.delete(users).where(eq(users.clerkId, targetClerkId));
  revalidatePath("/admin");
}

export async function addService(data: { name: string; description: string; duration: number; price: number; category: string; icon?: string }) {
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  await db.insert(services).values({
    name: data.name,
    description: data.description || null,
    duration: data.duration,
    price: data.price,
    category: data.category,
    icon: data.icon || null,
  });
  revalidatePath("/admin");
  revalidatePath("/book-appointment");
}

export async function updateService(
  serviceId: string,
  data: { name: string; description: string; duration: number; price: number; category: string; icon?: string }
) {
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  await db.update(services)
    .set({
      name: data.name,
      description: data.description || null,
      duration: data.duration,
      price: data.price,
      category: data.category,
      icon: data.icon || null,
    })
    .where(eq(services.id, serviceId));
    
  revalidatePath("/admin");
  revalidatePath("/book-appointment");
}

export async function removeService(serviceId: string) {
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  await db.delete(services).where(eq(services.id, serviceId));
  revalidatePath("/admin");
  revalidatePath("/book-appointment");
}

export async function addProduct(data: { name: string; description: string; price: number; image: string; category: string }) {
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  await db.insert(products).values({
    name: data.name,
    description: data.description || null,
    price: data.price,
    image: data.image || null,
    category: data.category,
  });
  revalidatePath("/admin");
  revalidatePath("/products");
}

export async function removeProduct(productId: string) {
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  await db.delete(products).where(eq(products.id, productId));
  revalidatePath("/admin");
  revalidatePath("/products");
}

export async function updateProduct(
  productId: string,
  data: { name: string; description: string; price: number; image: string; category: string; inStock?: boolean }
) {
  const callerRole = await getCurrentUserRole();
  if (callerRole !== "admin" && callerRole !== "super_user") {
    throw new Error("Unauthorized");
  }

  await db.update(products)
    .set({
      name: data.name,
      description: data.description || null,
      price: data.price,
      image: data.image || null,
      category: data.category,
      inStock: data.inStock !== undefined ? data.inStock : true,
    })
    .where(eq(products.id, productId));

  revalidatePath("/admin");
  revalidatePath("/products");
}

