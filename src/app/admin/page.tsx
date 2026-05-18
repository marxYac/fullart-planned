import { db } from "@/db";
import { AdminDashboardClient } from "./admin-client";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUserRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const role = await getCurrentUserRole();
  
  if (role !== "super_user" && role !== "admin" && role !== "operator") {
    redirect("/");
  }

  const users = await db.query.users.findMany({
    orderBy: (users, { asc }) => [asc(users.createdAt)],
  });

  const services = await db.query.services.findMany({
    orderBy: (services, { asc }) => [asc(services.createdAt)],
  });

  const products = await db.query.products.findMany({
    orderBy: (products, { asc }) => [asc(products.name)],
  });

  return (
    <div className="space-y-8">
      <AdminDashboardClient 
        initialUsers={users}
        initialServices={services}
        initialProducts={products}
        currentUserId={userId}
        currentUserRole={role}
      />
    </div>
  );
}
