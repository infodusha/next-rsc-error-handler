import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { default as globalHandler } from "/global-server-error";
import { isRedirectError } from "next/dist/client/components/redirect";
import { isNotFoundError } from "next/dist/client/components/not-found";

export async function capture(error, ctx) {
  if (
    isNotFoundError(error) ||
    isRedirectError(error) ||
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  ) {
    throw error;
  }

  const result = await globalHandler(error, ctx);

  if (result !== undefined && process.env.NODE_ENV !== "development") {
    return result;
  }

  throw error;
}
