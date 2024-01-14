import winston, {format} from 'winston';
const {combine, timestamp, colorize, align, printf} = format;

export const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    colorize({all: true}),
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    align(),
    /* v8 ignore next */
    printf(debug => `[${debug.timestamp}] ${debug.level}: ${debug.message}`)
  ),
  transports: [new winston.transports.Console()],
});
