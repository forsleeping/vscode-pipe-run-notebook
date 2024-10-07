import * as vscode from "vscode";
import { NotebookKernel } from "./notebookKernel";
import { NotebookSerializer } from "./notebookSerializer";

interface NotebookDef {
  type: string;
}

interface PackageJsonDef {
  name: string;
  displayName: string;
  description: string;
  contributes: {
    notebooks: NotebookDef[];
  };
}

export function activate(context: vscode.ExtensionContext) {
  const packageJSONDef = <PackageJsonDef>context.extension.packageJSON;
  const [notebookDef, ..._] = packageJSONDef.contributes.notebooks;
  const serializer = vscode.workspace.registerNotebookSerializer(
    notebookDef.type,
    new NotebookSerializer()
  );
  const kernel = new NotebookKernel(
    notebookDef.type,
    packageJSONDef.displayName,
    packageJSONDef.description
  );
  context.subscriptions.push(serializer, kernel);
}

export function deactivate() {}
