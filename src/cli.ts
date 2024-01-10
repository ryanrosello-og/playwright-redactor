import {Command} from 'commander';
import winston from 'winston';
import doPreChecks from './cli_prechecks';
import {ICliConfig} from './model';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

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
    // Do stuff
    logger.debug(config);
  });

program.parse();
