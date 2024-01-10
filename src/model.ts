import {z} from 'zod';

export interface ICliConfig {
  log_level: LogLevel;
  environment_variables?: Array<string>;
  regexes: string;
  full_redaction: boolean;
}
type LogLevel =
  | 'emerg'
  | 'alert'
  | 'crit'
  | 'error'
  | 'warning'
  | 'notice'
  | 'info'
  | 'debug';

export const ZodCliSchema = z.object({
  log_level: z.enum([
    'emerg',
    'alert',
    'crit',
    'error',
    'warning',
    'notice',
    'info',
    'debug',
  ]),
  environment_variables: z.array(z.string()).nonempty().optional(),
  regexes: z.string(),
  full_redaction: z.boolean().default(true),
});
