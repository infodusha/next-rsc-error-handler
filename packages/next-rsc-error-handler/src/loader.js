import parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import path from "node:path";

import {
  getRelativePath,
  isClientComponent,
  wrapFunctionDeclaration,
  wrapArrowFunction,
  getOptionsExpressionLiteral,
} from "./utils.js";

const WRAPPER_NAME = "__rscWrapper";
const WRAPPER_PATH = "next-rsc-error-handler/inserted/wrapper";

const clientComponents = new Set();
const serverComponents = new Set();

export default function (source) {
  const resourcePath = this.resourcePath;
  const relativePath = getRelativePath(resourcePath);

  if (isRoute(relativePath)) {
    return source;
  }

  const noExtRelativePath = dropExtension(relativePath);
  const isTrulyClientComponent = isClientComponent(source);

  if (isTrulyClientComponent || clientComponents.has(noExtRelativePath)) {
    if (!isTrulyClientComponent && serverComponents.has(noExtRelativePath)) {
      throw new Error(`${relativePath} is used on both client and server`);
    }

    const ast = parser.parse(source, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    traverse.default(ast, {
      ImportDeclaration(p) {
        clientComponents.add(getImportRelativePath(resourcePath, p));
      },
    });

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
      filePath: relativePath,
      componentName: functionName,
    };
    const optionsExpression = getOptionsExpressionLiteral(ctx);

    wasWrapped = true;
    wrapFn(p, WRAPPER_NAME, optionsExpression);
  }

  const innerServerComponents = new Set();

  traverse.default(ast, {
    ImportDeclaration(p) {
      innerServerComponents.add(getImportRelativePath(resourcePath, p));
    },
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

  innerServerComponents.forEach((c) => serverComponents.add(c));

  addImport(ast);
  const output = generate.default(ast);

  return output.code;
}

function isInApp(relativePath) {
  return /^(src(\/|\\))?app(\/|\\)/.test(relativePath);
}

function isRoute(relativePath) {
  return (
    isInApp(relativePath) && /(\/|\\)route\.(c|m)?(t|j)s$/.test(relativePath)
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

function dropExtension(relativePath) {
  return relativePath.replace(/\.[^/.]+$/, "");
}

function getImportRelativePath(resourcePath, p) {
  return dropExtension(
    getRelativePath(
      path.resolve(path.dirname(resourcePath), p.node.source.value)
    )
  );
}
