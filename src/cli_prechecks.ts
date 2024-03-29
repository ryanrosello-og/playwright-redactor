import {existsSync, PathLike, readFileSync} from 'fs';
import path from 'path';
import {ICliConfig, ZodCliSchema} from './model';

export const doPreChecks = async (
  regexes: string,
  traceFilesFolderPath: string,
  configFile: string
): Promise<{
  status: 'error' | 'ok';
  message?: string;
  traceFilesFolderPath?: string;
  configPath?: string;
  config?: ICliConfig;
  allEnvironmentVariablesDefined?: boolean;
}> => {
  if (!fileExists(traceFilesFolderPath)) {
    return {
      status: 'error',
      message: `Trace file folder path does not exist: ${traceFilesFolderPath}:
      Use --trace-files <path> e.g. --trace-files="./trace_files/"`,
    };
  }

  if (!fileExists(regexes)) {
    return {
      status: 'error',
      message: `The text file containing the regexes does not exist: ${traceFilesFolderPath}:
      Use --regexes <path> e.g. --regexes="./regex_redact.txt"`,
    };
  }

  if (!fileExists(configFile)) {
    return {
      status: 'error',
      message: `Config file does not exist: ${configFile}`,
    };
  }

  const parseResult = {success: false, error: undefined, data: undefined};
  let config: ICliConfig;
  try {
    config = getConfig(configFile);
    parseResult.data = ZodCliSchema.parse(config);
    parseResult.success = true;
  } catch (error) {
    parseResult.success = false;
    parseResult.error = error;
  }

  if (!parseResult.success) {
    return {
      status: 'error',
      message: `Config file is not valid: ${JSON.stringify(
        parseResult.error,
        null,
        2
      )}`,
    };
  }

  // iterate through each environment_variable and print warning
  // if its undefined
  let allEnvironmentVariablesDefined = true;
  for (const e of config.environment_variables) {
    if (process.env[e] === undefined) {
      console.warn(
        `WARNING: Environment variable ${e} is not defined in your shell.`
      );
      allEnvironmentVariablesDefined = false;
    }
  }

  return {
    status: 'ok',
    traceFilesFolderPath: path.resolve(traceFilesFolderPath),
    configPath: path.resolve(configFile),
    config: parseResult.data,
    allEnvironmentVariablesDefined,
  };
};

export function fileExists(filePath: string): boolean {
  let absolutePath: PathLike;
  try {
    absolutePath = path.resolve(filePath);
  } catch (error) {
    return false;
  }
  return existsSync(absolutePath);
}

export function getConfig(configPath: string): ICliConfig {
  const config = readFileSync(path.resolve(path.resolve(configPath)), 'utf-8');
  return JSON.parse(config);
}
