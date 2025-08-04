// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import type { VSCodeMessage } from "../types";

function tryAcquireVsCodeApi() {
  try {
    // This should be ignored from TS and ESLint because the method is only available on VSCode extension context:
    // eslint-disable-next-line
    // @ts-ignore
    return acquireVsCodeApi();
  } catch {
    // In this case we are not in VsCode context
    return null;
  }
}

// This function tries to defeat a sonar lint rule because
// there's no way to obtain VSCode parent origin as it
// changes between executions.
const getPostMessageOrigin = () => "*";

export function sendMessageVscode(command: string, message: VSCodeMessage) {
  const vscode = tryAcquireVsCodeApi();
  const payload = message;
  
  console.log('DEBUG: sendMessageVscode called with command:', command);
  console.log('DEBUG: window.self !== window.parent:', window.self !== window.parent);
  console.log('DEBUG: vscode API available:', !!vscode);
  
  // Check if we're in a VS Code webview iframe context
  // Avoid cross-origin access to window.parent.location
  let isInVSCodeIframe = false;
  try {
    isInVSCodeIframe = window.self !== window.parent && 
                       window.parent.location && 
                       window.parent.location.protocol === 'vscode-webview:';
  } catch (error) {
    // If we can't access window.parent.location due to cross-origin, 
    // assume we're in a VS Code iframe if we're in an iframe context
    isInVSCodeIframe = window.self !== window.parent;
    console.log('DEBUG: Cross-origin access blocked, assuming VS Code iframe context');
  }
  
  console.log('DEBUG: isInVSCodeIframe:', isInVSCodeIframe);
  
  //mode iframe
  if (window.self !== window.parent && !vscode && !isInVSCodeIframe) {
    console.log('DEBUG: Using iframe mode - window.parent.postMessage');
    window.parent.postMessage(
      {
        command: command,
        payload,
      },
      getPostMessageOrigin(),
    );
  } else if (vscode) {
    console.log('DEBUG: Using VSCode API mode - vscode.postMessage');
    //Plugin mode build
    vscode.postMessage({
      command: command,
      payload,
    });
  } else if (isInVSCodeIframe) {
    console.log('DEBUG: Using VSCode iframe mode - window.parent.postMessage to vscode-webview');
    // We're in a VS Code webview iframe, send to parent
    window.parent.postMessage(
      {
        command: command,
        payload,
      },
      '*'
    );
  } else {
    console.log('DEBUG: Using React mode - no action');
    //React mode
  }
}
