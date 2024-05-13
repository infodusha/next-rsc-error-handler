import { Comp } from "./Comp";

export default function Page() {
  throw new Error("This is a Page error");

  return (
    <div>
      <h1>Page</h1>
      <Comp />
    </div>
  );
}
