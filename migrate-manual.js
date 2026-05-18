const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_operator_id_operators_id_fk"`;
    console.log('Dropped fk constraint');
  } catch(e) { console.log(e.message); }
  
  try {
    await sql`ALTER TABLE "appointments" ADD CONSTRAINT "appointments_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id")`;
    console.log('Added new constraint');
  } catch(e) { console.log(e.message); }
  
  try {
    await sql`DROP TABLE IF EXISTS "operators" CASCADE`;
    console.log('Dropped operators table');
  } catch(e) { console.log(e.message); }
}

main().then(() => console.log('Done'));
