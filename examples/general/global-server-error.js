export default function ServerError(err, ctx) {
  console.dir({ err, ctx });
  return <h1>Unexpected error</h1>;
}
