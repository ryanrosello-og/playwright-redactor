import {Command} from 'commander';
import {ICliConfig} from './model';
import {doPreChecks} from './cli_prechecks';
import {logger} from './logger';
import {Redactor} from './Redactor';

const program = new Command();
const name = 'playwright-redactor';
const version = '1.0.0';

program
  .name(name)
  .version(version)
  .description('🧹 Remove sensitive data from your Playwright trace files')
  .option(
    '-c, --config <path>',
    'Configuration file for the CLI app e.g ./config.json'
  )
  .option(
    '-t, --trace-files <path>',
    'Folder path containing the trace files that require scrubbing'
  )
  .option(
    '-r, --regexes <path>',
    'Path to a file containing regexes to redact from the trace files'
  )
  .option('-v, --version', `${name} @ ${version}`)
  .action(async options => {
    const preCheckResult = await doPreChecks(
      options.regexes,
      options.traceFiles,
      options.config
    );
    const config: ICliConfig = preCheckResult.config!;
    if (preCheckResult.status === 'error') {
      throw new Error(`❌ ${preCheckResult.message}`);
    }
    const redactor = new Redactor(options.traceFile, options.regexes, config);
    const result = redactor.redact();
    if (result.totalMatches === 0) {
      logger.info(
        `✅ Redactor completed - no redactions were made [${result.duration}]`
      );
      return;
    }
    for (const table of result.redactions) {
      table.printTable();
      console.log('\n'); // leave a gap between each table
    }
    logger.info(
      `✅ Redactor completed [${result.duration}]
      Total files: ${result.totalFiles}
      Total matches: ${result.totalMatches}
      `
    );
  });

program.parse();
