import { Comp } from "./Comp";

export const dynamic = 'force-dynamic';

export default async function Page() {
  // throw new Error("This is a Page error");

  function renderTest() {
    return <span>Should not be wrapped</span>
  }

  return (
    <div>
      <h1>Page</h1>
      <Comp />
      {renderTest()}
    </div>
  );
}
