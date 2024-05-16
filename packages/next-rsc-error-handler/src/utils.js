import path from "node:path";

import * as t from "@babel/types";

export function getRelativePath(fullPath) {
  return path.relative(process.cwd(), fullPath);
}

export function isClientComponent(source) {
  return source.includes("__next_internal_client_entry_do_not_use__");
}

function getOptionsExpression(obj) {
  return t.objectExpression(
    Object.entries(obj).map(([key, value]) =>
      t.objectProperty(t.identifier(key), getOptionsExpressionLiteral(value))
    )
  );
}

export function getOptionsExpressionLiteral(value) {
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

export function wrapArrowFunction(p, wrapFunctionName, optionsNode) {
  return p.replaceWith(
    t.callExpression(t.identifier(wrapFunctionName), [p.node, optionsNode])
  );
}

export function wrapFunctionDeclaration(
  p,
  wrapFunctionName,
  argumentsExpression
) {
  const expression = t.functionExpression(
    null,
    p.node.params,
    p.node.body,
    p.node.generator,
    p.node.async
  );

  if (p.node.id == null) {
    throw new Error("FunctionDeclaration has no name");
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
