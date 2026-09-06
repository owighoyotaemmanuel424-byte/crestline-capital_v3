// Codegen-independent data model binding. Convex can regenerate this file in a normal dev/deploy workflow.
import type { DataModelFromSchemaDefinition } from "convex/server";
import schema from "../schema";
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
