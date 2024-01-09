import {Command} from 'commander';

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
  .option('-v, --version', `${name} @ ${version}`)
  .action(async options => {
    // Do stuff
    console.log({options});
  });

program.parse();
