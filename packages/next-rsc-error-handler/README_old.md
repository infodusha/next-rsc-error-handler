# next-rsc-error-handler

Webpack plugin that allow to handle RSC errors on the server side.

## Get started

- Install the dependency `npm i next-rsc-error-handler`
- In your next config add the plugin:

```javascript
import { rscErrorHandler } from "next-rsc-error-handler";

const withRscErrorHandler = rscErrorHandler();

export default withRscErrorHandler({
  // next config here
});
```

- Add `global-server-error.js` in your root folder with following content:

```javascript
/** @type {import('next-rsc-error-handler').GlobalServerError} */
export default function onGlobalServerError(err, ctx) {
  // handling here
}
```

Alternatively, you can use `global-server-error.ts` for file above.

## License

[Apache-2.0](https://choosealicense.com/licenses/apache-2.0/)
