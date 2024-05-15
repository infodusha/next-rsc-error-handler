import parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

import {
  getRelativePath,
  isClientComponent,
  isReactElement,
  wrapWithFunction,
} from "./utils.js";

const WRAPPER_NAME = "__rscWrapper";
const WRAPPER_PATH = "next-rsc-error-handler/inserted/wrapper";

export default function (source) {
  if (isClientComponent(source)) {
    return source;
  }

  const options = this.getOptions();
  const resourcePath = this.resourcePath;

  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  let wasWrapped = false;

  traverse.default(ast, {
    enter(p) {
      if (!p.isFunctionDeclaration() && !p.isArrowFunctionExpression()) {
        return;
      }

      if (!isReactElement(p)) {
        return;
      }

      const ctx = {
        filePath: getRelativePath(resourcePath),
        functionName: getFunctionName(p),
        options,
      };

      wasWrapped = true;
      wrapWithFunction(p, WRAPPER_NAME, ctx);

      p.skip();
    },
  });

  if (wasWrapped) {
    addImport(ast);
  }

  const output = generate.default(ast);
  return output.code;
}

function getFunctionName(p) {
  if (p.isFunctionDeclaration()) {
    return p.node.id?.name;
  }

  if (p.isArrowFunctionExpression()) {
    const parent = p.parentPath;
    if (parent.isVariableDeclarator() && parent.node.id.type === "Identifier") {
      return parent.node.id.name;
    }
  }

  return "(anonymous)";
}

function addImport(ast) {
  const wrapperImport = t.importDeclaration(
    [t.importSpecifier(t.identifier(WRAPPER_NAME), t.identifier(WRAPPER_NAME))],
    t.stringLiteral(WRAPPER_PATH)
  );

  ast.program.body.unshift(wrapperImport);
}
