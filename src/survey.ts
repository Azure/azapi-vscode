import * as vscode from 'vscode';
import { config } from './vscodeUtils';

export async function ShouldShowSurvey(): Promise<boolean> {
  let currentConfig: any = config('azapi').get('survey');
  if (
    currentConfig == undefined ||
    currentConfig.surveyPromptDate == undefined ||
    currentConfig.surveyPromptDate == 'none'
  ) {
    currentConfig = {};
    // first time, remind after 10 days
    const promptDate = new Date();
    promptDate.setDate(promptDate.getDate() + 10);
    currentConfig.surveyPromptDate = promptDate.toISOString();
    currentConfig.surveyPromptIgnoredCount = 0;
    await config('azapi').update('survey', currentConfig, vscode.ConfigurationTarget.Global);
    return false;
  }

  if (currentConfig.surveyPromptDate == 'never') {
    return false;
  }

  const currentDate = new Date();
  const promptDate = new Date(currentConfig.surveyPromptDate);
  if (currentDate >= promptDate) {
    return true;
  }

  return false;
}

export async function ShowSurvey(): Promise<void> {
  const reloadMsg =
    'Looks like you are using Terraform AzAPI Provider. We’d love to hear from you! Could you help us improve product usability by filling out a 2-3 minute survey about your experience with it?';
  const selected = await vscode.window.showInformationMessage(reloadMsg, 'Yes', 'Not Now', 'Never');
  let currentConfig: any = config('azapi').get('survey');
  if (currentConfig == undefined) {
    currentConfig = {};
    currentConfig.surveyPromptDate = 'none';
    currentConfig.surveyPromptIgnoredCount = 0;
  }

  const nextPromptDate = new Date();

  switch (selected) {
    case 'Yes':
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://aka.ms/AzAPI2025'));
      // reset the survey prompt date and ignored count, remind after 180 days
      currentConfig.surveyPromptIgnoredCount = 0;
      nextPromptDate.setDate(nextPromptDate.getDate() + 180);
      currentConfig.surveyPromptDate = nextPromptDate.toISOString();
      break;
    case 'Never':
      currentConfig.surveyPromptDate = 'never';
      currentConfig.surveyPromptIgnoredCount = 0;
      break;
    case 'Not Now':
    case undefined:
      currentConfig.surveyPromptIgnoredCount++;
      if (currentConfig.surveyPromptIgnoredCount == 1) {
        // first time ignore, remind after 7 days
        nextPromptDate.setDate(nextPromptDate.getDate() + 7);
        currentConfig.surveyPromptDate = nextPromptDate.toISOString();
      } else {
        // second time ignore, remind after 30 days
        nextPromptDate.setDate(nextPromptDate.getDate() + 30);
        currentConfig.surveyPromptDate = nextPromptDate.toISOString();
      }
      break;
  }
  await config('azapi').update('survey', currentConfig, vscode.ConfigurationTarget.Global);
}
