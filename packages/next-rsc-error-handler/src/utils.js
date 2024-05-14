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

/**
 * Wraps FunctionDeclaration or ArrowFunctionExpression with a function call with context.
 */
export function wrapWithFunction(p, wrapFunctionName, context) {
  // create a node from the options object
  const optionsExpression = t.objectExpression(
    Object.entries(context).map(([key, value]) => {
      const literalValue =
        typeof value === "string"
          ? t.stringLiteral(value)
          : typeof value === "boolean"
          ? t.booleanLiteral(value)
          : typeof value === "number"
          ? t.numericLiteral(value)
          : t.nullLiteral();

      return t.objectProperty(t.identifier(key), literalValue);
    })
  );

  if (p.isArrowFunctionExpression()) {
    return wrapArrowFunction(p, wrapFunctionName, optionsExpression);
  } else if (p.isFunctionDeclaration()) {
    return wrapFunctionDeclaration(p, wrapFunctionName, optionsExpression);
  } else {
    throw new Error("Only arrow functions are supported.");
  }
}

/**
 * Helper function that returns true if node returns a JSX element.
 * @param {Path} p
 * @returns {boolean}
 */
function isReturningJSXElement(p) {
  let foundJSX = false;

  p.traverse({
    CallExpression(callPath) {
      if (foundJSX) {
        return;
      }

      const calleePath = callPath.get("callee");
      if (
        t.isIdentifier(calleePath.node) &&
        ["_jsx", "_jsxs", "_jsxDEV", "_jsxsDEV"].includes(calleePath.node.name) // TODO: probably check if dev or prod vary on that
      ) {
        foundJSX = true;
        p.skip();
      }
    },
  });

  return foundJSX;
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

  if (p?.parentPath?.isExportDefaultDeclaration()) {
    p.parentPath.replaceWithMultiple([
      wrappedFunction,
      t.exportDefaultDeclaration(originalFunctionIdentifier),
    ]);
  } else {
    p.replaceWith(wrappedFunction);
  }
}
