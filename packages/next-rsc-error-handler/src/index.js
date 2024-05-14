const defaultOptions = {};

export function rscErrorHandler(options = {}) {
  return function withLoader(nextConfig = {}) {
    return {
      ...nextConfig,
      webpack(config, opts) {
        config.module.rules.unshift({
          test: /\.(t|j)sx?$/, // TODO probably get extensions from next config ?
          exclude: /\/(node_modules|packages\/next-rsc-error-handler)\//, // FIXME packages are only excluded for testing purposes
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
