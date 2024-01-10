import {existsSync, PathLike, readFileSync} from 'fs';
import path from 'path';
import {ICliConfig, ZodCliSchema} from './model';

export const doPreChecks = async (
  traceFilesFolderPath: string,
  configFile: string
): Promise<{
  status: 'error' | 'ok';
  message?: string;
  traceFilesFolderPath?: string;
  configPath?: string;
  config?: ICliConfig;
}> => {
  if (!fileExists(traceFilesFolderPath)) {
    return {
      status: 'error',
      message: `Trace file folder path does not exist: ${traceFilesFolderPath}:
      Use --trace-files <path> e.g. --trace-files="./trace_files/"`,
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
      message: `Config file is not valid: ${
        parseResult.error.message ?? JSON.stringify(parseResult.error, null, 2)
      }`,
    };
  }

  // ensure the regexes files exist and is not empty
  if (!fileExists(config.regexes)) {
    return {
      status: 'error',
      message: `The regex text file does not exist: ${config.regexes}`,
    };
  }

  // iterate through each environment_variable and print warning
  // if its undefined

  return {
    status: 'ok',
    traceFilesFolderPath: path.resolve(traceFilesFolderPath),
    configPath: path.resolve(configFile),
    config: parseResult.data,
  };
};

function fileExists(filePath: string): boolean {
  let absolutePath: PathLike;
  try {
    absolutePath = path.resolve(filePath);
  } catch (error) {
    return false;
  }
  return existsSync(absolutePath);
}

function getConfig(configPath: string): ICliConfig {
  const config = readFileSync(path.resolve(path.resolve(configPath)), 'utf-8');
  return JSON.parse(config);
}
export default doPreChecks;
