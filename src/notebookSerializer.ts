import * as vscode from "vscode";

export class NotebookSerializer implements vscode.NotebookSerializer {
  deserializeNotebook(
    content: Uint8Array,
    _token: vscode.CancellationToken
  ): vscode.NotebookData {
    if (content.length === 0) {
      return new vscode.NotebookData([]);
    }
    return new vscode.NotebookData(
      <vscode.NotebookCellData[]>JSON.parse(new TextDecoder().decode(content))
    );
  }

  serializeNotebook(
    data: vscode.NotebookData,
    _token: vscode.CancellationToken
  ): Uint8Array {
    const cells = data.cells.map((cell) => ({
      kind: cell.kind,
      value: cell.value,
      languageId: cell.languageId,
    }));
    return new TextEncoder().encode(JSON.stringify(cells, null, 2));
  }
}
