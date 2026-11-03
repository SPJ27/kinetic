import { redirect } from "next/navigation";
import { auth } from "./auth/auth";
import { headers } from "next/headers";

export async function requireSession() {
    const session = await auth.api.getSession({headers: await headers()})
    if (!session) redirect('/')
    return session
}

export async function requireAdminSession() {
    const session = await auth.api.getSession({headers: await headers()})
    if (!session) redirect('/')
    if (session.user.role !== 'admin') redirect('/')
    return session
}

