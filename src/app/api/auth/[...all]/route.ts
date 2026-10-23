import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/server/auth";

/** Better Auth 的所有端點：/api/auth/sign-up/email、/api/auth/sign-in/email、/api/auth/sign-out… */
export const { GET, POST } = toNextJsHandler(auth);
