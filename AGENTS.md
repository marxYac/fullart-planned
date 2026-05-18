<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FullArt Planned — Modern Barber App

Benvenuto nel repository di **FullArt Planned**, un'applicazione gestionale e landing page premium per barberie moderne. Il progetto offre un'esperienza utente eccellente per i clienti (prenotazioni, shop) e uno strumento di gestione potente per i gestori (admin dashboard).

## 🚀 Tecnologie Core

- **Framework**: [Next.js 16+](https://nextjs.org/) (React 19, App Router)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) con [Neon (PostgreSQL)](https://neon.tech/)
- **Auth & RBAC**: [Clerk](https://clerk.com/) (integrazione server-side e middleware)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
- **Animazioni**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Type Safety**: TypeScript strictly enforced.

## 🏗️ Architettura & Pattern

### 1. Database & Schema (`src/db/`)
- Utilizziamo `pgTable` di Drizzle per definire lo schema.
- **Tabelle principali**: `users`, `services`, `appointments`, `products`.
- **Relazioni**: Gestite tramite Drizzle `relations` API per query tipizzate e performanti.

### 2. Autenticazione & Ruoli (`src/middleware.ts`)
- I ruoli sono definiti nel DB e sincronizzati con i `publicMetadata` di Clerk.
- **Ruoli**: `super_user`, `admin`, `operator`, `client`.
- Il middleware protegge le rotte `/admin` e `/dashboard` in base al ruolo.

### 3. Server Actions (`src/lib/actions/`)
- Tutta la logica di mutazione (DB writes) deve passare per Server Actions.
- Utilizzare `"use server"` e validare l'input con Zod (consigliato).

## 🛠️ Esempi di Utilizzo

### Query con Drizzle
```typescript
// Recupero appuntamenti con relazioni
const results = await db.query.appointments.findMany({
  with: {
    user: true,
    service: true,
    operator: true,
  },
  where: eq(appointments.status, 'confirmed')
});
```

### Server Action Protetta
```typescript
export async function createAppointment(data: AppointmentSchema) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  await db.insert(appointments).values({
    ...data,
    userId: userId,
  });
  
  revalidatePath('/book-appointment');
}
```

## 📋 To-Do List & Roadmap

### Fase 1: Core Landing & Auth
- [x] Setup Next.js + Tailwind 4 + Shadcn.
- [x] Integrazione Clerk per Login/Signup.
- [x] Schema DB iniziale (Users, Services, Appointments).
- [ ] Pagina Landing con sezioni: Hero, Servizi, Chi Siamo, Shop Preview.

### Fase 2: Booking System (`/book-appointment`)
- [ ] Selezionatore di Servizi con categorie.
- [ ] Calendario interattivo per disponibilità (integrato con orari operatori).
- [ ] Riepilogo e conferma appuntamento via Server Action.

### Fase 3: Admin Dashboard (`/admin`)
- [ ] Tabella gestione Appuntamenti (filtri per data/stato).
- [ ] Gestione Servizi (aggiunta/modifica/prezzo).
- [ ] Dashboard statistiche (entrate, servizi più richiesti).

### Fase 4: Shop (`/shop`)
- [ ] Catalogo prodotti premium.
- [ ] Carrello e integrazione pagamenti (Stripe - futuro).

## 💡 Note per gli Agent
- **Surgical Updates**: Non sovrascrivere mai file interi se non necessario. Usa `replace`.
- **Styling**: Segui i pattern esistenti in `globals.css` e usa le variabili CSS di Tailwind 4.
- **Design**: Quando crei nuovi componenti UI, attiva la skill `frontend-design` per mantenere lo stile "Modern Barber".
- **Database**: Dopo ogni modifica a `schema.ts`, esegui `npm run db:push`.
