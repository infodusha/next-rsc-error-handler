import "server-only";
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

          return result.catch(() => {
            return (
              // FIXME handle error.ts and make it optional
              // That helps not to log errors in the console
              <html>
                <body></body>
              </html>
            );
          });
        }

        return result;
      } catch (err) {
        void capture(err, ctx);

        return (
          <html>
            <body></body>
          </html>
        );
        throw err;
      }
    },
  });
}
