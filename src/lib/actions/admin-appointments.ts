"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { appointments, users, services } from "@/db/schema";
import { eq, and, gte, lte, inArray, desc, asc, ilike, or } from "drizzle-orm";
import { getCurrentUserRole } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface GetAppointmentsParams {
  dateFrom?: string;
  dateTo?: string;
  statuses?: AppointmentStatus[];
  search?: string;
  operatorId?: string; // Only applicable for admin/super_user
  page?: number;
  limit?: number;
}

export async function getAppointmentsAction(params: GetAppointmentsParams) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const role = await getCurrentUserRole();
  if (!["super_user", "admin", "operator"].includes(role)) {
    throw new Error("Unauthorized");
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!currentUser) throw new Error("User not found in DB");

  const conditions = [];

  // Role filtering
  if (role === "operator") {
    // Operator sees only their own appointments
    conditions.push(eq(appointments.operatorId, currentUser.id));
  } else if (params.operatorId && params.operatorId !== "all") {
    // Admin/super_user can filter by operator
    conditions.push(eq(appointments.operatorId, params.operatorId));
  }

  // Date filtering
  if (params.dateFrom) {
    conditions.push(gte(appointments.appointmentDate, new Date(params.dateFrom)));
  }
  if (params.dateTo) {
    // Set to end of day
    const dateTo = new Date(params.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    conditions.push(lte(appointments.appointmentDate, dateTo));
  }

  // Status filtering
  if (params.statuses && params.statuses.length > 0) {
    conditions.push(inArray(appointments.status, params.statuses));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  // We need to do a join to filter by customer name/email if search is present
  // But Drizzle's relational query API doesn't support complex where clauses across relations easily for text search.
  // We'll fetch more data and filter in JS if search is present, OR we use query builder.
  // Using query builder for search:
  
  let query = db
    .select({
      appointment: appointments,
      user: users,
      service: services,
      operator: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }
    })
    .from(appointments)
    .leftJoin(users, eq(appointments.userId, users.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    // We join users again as operator
    // Since we can't easily join the same table twice with drizzle query builder without aliases,
    // let's just fetch relational and filter if needed, OR use db.query API.
    
    // Actually, db.query API is better for nested, we can just fetch and filter in JS if search is small, 
    // or use the db.query where. Drizzle allows eq, ilike etc in `where` of nested relations? No, only on the root.

  // Let's use db.query.appointments with 'where' and then JS filter for search text (since search is on relation)
  // Or just write it simply.
  
  const results = await db.query.appointments.findMany({
    where: whereClause,
    with: {
      user: true,
      service: true,
      operator: true,
    },
    orderBy: [desc(appointments.appointmentDate)], // Usually show newest or nearest first
  });

  // Client-side text search filter (customer name/email)
  let filteredResults = results;
  if (params.search) {
    const s = params.search.toLowerCase();
    filteredResults = results.filter(r => 
      (r.user?.name && r.user.name.toLowerCase().includes(s)) ||
      (r.user?.email && r.user.email.toLowerCase().includes(s))
    );
  }

  // Pagination
  const totalCount = filteredResults.length;
  const paginatedResults = filteredResults.slice(offset, offset + limit);

  return {
    data: paginatedResults,
    total: totalCount,
    page,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function updateAppointmentStatusAction(appointmentId: string, status: AppointmentStatus) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const role = await getCurrentUserRole();
  if (role !== "admin" && role !== "super_user") {
    throw new Error("Only admins and super users can change status");
  }

  await db.update(appointments)
    .set({ status })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/admin");
}

export async function getOperatorsAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const role = await getCurrentUserRole();
  if (role !== "admin" && role !== "super_user") {
    return [];
  }

  const operators = await db.query.users.findMany({
    where: inArray(users.role, ["operator", "admin", "super_user"]),
    orderBy: [asc(users.name)],
  });

  return operators.map(o => ({
    id: o.id,
    name: o.name,
    email: o.email,
  }));
}
