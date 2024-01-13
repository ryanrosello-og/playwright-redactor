import fs from 'fs';
import path from 'path';
import {
  cleanFolder,
  findFilesInDirectory,
  getZipTargetFolder,
  readFile,
  unzip,
  writeToFile,
  zip,
} from './fs_helper';
import {ICliConfig} from './model';
import {getConfig} from './cli_prechecks';
import {REDACTED, REDACT_FILE_EXT} from './constants';
import {logger} from './logger';
export class Redactor {
  regexes: string[] = [];
  config: ICliConfig;
  constructor(
    private traceFolderPath: string,
    private regexFile: string,
    private conf: string | ICliConfig
  ) {
    const data = fs.readFileSync(this.regexFile, 'utf8');
    this.regexes = data.split('\n');
    if (typeof this.conf === 'string') {
      this.config = getConfig(this.conf);
    } else {
      this.config = this.conf;
    }
  }

  redact() {
    const result = {
      totalFiles: 0,
      totalFilesRedacted: 0,
      redactions: [],
    };
    const traceFiles = this.getAllZipFiles(this.traceFolderPath);
    for (const traceFile of traceFiles) {
      result.redactions.concat(this.redactTraceFile(traceFile));
    }

    return result;
  }

  redactTraceFile(traceFile: string) {
    unzip(traceFile);
    const zipFolder = getZipTargetFolder(traceFile);
    const replacements = this.applyRegexes(zipFolder);
    zip(zipFolder);
    cleanFolder(zipFolder);
    return replacements;
  }

  applyRegexes(zipFolder: string) {
    const filesForRedaction = findFilesInDirectory(zipFolder, REDACT_FILE_EXT);
    const result = [];
    for (const file of filesForRedaction) {
      const readFileResult = readFile(file);
      if (readFileResult.success) {
        // Apply regexes from the regex file first
        const regexResult = this.applyRegex(file, readFileResult.data);
        if (regexResult.replacements.length > 0) {
          regexResult.replacements.length > 0 ?? result.push({...regexResult});
          writeToFile(file, regexResult.fileContents);
        }

        // Using the modified outcome from above, apply the env var regexes
        const regexEnvsResult = this.applyEnvVarRegex(
          file,
          regexResult.fileContents
        );
        if (regexEnvsResult.replacements.length > 0) {
          regexEnvsResult.replacements.length > 0 ??
            result.push({...regexEnvsResult});
          writeToFile(file, regexEnvsResult.fileContents);
        }
      } else {
        logger.warn(
          `Unable to read file ${file}, skipping.  Error: [${readFileResult?.error}]`
        );
      }
    }
    return result;
  }

  applyRegex(file: string, fileContents: string) {
    const replacements = [];
    for (const regex of this.regexes) {
      const redactionResult = this.doRegexReplace(
        fileContents,
        new RegExp(regex, 'g')
      );

      if (redactionResult.matchCount > 0) {
        replacements.push({
          file,
          regex,
          matchCount: redactionResult.matchCount,
        });
      }

      fileContents = redactionResult.redactedContent;
    }
    return {
      replacements,
      fileContents,
    };
  }

  applyEnvVarRegex(file: string, fileContents: string) {
    const replacements = [];
    for (const e of this.config.environment_variables) {
      if (!process.env[e]) continue;

      const redactionResult = this.doRegexReplace(
        fileContents,
        new RegExp(process.env[e], 'g')
      );

      if (redactionResult.matchCount > 0) {
        replacements.push({
          file,
          regex: e,
          matchCount: redactionResult.matchCount,
        });
      }

      fileContents = redactionResult.redactedContent;
    }
    return {
      replacements,
      fileContents,
    };
  }

  doRegexReplace(
    fileContents: string,
    regex: RegExp
  ): {
    redactedContent: string;
    matchCount: number;
  } {
    let matchCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const redactedContent = fileContents.replaceAll(regex, match => {
      matchCount++;
      return this.config.full_redaction
        ? REDACTED
        : this.applyPartialRedaction(match);
    });

    return {redactedContent, matchCount};
  }

  applyPartialRedaction(input: string) {
    const startLength = 2;
    const endLength = 2;
    const maskCharacter = '*';

    if (input.length <= startLength + endLength) {
      return '****';
    }

    const start = input.substring(0, startLength);
    const end = input.substring(input.length - endLength);
    const masked = maskCharacter.repeat(input.length - startLength - endLength);

    return start + masked + end;
  }

  getAllZipFiles(dirPath: string, zipFiles?: string[]): string[] {
    const files = fs.readdirSync(dirPath);

    zipFiles = zipFiles || [];

    files.forEach(file => {
      if (fs.statSync(dirPath + '/' + file).isDirectory()) {
        zipFiles = this.getAllZipFiles(dirPath + '/' + file, zipFiles);
      } else {
        if (path.extname(file) === '.zip') {
          zipFiles.push(path.join(dirPath, '/', file));
        }
      }
    });

    return zipFiles;
  }
}
