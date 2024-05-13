import path from "node:path";

import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

import {
  containsServerActions,
  getRelativePath,
  isClientComponent,
  isReactElement,
  isServerAction,
  wrapWithFunction,
} from "./utils.js";

export default function (source) {
  const options = this.getOptions();
  //   const callback = this.async();

  if (isClientComponent(source)) {
    return source;
  }

  const resourcePath = this.resourcePath;

  const globalHandlerPath = path.resolve("app", options.globalHandler);
  this.addDependency(globalHandlerPath);

  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  let shouldAddImport = true;
  let wasWrapped = false;

  traverse.default(ast, {
    enter(path) {
      if (path.isImportDeclaration()) {
        const importPath = path.node.source.value;
        if (importPath === "next-rsc-error-handler") {
          shouldAddImport = false;
        }
      }

      if (!path.isFunctionDeclaration() && !path.isArrowFunctionExpression()) {
        return;
      }

      const functionName = path.isFunctionDeclaration()
        ? path.node.id?.name
        : path.parentPath?.isVariableDeclarator() &&
          path.parentPath.node.id.type === "Identifier"
        ? path.parentPath.node.id?.name
        : "unknown";

      const buildContext = {
        buildId: options.buildId,
        dev: options.dev,
        nextRuntime: options.nextRuntime,
        filePath: getRelativePath(resourcePath),
        kind: options.kind,
        workspaceId: options.workspaceId,
        functionName,
      };

      let shouldWrap = true; // FIXME should be false ??

      if (buildContext.kind === "page-component" && isReactElement(path)) {
        shouldWrap = true;
      }

      if (buildContext.kind === "server-component" && isReactElement(path)) {
        shouldWrap = true;
      }

      if (
        buildContext.kind === "server-action" &&
        containsServerActions(source) && // TODO: refactor, remove or move to top
        isServerAction(path)
      ) {
        // TODO: inline server actions have names like $$ACTION_0, $$ACTION_1, etc.
        // we should set a human readable name
        shouldWrap = true;
      }

      if (!shouldWrap) {
        return;
      }

      wasWrapped = true;
      wrapWithFunction(path, "__rscWrapper", buildContext);
      path.skip();
    },
  });

  if (shouldAddImport && wasWrapped) {
    const wrapperImports = t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("__rscWrapper"),
          t.identifier("__rscWrapper")
        ),
      ],
      t.stringLiteral("next-rsc-error-handler/src/wrapper.js")
    );

    ast.program.body.unshift(wrapperImports);
  }

  const output = generate.default(ast);
  return output.code;
}
