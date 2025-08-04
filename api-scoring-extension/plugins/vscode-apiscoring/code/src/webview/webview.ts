// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import * as vscode from 'vscode';

export type ValidationModuleType = {
    apiName: string;
    definitionPath?: string;
    validationType: string;
};

export type ValidationFileModuleType = {
    filePath: string;
    apiProtocol: string;
};

/**
 * VSCode to frontend communication.
 */
export interface CertificationFrontendIface {
    show(pathname: string): void;
    setCertificationResults(payload: { metadata: any; rootPath: string; results: any }): void;
    setModuleResults(payload: { apiModule: ValidationModuleType; results: any }): void;
    throwExtensionError(payload: Error): void;

    setValidationRules(results: any): void;
    setFileResults(results: any): void;
    setValidationRulesError(payload: Error): void;
    setFileResultsError(payload: Error): void;
    onFileLoaded(payload: any): void;
}

/**
 * Frontend to VSCode communication.
 */
export interface CertificationFrontendControllerIface {
    setCertificationFrontend(frontend: CertificationFrontendIface): void;
    onProjectLoaded?(): void; // this is handled in html/iframe
    onFileLoaded?(): void; // this is handled in html/iframe
    onClickValidateModule(payload: ValidationModuleType): void;
    onClickOpenFile(payload: { fileName: string; infoPosition: { line: string; char: string; lastLine: string; lastchar: string } }): void;

    getValidationRules(): void;
    onClickValidateFile(payload: ValidationFileModuleType): void;
}

export class CertificationServiceWebView implements CertificationFrontendIface {
    panel?: vscode.WebviewPanel;
    private iframeLoaded = false;
    private iframeQueue: Array<{ command: string; payload: any }> = [];

    constructor(private context: vscode.ExtensionContext, private presenter: CertificationFrontendControllerIface) {
        console.log('[VSCE] CertificationServiceWebView constructor');
    }

    show(pathname: string) {
        console.log('[VSCE] show() invocado');
        if (this.panel) {
            if (!this.panel.visible) {
                this.panel.reveal(this.panel.viewColumn);
            }
            return;
        }

        this.panel = vscode.window.createWebviewPanel('apiscoring', 'APIScoring Certification', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        let url = vscode.workspace.getConfiguration('apiScoring.certification.frontend').get<string>('url');
        if (url?.substring(url.length - 1) === "/") {
            url = url.substring(0, url.length - 1);
        }
        this.panel.webview.html = this.getHtml(url! + pathname);

        this.panel.webview.onDidReceiveMessage(
            message => {
                console.log('[VSCE] Mensaje recibido del webview:', message);
                // Handshake desde el iframe
                if (message.command === 'onProjectLoaded') {
                    this.iframeLoaded = true;
                    console.log('[VSCE] onProjectLoaded recibido. Procesando cola de mensajes TypeScript:', this.iframeQueue);
                    console.log('[VSCE] Tamaño de la cola TypeScript:', this.iframeQueue.length);
                    // Enviar todos los mensajes encolados
                    this.iframeQueue.forEach(msg => {
                        console.log('[VSCE] Enviando mensaje encolado al webview:', msg);
                        this.panel?.webview.postMessage(msg);
                    });
                    this.iframeQueue = [];
                    return;
                }
                const callback = (this.presenter as any)[message.command];
                if (callback && typeof callback === 'function') {
                    console.log('[VSCE] Ejecutando callback para comando:', message.command);
                    callback(message.payload);
                } else {
                    console.error(`[VSCE] Unknown callback command: ${message.command}`);
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            console.log('[VSCE] Webview panel disposed. Reseteando estado interno.');
            this.panel = undefined;
            this.iframeLoaded = false;
            this.iframeQueue = [];
        });
    }

    private postCommand(command: string, payload: any) {
        console.log('[VSCE] postCommand invocado:', { command, payload, iframeLoaded: this.iframeLoaded });
        if (this.iframeLoaded) {
            console.log('[VSCE] Enviando mensaje inmediato al webview:', { command, payload });
            this.panel?.webview.postMessage({ command, payload });
        } else {
            console.log('[VSCE] Iframe no listo, encolando mensaje:', { command, payload });
            this.iframeQueue.push({ command, payload });
            // También enviar el mensaje a la cola HTML del iframe
            this.panel?.webview.postMessage({ 
                command: 'sendMessageFromTypeScript', 
                payload: { command, payload } 
            });
        }
    }

    setCertificationResults(payload: any): void {
        this.postCommand('setCertificationResults', payload);
    }
    setModuleResults(payload: { apiModule: ValidationModuleType; results: any }): void {
        this.postCommand('setModuleResults', payload);
    }

    throwExtensionError(payload: Error): void {
        this.postCommand('throwExtensionError', payload);
    }
    setValidationRulesError(payload: Error): void {
        this.postCommand('setValidationRulesError', payload);
    }
    setFileResultsError(payload: Error): void {
        this.postCommand('setFileResultsError', payload);
    }

    setValidationRules(payload: any): void {
        this.postCommand('setValidationRules', payload);
    }

    setFileResults(payload: any): void {
        this.postCommand('setFileResults', payload);
    }
    onFileLoaded(payload: any): void {
        this.postCommand('onFileLoaded', payload);
    }


    private getHtml(url: string) {
        return `
<html>
    <body style="margin: 0px; padding: 0px; overflow: hidden">
        <div style="position: fixed; height: 100%; width: 100%">
            <iframe
            id="iframe"
            src="${url}"
            frameborder="0"
            style="overflow: hidden; height: 100%; width: 100%"
            height="100%"
            width="100%"
            ></iframe>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            const iframe = document.getElementById('iframe');

            window.addEventListener('message', event => {
                console.log('message on webview.html', event.source == iframe.contentWindow, event.data);
                if(event.source == iframe.contentWindow) {
                    if(event.data.command === 'onProjectLoaded') {
                        onProjectLoaded();
                    } else if(event.data.command === 'onFileLoaded') {
                        onFileLoaded();
                    } else {
                        vscode.postMessage(event.data);
                    }
                } else {
                    if(event.data.command === 'sendMessageFromTypeScript') {
                        sendMessageFromTypeScript(event.data.payload);
                    } else {
                        sendMessageToIframe(event.data);
                    }
                }
            });

            let iframeLoaded = false;
            let iframeQueue = [];
            
            // Función para enviar mensajes desde TypeScript al iframe
            function sendMessageFromTypeScript(message) {
                console.log('sendMessageFromTypeScript called with:', message);
                if(!iframeLoaded) {
                    console.log('iframe not ready yet, queueing message from TypeScript', message);
                    iframeQueue.push(message);
                } else {
                    // Enviar mensaje con origen vscode-webview para que el frontend lo procese
                    const messageWithOrigin = {
                        ...message,
                        origin: 'vscode-webview://'
                    };
                    console.log('iframe ready, sending message from TypeScript to iframe:', messageWithOrigin);
                    iframe.contentWindow.postMessage(messageWithOrigin, '*');
                }
            }
            function sendMessageToIframe(message) {
                if(!iframeLoaded) {
                    console.log('iframe not ready yet, queueing message', message);
                    iframeQueue.push(message);
                } else {
                    // Enviar mensaje con origen vscode-webview para que el frontend lo procese
                    const messageWithOrigin = {
                        ...message,
                        origin: 'vscode-webview://'
                    };
                    console.log('iframe ready, sending message to iframe:', messageWithOrigin);
                    iframe.contentWindow.postMessage(messageWithOrigin, '*');
                }
            }
            const onProjectLoaded = () => {
                console.log('onProjectLoaded: sending queued messages', iframeQueue);
                console.log('onProjectLoaded: tamaño de la cola HTML:', iframeQueue.length);
                iframeLoaded = true;
                iframeQueue.forEach(message => sendMessageToIframe(message));
                iframeQueue = [];
            };
            const onFileLoaded = () => {
                console.log('onFileLoaded: sending queued messages', iframeQueue);
                iframeLoaded = true;
                iframeQueue.forEach(message => sendMessageToIframe(message));
                iframeQueue = [];
            };
        </script>
  </body>
</html>`;
    }
}

export class ResponseError extends Error {
    status!: number;
    code: any;
    message: any;
}
