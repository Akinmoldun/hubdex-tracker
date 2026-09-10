// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { emailOtp } from "./auth/emailOtp";


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Email + password registration and sign-in. Passwords are hashed with
    // Scrypt (Lucia) by the provider, never stored in plain text.
    Password({
      profile(params) {
        // Normalize the email (trim + lowercase) so registration and sign-in
        // both resolve to the same account regardless of casing or spaces.
        // Convex Auth keys accounts on this email, so a duplicate signUp on a
        // normalized email is rejected server-side (never a second account),
        // while the same normalized email can always sign in.
        const email = String(params.email ?? "").trim().toLowerCase();
        const raw = (params.name as string | undefined)?.trim();
        const name = raw ? raw.slice(0, 100) : undefined;
        // The profile record must only contain defined Convex values.
        return {
          email,
          ...(name !== undefined ? { name } : {}),
        };
      },
      validatePasswordRequirements(password: string) {
        if (!password || password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
      },
    }),
    emailOtp,
    Anonymous,
  ],
});