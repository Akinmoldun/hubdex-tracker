import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Returns true when a password-provider account already exists for the given
 * (already normalized) email. Used by the auth profile hook to reject
 * duplicate registrations before any account is created.
 */
export const passwordAccountExists = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", args.email),
      )
      .unique();
    return account !== null;
  },
});
