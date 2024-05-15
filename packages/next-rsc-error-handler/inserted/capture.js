import {
  PHASE_PRODUCTION_BUILD,
  PHASE_DEVELOPMENT_SERVER,
} from "next/constants";
import { default as globalHandler } from "/global-server-error";
import { isRedirectError } from "next/dist/client/components/redirect";
import { isNotFoundError } from "next/dist/client/components/not-found";

export async function capture(error, { options, ...ctx }) {
  if (
    isNotFoundError(error) ||
    isRedirectError(error) ||
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
  ) {
    throw error;
  }

  const result = globalHandler(error, ctx);

  if (
    result !== undefined &&
    process.env.NEXT_PHASE !== PHASE_DEVELOPMENT_SERVER
  ) {
    return result;
  }

  throw error;
}
