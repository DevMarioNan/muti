import { db } from "@/lib/db";

export default async function TestDb() {
  const users = await db.user.findMany();
  return <div>
    <h1>Users</h1>
    <pre>{JSON.stringify(users, null, 2)}</pre>
  </div>
}   