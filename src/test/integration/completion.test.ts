import * as vscode from 'vscode';
import * as assert from 'assert';
import { expect } from 'chai';
import { getDocUri, open } from '../helper';

suite('completion', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('type completion', async () => {
    const wanted = new vscode.CompletionList([
      new vscode.CompletionItem(
        '"Microsoft.Addons/supportProviders/supportPlanTypes@2018-03-01"',
        vscode.CompletionItemKind.Value,
      ),
      new vscode.CompletionItem(
        '"Microsoft.Addons/supportProviders/supportPlanTypes@2017-05-15"',
        vscode.CompletionItemKind.Value,
      ),
    ]);

    const docUri = getDocUri('main.tf');
    await open(docUri);
    await new Promise(r => setTimeout(r, 1000 * 5));
    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(23 - 1, 62 - 1),
    );

    assert.ok(list);
    expect(list).not.to.be.undefined;
    expect(list.items).not.to.be.undefined;
    expect(list.items.length).to.be.greaterThanOrEqual(1);

    for (let index = 0; index < list.items.length; index++) {
      const element: vscode.CompletionItem = list.items[index];
      assert.ok(element);
      expect(element).not.to.be.undefined;

      const w = wanted.items[index];
      assert.ok(w);
      expect(w).not.to.be.undefined;
      assert.strictEqual(element.kind, w.kind);
      // this can either be a string or a vscode.CompletionItemLabel, so use deep
      assert.deepStrictEqual(element.label, w.label);
    }
  });
});
