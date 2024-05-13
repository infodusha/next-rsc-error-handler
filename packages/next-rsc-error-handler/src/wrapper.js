import { capture } from "./capture.js";

export function __rscWrapper(fn, ctx) {
  return new Proxy(fn, {
    apply: (originalFunction, self, args) => {
      try {
        const result = originalFunction.apply(self, args);

        if (result instanceof Promise) {
          Promise.resolve(result).catch((err) => {
            void capture(err, ctx);
          });
        }

        return result;
      } catch (err) {
        void capture(err, ctx);
        throw err;
      }
    },
  });
}
