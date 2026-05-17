/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentContext from "../agentContext.js";
import type * as ai from "../ai.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as lib_aiClient from "../lib/aiClient.js";
import type * as prospects from "../prospects.js";
import type * as scoring from "../scoring.js";
import type * as telegram from "../telegram.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentContext: typeof agentContext;
  ai: typeof ai;
  emails: typeof emails;
  http: typeof http;
  "lib/aiClient": typeof lib_aiClient;
  prospects: typeof prospects;
  scoring: typeof scoring;
  telegram: typeof telegram;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
