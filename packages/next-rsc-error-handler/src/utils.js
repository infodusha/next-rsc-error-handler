import path from "node:path";

import * as t from "@babel/types";

export function getRelativePath(fullPath) {
  return path.relative(process.cwd(), fullPath);
}

export function isClientComponent(source) {
  return source.includes("__next_internal_client_entry_do_not_use__");
}

/**
 * Return true if node is a function and returns jsx.
 * @param {Path} p
 * @returns {boolean}
 */
export function isReactElement(p) {
  let isReactElement = false;
  if (p.isFunctionDeclaration() || p.isArrowFunctionExpression()) {
    isReactElement = isReturningJSXElement(p);
  }

  return isReactElement;
}

const JSX_FN_NAMES =
  process.env.NODE_ENV === "production"
    ? ["_jsx", "_jsxs"]
    : ["_jsxDEV", "_jsxsDEV"];

/**
 * Helper function that returns true if node returns a JSX element.
 * @param {Path} p
 * @returns {boolean}
 */
function isReturningJSXElement(p) {
  let foundJSX = false;

  p.traverse({
    CallExpression(innerP) {
      const calleePath = innerP.get("callee");
      if (
        t.isIdentifier(calleePath.node) &&
        JSX_FN_NAMES.includes(calleePath.node.name)
      ) {
        foundJSX = true;
        innerP.stop();
      }
    },
  });

  return foundJSX;
}

/**
 * Wraps FunctionDeclaration or ArrowFunctionExpression with a function call with context.
 */
export function wrapWithFunction(p, wrapFunctionName, context) {
  const optionsExpression = getOptionsExpressionLiteral(context);

  if (p.isArrowFunctionExpression()) {
    return wrapArrowFunction(p, wrapFunctionName, optionsExpression);
  } else if (p.isFunctionDeclaration()) {
    return wrapFunctionDeclaration(p, wrapFunctionName, optionsExpression);
  } else {
    throw new Error("Unsupported type of function");
  }
}

function getOptionsExpression(obj) {
  return t.objectExpression(
    Object.entries(obj).map(([key, value]) =>
      t.objectProperty(t.identifier(key), getOptionsExpressionLiteral(value))
    )
  );
}

function getOptionsExpressionLiteral(value) {
  if (value === null) {
    return t.nullLiteral();
  }
  switch (typeof value) {
    case "undefined":
      return t.identifier("undefined");
    case "string":
      return t.stringLiteral(value);
    case "boolean":
      return t.booleanLiteral(value);
    case "number":
      return t.numericLiteral(value);
    case "object":
      return getOptionsExpression(value);
    default:
      throw new Error(`Unsupported type of value: ${typeof value}`);
  }
}

function wrapArrowFunction(p, wrapFunctionName, optionsNode) {
  return p.replaceWith(
    t.callExpression(t.identifier(wrapFunctionName), [p.node, optionsNode])
  );
}

function wrapFunctionDeclaration(p, wrapFunctionName, argumentsExpression) {
  const expression = t.functionExpression(
    null,
    p.node.params,
    p.node.body,
    p.node.generator,
    p.node.async
  );

  if (p.node.id == null) {
    // FIXME should work no matter if there is no function name
    throw new Error("FunctionDeclaration has no id.");
  }

  const originalFunctionIdentifier = t.identifier(p.node.id.name);
  const wrappedFunction = t.variableDeclaration("var", [
    t.variableDeclarator(
      originalFunctionIdentifier,
      t.callExpression(t.identifier(wrapFunctionName), [
        expression,
        argumentsExpression,
      ])
    ),
  ]);

  if (p.parentPath?.isExportDefaultDeclaration()) {
    p.parentPath.replaceWithMultiple([
      wrappedFunction,
      t.exportDefaultDeclaration(originalFunctionIdentifier),
    ]);
  } else {
    p.replaceWith(wrappedFunction);
  }
}
