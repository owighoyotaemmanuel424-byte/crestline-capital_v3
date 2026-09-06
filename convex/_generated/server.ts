// Codegen-independent bindings using the repository schema. Convex may regenerate this directory during deployment.
import type { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel } from "./dataModel";
export { queryGeneric as query, mutationGeneric as mutation } from "convex/server";
export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type { GenericId as Id } from "convex/values";
