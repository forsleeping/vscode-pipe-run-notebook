# vscode-pipe-run-notebook README

Pipe Run allows you to perform [`Axios`](https://www.npmjs.com/package/axios) requests / [`Shell`](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback) commands / [`JMESPath`](https://jmespath.org/) extractor / [`JsonCreator`](https://www.npmjs.com/package/json-creator) (a dummy json data creator also written by myself) in a notebook environment in a pipeline style.

Your can define your daily repeatly work (ex. fetch some data by RESTful API calls, then extract and convert data formats and finally post them somewhere else) in cells and view the intermediate results step by step.

Hope this tool will make your life a little easier and happier.

## Usage

Install the extension and create a notebook file ending with `.piperun`

Add some code cells and select the language mode by clicking the right bottom of each cell.

The current suported languages and their documents are below:

- Axios requests
  - More information at https://www.npmjs.com/package/axios
- Shell commands
  - More information at https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
- JMESPath extractor
  - More information at https://jmespath.org/
- JsonCreator
  - A dummy json data creator also written by myself
  - More information at https://www.npmjs.com/package/json-creator

## Extension Settings

Currently this extension needs no settings.
