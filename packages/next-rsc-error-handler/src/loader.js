import parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

import {
  getRelativePath,
  isClientComponent,
  wrapFunctionDeclaration,
  wrapArrowFunction,
  getOptionsExpressionLiteral,
} from "./utils.js";

const WRAPPER_NAME = "__rscWrapper";
const WRAPPER_PATH = "next-rsc-error-handler/inserted/wrapper";

export default function (source) {
  if (isClientComponent(source)) {
    return source;
  }

  const resourcePath = this.resourcePath;
  const filePath = getRelativePath(resourcePath);

  if (isRoute(filePath)) {
    return source;
  }

  const options = this.getOptions();

  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  let wasWrapped = false;

  function wrapIfComponent(functionName, p, wrapFn) {
    if (!options.componentName.test(functionName)) {
      return;
    }

    const ctx = {
      filePath,
      componentName: functionName,
    };
    const optionsExpression = getOptionsExpressionLiteral(ctx);

    wasWrapped = true;

    wrapFn(p, WRAPPER_NAME, optionsExpression);
  }

  traverse.default(ast, {
    // TODO add FunctionExpression
    FunctionDeclaration(p) {
      const functionName = p.node.id?.name ?? "";
      wrapIfComponent(functionName, p, wrapFunctionDeclaration);
    },
    ArrowFunctionExpression(p) {
      const functionName = getArrowFunctionName(p);
      wrapIfComponent(functionName, p, wrapArrowFunction);
    },
  });

  if (!wasWrapped) {
    return source;
  }

  addImport(ast);
  const output = generate.default(ast);

  return output.code;
}

function isInApp(resourcePath) {
  return /^(src(\/|\\))?app(\/|\\)/.test(resourcePath);
}

function isRoute(resourcePath) {
  return (
    isInApp(resourcePath) && /(\/|\\)route\.(c|m)?(t|j)s$/.test(resourcePath)
  );
}

function getArrowFunctionName(p) {
  if (p.isArrowFunctionExpression()) {
    const parent = p.parentPath;
    if (parent.isVariableDeclarator() && parent.node.id.type === "Identifier") {
      return parent.node.id.name;
    }
  }
  return "";
}

function addImport(ast) {
  const wrapperImport = t.importDeclaration(
    [t.importSpecifier(t.identifier(WRAPPER_NAME), t.identifier(WRAPPER_NAME))],
    t.stringLiteral(WRAPPER_PATH)
  );

  ast.program.body.unshift(wrapperImport);
}
