import path from "node:path";

import * as t from "@babel/types";

export function getRelativePath(fullPath) {
  const root = process.cwd();
  const relativePath = path.relative(root, fullPath);
  return relativePath;
}

export function isClientComponent(source) {
  return source.includes("__next_internal_client_entry_do_not_use__");
}

export function containsServerActions(source) {
  return source.includes("createActionProxy");
}

/**
 * Return true if node is a function and returns jsx.
 * @param {Path} path
 * @returns {boolean}
 */
export function isReactElement(path) {
  let isReactElement = false;
  if (path.isFunctionDeclaration() || path.isArrowFunctionExpression()) {
    isReactElement = isReturningJSXElement(path);
  }

  return isReactElement;
}

/**
 * Returns true if node is exported (named, not default), async, function or arrow function.
 * Important: Additionally we check if the "use server" directive is used.
 * i.e export async function myServerAction() {} or export const myServerAction = async () => {}
 */
export function isServerAction(path) {
  const isDeclaration =
    path.isFunctionDeclaration() &&
    path.node.async === true &&
    path.parentPath?.isExportNamedDeclaration();

  const isArrowFunction =
    path.isArrowFunctionExpression() &&
    path.node.async === true &&
    path.parentPath?.isVariableDeclarator() &&
    path.parentPath?.parentPath?.isVariableDeclaration() &&
    path.parentPath?.parentPath?.parentPath?.isExportNamedDeclaration();

  return (
    (isDeclaration || isArrowFunction) && isReturningJSXElement(path) === false
  );
}

/**
 * Wraps FunctionDeclaration or ArrowFunctionExpression with a function call with context.
 */
export function wrapWithFunction(path, wrapFunctionName, context) {
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

  if (path.isArrowFunctionExpression()) {
    return wrapArrowFunction(path, wrapFunctionName, optionsExpression);
  } else if (path.isFunctionDeclaration()) {
    return wrapFunctionDeclaration(path, wrapFunctionName, optionsExpression);
  } else {
    throw new Error("Only arrow functions are supported.");
  }
}

/**
 * Helper function that returns true if node returns a JSX element.
 * @param {Path} path
 * @returns {boolean}
 */
function isReturningJSXElement(path) {
  let foundJSX = false;

  path.traverse({
    CallExpression(callPath) {
      if (foundJSX) {
        return;
      }

      const calleePath = callPath.get("callee");
      if (
        t.isIdentifier(calleePath.node) &&
        (calleePath.node.name === "_jsx" || calleePath.node.name === "_jsxs")
      ) {
        foundJSX = true;
        path.skip();
      }
    },
  });

  return foundJSX;
}

function wrapArrowFunction(path, wrapFunctionName, optionsNode) {
  return path.replaceWith(
    t.callExpression(t.identifier(wrapFunctionName), [path.node, optionsNode])
  );
}

function wrapFunctionDeclaration(path, wrapFunctionName, argumentsExpression) {
  const expression = t.functionExpression(
    null,
    path.node.params,
    path.node.body,
    path.node.generator,
    path.node.async
  );

  if (path.node.id == null) {
    throw new Error("FunctionDeclaration has no id.");
  }

  const originalFunctionIdentifier = t.identifier(path.node.id.name);
  const wrappedFunction = t.variableDeclaration("var", [
    t.variableDeclarator(
      originalFunctionIdentifier,
      t.callExpression(t.identifier(wrapFunctionName), [
        expression,
        argumentsExpression,
      ])
    ),
  ]);

  if (path?.parentPath?.isExportDefaultDeclaration()) {
    path.parentPath.replaceWithMultiple([
      wrappedFunction,
      t.exportDefaultDeclaration(originalFunctionIdentifier),
    ]);
  } else {
    path.replaceWith(wrappedFunction);
  }
}
