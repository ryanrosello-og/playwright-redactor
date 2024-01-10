export class Redactor {
  constructor() {}

  public redact(traceFolderPath: string): string {
    // for each trace file in the folder:
    //   unzip to a temp folder
    //     for each file in the temp folder:
    //       for each regex in the regex file: (or munge all regex into single regex)
    //         if full_redact or partial_redact:
    //            do regex replace on the file
    //       for each env var in the environment_variables array
    //         if full_redact or partial_redact:
    //            do regex replace on the file
    //       save the file
    //   re-zip the file using original name
    //   delete the temp folder
    //   update the stats

    const result = [
      {
        trace: 'trace1.zip',
        file: 'file1',
        lines: [
          {
            line: 1,
            text: 'text1',
            matches: [
              {
                regex: 'regex1',
                match: 'match1',
              },
            ],
          },
        ],
      },
    ];
    return 'todo';
  }
}
