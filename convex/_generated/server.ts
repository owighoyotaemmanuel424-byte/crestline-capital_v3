// Compatibility layer for environments where Convex code generation is unavailable.
// Production deployments may regenerate this directory; the runtime uses Convex's generic builders.
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
export { queryGeneric as query, mutationGeneric as mutation } from "convex/server";
export type QueryCtx = GenericQueryCtx<any>;
export type MutationCtx = GenericMutationCtx<any>;
export type { GenericId as Id } from "convex/values";
