import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { default as globalHandler } from "/global-server-error";

export async function capture(error, ctx) {
  if (
    isNextNotFound(error) ||
    isNextRedirect(error) ||
    isNextProductionBuildPhase()
  ) {
    throw error;
  }

  globalHandler(error, ctx);

  // TODO return a valid response?
  return (
    <html>
      <body>{error.message}</body>
    </html>
  );
}

function isNextNotFound(error) {
  return error.digest === "NEXT_NOT_FOUND";
}

function isNextRedirect(error) {
  return error.digest?.startsWith("NEXT_REDIRECT;");
}

function isNextProductionBuildPhase() {
  return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
}
