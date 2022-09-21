# H5P Transcript Library
Library that can be used to add interactive transcript to H5P contents.

PLEASE NOTE: THIS LIBRARY IS THE RESULT OF CONTRACT WORK WITH SPECIFIC REQUIREMENTS THAT MAY NOT MATCH YOUR OWN EXPECTATIONS. WHILE OLIVER IS THE DEVELOPER, HE'S MERELY THE CONTRACTOR WHO ALSO HAPPENED TO PLEAD FOR MAKING THIS CONTENT TYPE OPENLY AVAILABLE - SO YOU CAN USE IT FOR FREE. HOWEVER, HE IS NOT SUPPOSED TO PROVIDE FREE SUPPORT, ACCEPT FEATURE REQUESTS OR PULL REQUESTS. HE MAY DO SO, AND HE WILL PROBABLY ALSO CONTINUE WORKING ON THE CONTENT TYPE, BUT AT HIS OWN PACE.

## Getting started to build the library
Clone this repository with git and check out the branch that you are interested
in (or choose the branch first and then download the archive, but learning
how to use git really makes sense).

Change to the repository directory and run
```bash
npm install
```

to install required modules. Afterwards, you can build the project using
```bash
npm run build
```

or, if you want to let everything be built continuously while you are making
changes to the code, run
```bash
npm run watch
```
Before putting the code in production, you should always run `npm run build`.

The build process will transpile ES6 to earlier versions in order to improve
compatibility to older browsers. If you want to use particular functions that
some browsers don't support, you'll have to add a polyfill.

The build process will also move the source files into one distribution file and
minify the code.

For more information on how to use those distribution files in H5P, please have a look at https://youtu.be/xEgBJaRUBGg and the H5P developer guide at https://h5p.org/library-development.

## Using this library

### Instantiating
This library was explicitly modelled to mimic an H5P content type, so you can
use it as if you were instantiatin H5P subcontent type manually (see https://h5p.org/documentation/api/H5P.html#.newRunnable):

```
H5P.newRunnable(
  params,
  contentId,
  H5P.jQuery(dom),
  false,
  { previousState: previousState }
);
```
where
- `contentId` is required to be the current content's id,
- `previousState` is `{ transcript: { isVisible: <boolean>, isAutoScrollActive: <boolean>, isInteractive: <boolean> } }`
- `dom` is the `HTMLElement` that the transcript should be attached to and
- `params` is expected to follow:

```
{
  library: 'H5P.TranscriptLibrary 1.0', // H5P doesn't evaluate version
  params: {
    instance: <H5P.ContentType>, // Content Type instance
    transcriptFile: <H5P file type of WebVTT file>, // https://h5p.org/semantics#type-file
    behaviour: { maxLines: <number> }, // number of lines in transcript, optional
    l10n: {
      noMedium: <string> // 'No medium was assigned to the transcript.',
      noTranscript: <string> // 'No transcript was provided.',
      troubleWebVTT: <string> // 'There seems to be something wrong with the WebVTT file. Please consult the browser\'s development console for more information.'
    },
    a11y: {
      buttonVisible: <string> // 'Hide transcript. Currently visible.',
      buttonInvisible: <string> // 'Show transcript. Currently not visible.',
      buttonAutoscrollActive: <string> // 'Turn off autoscroll. Currently active.',
      buttonAutoscrollInactive: <string> // 'Turn on autoscroll. Currently not active.',
      buttonInteractive: <string> // 'Switch to plaintext view',
      buttonPlaintext: <string> // 'Switch to interactive transcript view',
      interactiveTranscript: <string> // 'Interactive transcript'
    }
  }
}
```

### External controls
The user controls can be controlled programmatically, and there are some extras. Methods are:

- `show()`: Shows the complete transcript DOM.
- `hide()`: Hides the complete transcript DOM including the toolbar.
- `showTranscripts()`: Shows the transcripts. Transcript DOM may still be hidden though.
- `hideTranscripts()`: Hides the transcripts. Toolbar will remain visible.
- `setAutoScrollActive(state : boolean)`: Turns autoscrolling on (`true`) or off (`false`).
- `setInteractive(state : number)`: Sets the transcript mode (0: interactive transcript, 1: plain text).
- `reset()`: Resets to default values (transcripts visible, autoscrolling: on, interactiv transcript).
- `getCurrentState() : object`: Returns the current state just like an H5P content type would.
