// Codegen-independent bindings for CI/local typechecking. Convex can regenerate this directory during deployment.
import { mutationGeneric, queryGeneric } from "convex/server";
export const query = (config: any) => queryGeneric(config as any);
export const mutation = (config: any) => mutationGeneric(config as any);
export type QueryCtx = any;
export type MutationCtx = any;
export type { GenericId as Id } from "convex/values";
