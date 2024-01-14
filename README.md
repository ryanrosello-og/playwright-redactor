# playwright-redactor
🤐
**[ALl of the badges here]**

This is a tool that can be used to redact sensitive information from your Playwright trace files.

**[Insert without/with redaction screenshot here]**

### Oddly specific use case

* You work for an organization that has a strict policy on storing sensitive information at rest and your trace files have been flagged by the security team for containing sensitive information e.g. production credentials
* You want to share the trace files generated by your tests with strangers on the internet for debugging purposes but you need to redact the sensitive information first
* You would like to store your traces files using a provider e.g. s3. But you have trust issues and you don't want to store sensitive information in the cloud
* Scrub PII information

## Usage

Ideally, you would invoke this app as part of your CI/CD pipeline as soon as Playwright has finished generated the trace files using the following command.

```bash
npx playwright-redactor -c ./config.json -t ./traces -r ./regexes.txt
```

The command above will redact the sensitive information from the trace files in the `./traces` folder using the configuration in the `./config.json` file.

## Command line options

| Options  |          |
| -------- | -------- |
| `-r, --regexes <path>`   | Path to the text file containing the regular expression used for replacement.  Each regex separated by a new line   |
|`-c, --config <path>`   | Path to config file  |
|`-t, --trace-files <path>`   | Folder path containing the trace files that require scrubbing  |


## Config file

The config file is a JSON file that contains the following properties:

```json
{
  "full_redaction": true,
  "logLevel": "debug",
  "environment_variables": [
    "SUPER_SECRET_PASSWORD",
    "SUPER_SECRET_API_KEY",
    "MY_APP_SECRET",
    "SALESFORCE_API_KEY"
  ]
}
```

The config file above will perform a full redaction whenever a regex is matched using the regexes defined in the array. It will also redact the environment variables listed in the `environment_variables` array.

| Options  |          |
| -------- | -------- |
| `full_redaction`   | **REQUIRED:** When set to `true`, a matched regex will be replaced with <REDACTED>. When set to `false`, the app will obscure large parts of the secret. For example: `password1234` will be redaced as `pa******32`   |
|`environment_variables`   | **OPTIONAL:** The value of these environment variables will be redacted from the trace files  |
|`regexes`   | **REQUIRED:** A text file where all of the regexes are defined. See details below.  |

## Regex file

The regex file will contain a list of regexes that will be used to replace the text in the trace files separated by a newline. The following example will search for super_password followed by 3 digits and replace it with <REDACTED>. It will also search for all GUIDs and replace it with <REDACTED>.  Lastly, it will search for all JWTs and replace it with <REDACTED>.

```text
super_[AB]_password\d{3}
^(?:\{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}\}{0,1})$
^(?:[\w-]*\.[\w-]*\.[\w-]*)$
```

## ⚠️ WARNING 🐊 - ACHTUNG !!

In all cases, the redaction of passwords and other sensitive information may not enough to protect your data. You should always be careful when sharing trace files with strangers on the internet. As an extra precaution, try and scrub session information e.g jwt token, cookies etc from your trace files.