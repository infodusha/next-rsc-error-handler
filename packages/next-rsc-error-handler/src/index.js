import path from "node:path";

const defaultOptions = {
  globalHandler: "global-server-error.js",
};

const loaderPath = path.resolve("loader.js");

export function rscErrorHandler(options = {}) {
  return function withLoader(nextConfig = {}) {
    return {
      ...nextConfig,
      webpack(config, opts) {
        config.module.rules.unshift({
          test: /(page|layout)\.(t|j)sx?$/,
          include: /\/app\//,
          use: [
            {
              loader: "next-rsc-error-handler/src/loader.js",
              options: {
                ...defaultOptions,
                ...options,
              },
            },
          ],
        });

        if (typeof nextConfig.webpack === "function") {
          return nextConfig.webpack(config, opts);
        }

        return config;
      },
    };
  };
}
