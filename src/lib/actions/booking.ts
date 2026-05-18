"use server";

import { db } from "@/db";
import { appointments, services, users } from "@/db/schema";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (user) return user;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const [newUser] = await db.insert(users).values({
    clerkId: clerkId,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: `${clerkUser.firstName} ${clerkUser.lastName}`,
    imageUrl: clerkUser.imageUrl,
  }).returning();

  return newUser;
}


export async function getServices() {
  try {
    const data = await db.select().from(services);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching services:", error);
    return { success: false, error: "Failed to fetch services" };
  }
}

import { unstable_noStore as noStore } from "next/cache";

export async function getOperators() {
  noStore();
  try {
    const data = await db.select().from(users).where(inArray(users.role, ["operator", "admin"]));
    console.log("[SERVER ACTION] getOperators fetched:", data);
    return { success: true, data };
  } catch (error) {
    console.error("[SERVER ACTION] Error fetching operators:", error);
    return { success: false, error: "Failed to fetch operators" };
  }
}

export async function createAppointment(formData: {
  serviceId: string;
  operatorId: string;
  appointmentDate: Date;
  notes?: string;
}) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Get or sync internal user ID from clerkId
    let user = await syncUser();

    if (!user) {
      return { success: false, error: "Impossibile sincronizzare l'utente. Riprova più tardi." };
    }


    // 2. Insert appointment
    await db.insert(appointments).values({
      userId: user.id,
      serviceId: formData.serviceId,
      operatorId: formData.operatorId,
      appointmentDate: formData.appointmentDate,
      notes: formData.notes,
      status: "confirmed",
    });

    revalidatePath("/book-appointment");
    return { success: true };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, error: "Failed to create appointment" };
  }
}

export async function getUserAppointments() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await syncUser();

    if (!user) return { success: true, data: [] };


    const data = await db.query.appointments.findMany({
      where: eq(appointments.userId, user.id),
      with: {
        service: true,
        operator: true,
      },
      orderBy: [desc(appointments.appointmentDate)],
    });


    return { success: true, data };
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return { success: false, error: "Failed to fetch appointments" };
  }
}

import { and, gte, lt } from "drizzle-orm";

export async function getBookedSlots(operatorId: string, dateStr: string) {
  try {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.operatorId, operatorId),
        gte(appointments.appointmentDate, startOfDay),
        lt(appointments.appointmentDate, endOfDay),
        inArray(appointments.status, ["pending", "confirmed"])
      ),
      columns: {
        appointmentDate: true,
      },
      with: {
        service: {
          columns: {
            duration: true
          }
        }
      }
    });

    const bookedSlots: string[] = [];

    // For each appointment, calculate the covered 30-min slots
    for (const apt of bookedAppointments) {
      const aptStart = new Date(apt.appointmentDate);
      const duration = apt.service?.duration || 30; // default 30 mins
      
      const slotsCount = Math.ceil(duration / 30);
      
      for (let i = 0; i < slotsCount; i++) {
        const slotTime = new Date(aptStart.getTime() + i * 30 * 60000);
        const hours = slotTime.getHours().toString().padStart(2, '0');
        const minutes = slotTime.getMinutes().toString().padStart(2, '0');
        bookedSlots.push(`${hours}:${minutes}`);
      }
    }

    return { success: true, data: bookedSlots };
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    return { success: false, data: [] };
  }
}
