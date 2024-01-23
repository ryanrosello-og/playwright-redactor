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
import {Table} from 'console-table-printer';

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

  async redact() {
    let result = {
      duration: '',
      totalFiles: 0,
      totalMatches: 0,
      redactions: [],
    };
    const redactions: Array<Table> = [];
    let totalMatches = 0;
    const startTime = performance.now();
    const traceFiles = this.getAllZipFiles(this.traceFolderPath);
    for (const traceFile of traceFiles) {
      const reduction = await this.redactTraceFile(traceFile);
      totalMatches += reduction.reduce(
        (sum, redaction) => sum + redaction.matchCount,
        0
      );
      const redactionTable = new Table({
        title: traceFile,
      });
      redactionTable.addRows(reduction);
      redactions.push(redactionTable);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    result = {
      ...result,
      duration: this.humanizeDuration(executionTime),
      redactions,
      totalFiles: redactions.length,
      totalMatches,
    };

    return result;
  }

  async redactTraceFile(traceFile: string) {
    unzip(traceFile);
    const zipFolder = getZipTargetFolder(traceFile);
    const replacements = await this.applyRegexes(zipFolder);
    zip(zipFolder);
    cleanFolder(zipFolder);
    return replacements;
  }

  async applyRegexes(zipFolder: string) {
    const filesForRedaction = findFilesInDirectory(zipFolder, REDACT_FILE_EXT);
    const result = [];
    const promises = [];
    for (const file of filesForRedaction) {
      promises.push(this.regexFileContents(file));
    }
    const parallelPromises = 5;
    for (let i = 0; i < promises.length; i += parallelPromises) {
      const batch = promises.slice(i, i + parallelPromises);
      const batchResult = await Promise.all(batch);
      result.push(...batchResult.flat());
    }

    return result;
  }

  async regexFileContents(file: string) {
    const result = [];

    const readFileResult = readFile(file);
    if (readFileResult.success) {
      // Apply regexes from the regex file first
      const regexResult = this.applyRegex(
        file,
        this.decodeContent(file, readFileResult.data)
      );
      if (regexResult.replacements.length > 0) {
        result.push(...regexResult.replacements);
        writeToFile(file, regexResult.fileContents);
      }

      // Using the modified outcome from above, apply the env var regexes
      const regexEnvsResult = this.applyEnvVarRegex(
        file,
        this.decodeContent(file, regexResult.fileContents)
      );
      if (regexEnvsResult.replacements.length > 0) {
        result.push(...regexEnvsResult.replacements);
        writeToFile(file, regexEnvsResult.fileContents);
      }
    } else {
      logger.warn(
        `Unable to read file ${file}, skipping.  Error: [${readFileResult?.error}]`
      );
    }
    return result;
  }

  decodeContent(file: string, fileContents: string) {
    return file.endsWith('.dat')
      ? decodeURIComponent(fileContents)
      : fileContents;
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
      const envVarEscaped = this.escapeRegExp(process.env[e]);
      const redactionText = this.applyRedaction(envVarEscaped);
      const redactionResult = fileContents.replaceAll(
        envVarEscaped,
        redactionText
      );
      const matchCount = this.getRedactionCount(redactionResult, redactionText);
      if (redactionResult !== fileContents) {
        replacements.push({
          file,
          regex: e,
          matchCount,
        });
      }

      fileContents = redactionResult;
    }
    return {
      replacements,
      fileContents,
    };
  }

  getRedactionCount(fileContents: string, redaction: string): number {
    const array = fileContents.split(redaction);
    return array.length - 1;
  }

  escapeRegExp(str: unknown) {
    return String(str);
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
      return this.applyRedaction(match);
    });

    return {redactedContent, matchCount};
  }

  applyRedaction(input: string) {
    if (this.config.full_redaction) {
      return REDACTED;
    }

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

  humanizeDuration(milliseconds: number) {
    if (milliseconds < 1000) return `${Math.floor(milliseconds)} ms`;

    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);

    const humanized = [
      minutes > 0 ? `${minutes} minute(s)` : '',
      seconds > 0 ? `${seconds} second(s)` : '',
    ]
      .filter(str => str)
      .join(', ');

    return humanized;
  }
}
