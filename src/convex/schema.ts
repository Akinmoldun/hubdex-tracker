import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const STAGES = [
  "Wishlist",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;
export const stageValidator = v.union(...STAGES.map((s) => v.literal(s)));
export type Stage = (typeof STAGES)[number];

export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const priorityValidator = v.union(
  ...PRIORITIES.map((p) => v.literal(p)),
);
export type Priority = (typeof PRIORITIES)[number];

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    applications: defineTable({
      userId: v.id("users"),
      company: v.string(),
      role: v.string(),
      location: v.optional(v.string()),
      salary: v.optional(v.string()),
      url: v.optional(v.string()),
      stage: stageValidator,
      priority: priorityValidator,
      appliedDate: v.optional(v.string()), // ISO date (yyyy-mm-dd)
      notes: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_user_stage", ["userId", "stage"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
