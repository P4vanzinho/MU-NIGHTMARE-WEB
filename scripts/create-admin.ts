import { auth } from '../src/server/auth/auth'
import { db } from '../src/server/db/client'
import { user } from '../src/server/db/auth-schema'
import { eq } from 'drizzle-orm'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const name = process.env.ADMIN_NAME ?? 'Nightmare Admin'

if (!email || !password) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar um admin')

const result = await auth.api.signUpEmail({ body: { name, email, password } })
if (!result.user) throw new Error('Não foi possível criar o admin')

await db.update(user).set({ role: 'admin', emailVerified: true }).where(eq(user.id, result.user.id))
console.log(`Admin criado: ${email}`)
