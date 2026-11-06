import { db } from "@/db";
import { auth } from "./auth/auth";
import { account } from "@/db/schema/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function getAccessToken() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("User is not authenticated");
    }

    const userId = session.user.id;
    const githubAccount = await db.query.account.findFirst({
        where: and(
            eq(account.userId, userId),
            eq(account.providerId, "github")
        ),
    });

    if (!githubAccount) {
        throw new Error("GitHub account is not connected");
    }


    const tokenResult = await auth.api.getAccessToken({
        body: {
            accountId: githubAccount.id,
            userId,
        },
    });

    const accessToken = tokenResult.accessToken;

    if (!accessToken) {
        throw new Error("Could not retrieve GitHub access token");
    }

    const authHeader = Buffer.from(
        `x-access-token:${accessToken}`
    ).toString("base64");

    return { accessToken, authHeader };
}