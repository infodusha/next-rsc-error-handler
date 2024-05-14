import path from "node:path";
import { fileURLToPath } from "node:url";

import { PHASE_PRODUCTION_BUILD } from "next/constants";

export async function capture(error, ctx) {
  if (
    isNextNotFound(error) ||
    isNextRedirect(error) ||
    isNextProductionBuildPhase()
  ) {
    throw error;
  }

  console.dir({
    ppp: [fileURLToPath(import.meta.url), ctx.globalHandler],
  });

  const globalHandlerPath = path.relative(
    fileURLToPath(import.meta.url),
    ctx.globalHandler
  );

  console.log({ globalHandlerPath });
  // FIXME WTF??
  const { default: globalHandler } = await import(
    globalHandlerPath.replace("../", "")
  );
  // const globalHandler = await import(`${ctx.globalHandler}`);
  globalHandler(error);

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
