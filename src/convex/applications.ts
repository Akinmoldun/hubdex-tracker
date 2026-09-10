import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { STAGES, stageValidator, priorityValidator } from "./schema";

const LIMITS: Record<string, number> = {
  company: 120,
  role: 120,
  location: 200,
  salary: 100,
  url: 500,
  notes: 2000,
};

async function requireUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

function validateFields(
  fields: Record<string, string | undefined>,
): Record<string, string | undefined> {
  for (const [key, limit] of Object.entries(LIMITS)) {
    const value = fields[key];
    if (value !== undefined && value !== null) {
      if (value.trim().length === 0) {
        fields[key] = undefined;
        continue;
      }
      if (value.length > limit) {
        throw new Error(`"${key}" is limited to ${limit} characters.`);
      }
    }
  }
  if (!fields.company || fields.company.trim().length === 0) {
    throw new Error("Company is required.");
  }
  if (!fields.role || fields.role.trim().length === 0) {
    throw new Error("Role is required.");
  }
  if (fields.url && !/^https?:\/\/\S+$/.test(fields.url.trim())) {
    throw new Error("Job URL must start with http:// or https://");
  }
  if (fields.appliedDate && !/^\d{4}-\d{2}-\d{2}$/.test(fields.appliedDate)) {
    throw new Error("Invalid applied date.");
  }
  return fields;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        total: 0,
        active: 0,
        interviews: 0,
        offers: 0,
        byStage: Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
          string,
          number
        >,
      };
    }
    const apps = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const byStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<
      string,
      number
    >;
    for (const a of apps) byStage[a.stage] = (byStage[a.stage] ?? 0) + 1;
    return {
      total: apps.length,
      active: byStage["Applied"] + byStage["Interview"],
      interviews: byStage["Interview"],
      offers: byStage["Offer"],
      byStage,
    };
  },
});

export const create = mutation({
  args: {
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    url: v.optional(v.string()),
    stage: stageValidator,
    priority: priorityValidator,
    appliedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const clean = validateFields({ ...args });
    return await ctx.db.insert("applications", {
      ...clean,
      company: (clean.company as string).trim(),
      role: (clean.role as string).trim(),
      userId,
    } as any);
  },
});

export const update = mutation({
  args: {
    id: v.id("applications"),
    company: v.string(),
    role: v.string(),
    location: v.optional(v.string()),
    salary: v.optional(v.string()),
    url: v.optional(v.string()),
    stage: stageValidator,
    priority: priorityValidator,
    appliedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Application not found.");
    }
    const { id, ...fields } = args;
    const clean = validateFields({ ...fields });
    await ctx.db.patch(args.id, {
      ...clean,
      company: (clean.company as string).trim(),
      role: (clean.role as string).trim(),
    } as any);
  },
});

export const updateStage = mutation({
  args: { id: v.id("applications"), stage: stageValidator },
  handler: async (ctx, { id, stage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Application not found.");
    }
    await ctx.db.patch(id, { stage });
  },
});

export const remove = mutation({
  args: { id: v.id("applications") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Application not found.");
    }
    await ctx.db.delete(id);
  },
});
