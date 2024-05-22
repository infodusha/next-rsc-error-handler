import { dirname, resolve, relative } from "node:path";
import typescript from "typescript";

const { findConfigFile, parseJsonConfigFileContent, readConfigFile, sys } =
  typescript;

function loadTSConfig() {
  const configFileName = findConfigFile(process.cwd(), sys.fileExists);
  if (!configFileName) {
    return null;
  }
  const configFile = readConfigFile(configFileName, sys.readFile);
  const directory = dirname(configFileName);
  const options = parseJsonConfigFileContent(configFile.config, sys, directory);
  return options;
}

const tsConfig = loadTSConfig();

const fns = tsConfig
  ? Object.entries(tsConfig.options.paths).map(prepareRegex)
  : [];

function prepareRegex(paths) {
  const [key, [value]] = paths;
  const from = new RegExp(escapeRegExp(key).replace("*", "(.*)"));
  const to = relative(
    process.cwd(),
    resolve(tsConfig.options.baseUrl, value.replace("*", "$$1"))
  );
  return (x) => {
    if (from.test(x)) {
      return x.replace(from, to);
    }
    return null;
  };
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&");
}

export function resolveTsAlias(value) {
  for (const fn of fns) {
    const result = fn(value);
    if (result) {
      return result;
    }
  }
  return value;
}
