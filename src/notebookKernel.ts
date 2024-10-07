import axios from "axios";
import { exec } from "child_process";
import { dirname } from "path";
import { promisify } from "util";
import * as vscode from "vscode";

// import libraries with no type annotations
const jsonCreator = require("json-creator").default;
const jmespath = require("jmespath");

const pExec = promisify(exec);

enum SupportedLanguages {
  Axios = "axios",
  JMESPath = "jmespath",
  JsonCreator = "json-creator",
  Shell = "shell",
}

type ExecutionHandler = (
  cell: vscode.NotebookCell,
  execution: vscode.NotebookCellExecution
) => Promise<any>;

export class NotebookKernel {
  readonly id = "pipe-run-kernel";

  private readonly _controller: vscode.NotebookController;
  private readonly _exeutionResult: any[] = [];
  private _exeutionOrder: number = 0;

  constructor(notebookType: string, label: string, description?: string) {
    this._controller = vscode.notebooks.createNotebookController(
      this.id,
      notebookType,
      label
    );

    this._controller.description = description;
    this._controller.supportedLanguages = Object.values(SupportedLanguages);
    this._controller.supportsExecutionOrder = true;
    this._controller.executeHandler = this._executeAll.bind(this);
  }

  dispose(): void {
    this._controller.dispose();
  }

  private async _doExecution(
    cell: vscode.NotebookCell,
    handler: ExecutionHandler
  ): Promise<void> {
    const execution = this._controller.createNotebookCellExecution(cell);
    execution.executionOrder = ++this._exeutionOrder;
    let succeeded = false;
    try {
      execution.start(Date.now());
      const cellResult = await handler(cell, execution);
      const outputItem =
        typeof cellResult === "string"
          ? vscode.NotebookCellOutputItem.text(cellResult)
          : vscode.NotebookCellOutputItem.json(cellResult);
      execution.replaceOutput(new vscode.NotebookCellOutput([outputItem]));
      this._exeutionResult[cell.index] = cellResult;
      succeeded = true;
    } catch (err: any) {
      execution.replaceOutput(
        new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.error(err),
        ])
      );
    } finally {
      execution.end(succeeded, Date.now());
    }
  }

  private async _executeAll(cells: vscode.NotebookCell[]): Promise<void> {
    function unreachable(_: never) {}
    for (const cell of cells) {
      const languageId = <SupportedLanguages>cell.document.languageId;
      switch (languageId) {
        case SupportedLanguages.Axios:
          await this._doExecution(cell, this._axiosHandler);
          break;
        case SupportedLanguages.JMESPath:
          await this._doExecution(cell, this._jmespathHandler);
          break;
        case SupportedLanguages.JsonCreator:
          await this._doExecution(cell, this._jsonCreatorHandler);
          break;
        case SupportedLanguages.Shell:
          await this._doExecution(cell, this._shellHandler);
          break;
        default:
          unreachable(languageId);
      }
    }
  }

  private _axiosHandler: ExecutionHandler = async (
    cell: vscode.NotebookCell,
    execution: vscode.NotebookCellExecution
  ) => {
    const abortController = new AbortController();
    execution.token.onCancellationRequested(() => abortController.abort());
    const options = JSON.parse(cell.document.getText());
    const response = await axios({
      ...options,
      signal: abortController.signal,
    });
    const cellResult = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: JSON.parse(response.data),
    };
    return cellResult;
  };

  private _jmespathHandler: ExecutionHandler = async (
    cell: vscode.NotebookCell,
    _execution: vscode.NotebookCellExecution
  ) => {
    const data = this._exeutionResult[cell.index - 1];
    const jpath = cell.document.getText();
    const result = jmespath.search(data, jpath);
    return result;
  };

  private _jsonCreatorHandler: ExecutionHandler = async (
    cell: vscode.NotebookCell,
    _execution: vscode.NotebookCellExecution
  ) => {
    const data = this._exeutionResult[cell.index - 1];
    const jtemplate = JSON.parse(cell.document.getText());
    const [result, err] = jsonCreator(jtemplate, data);
    if (err.length) {
      throw new Error(err);
    }
    return result;
  };

  private _shellHandler: ExecutionHandler = async (
    cell: vscode.NotebookCell,
    _execution: vscode.NotebookCellExecution
  ) => {
    const command = cell.document.getText();
    const { stdout, stderr } = await pExec(command, {
      cwd: this._getWorkDir(),
    });
    if (stderr) {
      throw new Error(stderr);
    }
    return stdout;
  };

  _getWorkDir() {
    return (
      vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath ||
      dirname(vscode.window.activeTextEditor?.document?.uri?.fsPath!)
    );
  }
}
