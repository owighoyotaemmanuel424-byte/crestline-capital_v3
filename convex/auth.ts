import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const name = String(params.name ?? email.split("@")[0] ?? "Customer").trim();
        const now = Date.now();
        return {
          email,
          name,
          role: "customer",
          kycStatus: "not_started",
          accountStatus: "active",
          twoFactorEnabled: false,
          createdAt: now,
          updatedAt: now,
        };
      },
    }),
  ],
});
