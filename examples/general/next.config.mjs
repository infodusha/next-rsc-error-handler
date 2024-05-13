import { rscErrorHandler } from "next-rsc-error-handler";

const withRscErrorHandler = rscErrorHandler({
  globalHandler: "global-server-error.mjs",
});

export default withRscErrorHandler({
  output: "standalone",
});
