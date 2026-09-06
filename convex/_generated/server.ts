// Compatibility layer for environments where Convex code generation is unavailable.
// Production deployments may regenerate this directory; the runtime uses Convex's generic builders.
export { queryGeneric as query, mutationGeneric as mutation } from "convex/server";
export type { GenericQueryCtx as QueryCtx, GenericMutationCtx as MutationCtx } from "convex/server";
export type { GenericId as Id } from "convex/values";
