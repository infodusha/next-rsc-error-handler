import { Comp } from "./Comp";
import { Comp as Comp2 } from "./Comp";

export const dynamic = 'force-dynamic';

export default async function Page() {
  // throw new Error("This is a Page error");

  function renderTest() {
    // throw new Error("This is a render method error");
    return <span>Should not be wrapped</span>
  }

  function ABC() {
    // throw new Error("This is a ABC error");
    return <div>ABC</div>
  }

  return (
    <div>
      <h1>Page</h1>
      <Comp />
      <Comp2 />
      {renderTest()}
      <ABC />
    </div>
  );
}
