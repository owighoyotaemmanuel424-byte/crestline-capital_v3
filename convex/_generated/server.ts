// Codegen-independent bindings for CI/local typechecking. Convex can regenerate this directory during deployment.
export { queryGeneric as query, mutationGeneric as mutation } from "convex/server";
export type QueryCtx = any;
export type MutationCtx = any;
export type { GenericId as Id } from "convex/values";
