import { rscErrorHandler } from "next-rsc-error-handler";

const withRscErrorHandler = rscErrorHandler();

export default withRscErrorHandler({
  output: "standalone",
});
