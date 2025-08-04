// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import * as vscode from "vscode";
import * as fs from 'fs';

import { validateRepo, validateFile } from './CertificationApiClient';
import { HubController } from './webview/HubController';
import { CertificationFrontendIface, CertificationServiceWebView, ResponseError, ValidationModuleType, ValidationFileModuleType } from './webview/webview';
import { compressWorkspace, getRootFolder, loadRepositoryMetadataYml, processWSO2ProjectLocally } from './WorkspaceManager';
import path = require("path");

let rootUri: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('API Scoring Extension: Activating...');
    
    // Log workspace information
    if (vscode.workspace.workspaceFolders) {
        console.log('Workspace folders found:', vscode.workspace.workspaceFolders.length);
        for (const folder of vscode.workspace.workspaceFolders) {
            console.log('  -', folder.uri.fsPath);
        }
    } else {
        console.log('No workspace folders found');
    }
    
    // Check for metadata.yml files
    try {
        const metadataFiles = await vscode.workspace.findFiles('**/metadata.yml');
        console.log('Metadata files found:', metadataFiles.length);
        for (const file of metadataFiles) {
            console.log('  -', file.fsPath);
        }
    } catch (error) {
        console.log('Error finding metadata files:', error);
    }
    
    // Check for WSO2 ZIP files
    try {
        const zipFiles = await vscode.workspace.findFiles('*.zip');
        console.log('ZIP files found:', zipFiles.length);
        for (const file of zipFiles) {
            console.log('  -', file.fsPath);
        }
    } catch (error) {
        console.log('Error finding ZIP files:', error);
    }
    
    let certificationFrontEnd: CertificationFrontendIface = new CertificationServiceWebView(context, new HubController());
    let fileTriggerActivate = false;

    let serviceUrl: string | undefined;
    let disposable = vscode.commands.registerCommand('apiScoring.certification.validateRepository', (apiModule?: ValidationModuleType) => {
        if (fileTriggerActivate) {
            certificationFrontEnd = new CertificationServiceWebView(context, new HubController());
            fileTriggerActivate = false;
        }
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Opening APIScoring',
                cancellable: true,
            },
            async (progress, token) => {
                let rootPath;
                if (apiModule && rootUri) {
                    rootPath = rootUri;
                    console.log('Using existing rootUri:', rootPath);
                } else {
                    // Always use workspace folder first, don't show dialog for WSO2 ZIPs
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (workspaceFolders && workspaceFolders.length > 0) {
                        rootPath = workspaceFolders[0].uri.fsPath;
                        console.log('Using workspace folder:', rootPath);
                    } else {
                        console.log('No workspace folders, calling getRootFolder()...');
                        rootPath = await getRootFolder();
                        rootUri = rootPath;
                        console.log('getRootFolder() returned:', rootPath);
                    }
                }

                if (!rootPath || token.isCancellationRequested) {
                    console.log('No rootPath found or operation cancelled');
                    return;
                }
                
                console.log('Root path determined:', rootPath);

                certificationFrontEnd.show("/");

                progress.report({ message: 'Compressing API workspace' });
                
                let metadata: any;
                let zipFileName: string | undefined;
                
                try {
                                    console.log('Starting metadata loading...');
                metadata = await loadRepositoryMetadataYml(rootPath);
                console.log('Metadata loaded successfully:', metadata);
                
                // Check if we have a WSO2 project - send to backend for validation
                if (metadata && metadata.isWSO2Project) {
                    console.log('WSO2 project detected - will send to backend for validation');
                    
                    // For WSO2 projects, we need to send to backend instead of local processing
                    // The backend will handle the ZIP validation and processing
                    console.log('WSO2 projects require backend validation - proceeding to send to service');
                }
                
                // Check if we have a WSO2 ZIP file to use directly
                if (metadata && metadata.originalZipPath && metadata.source === "ZIP_ORIGINAL") {
                    console.log('Using original WSO2 ZIP:', metadata.originalZipPath);
                    console.log('ZIP file exists check:', fs.existsSync(metadata.originalZipPath));
                    console.log('ZIP file size:', fs.statSync(metadata.originalZipPath).size, 'bytes');
                    zipFileName = metadata.originalZipPath;
                    console.log('ZIP file path set to:', zipFileName);
                } else if (metadata && metadata.zipPath && metadata.source === "ZIP") {
                    console.log('Using WSO2 ZIP directly:', metadata.zipPath);
                    console.log('ZIP file exists check:', fs.existsSync(metadata.zipPath));
                    console.log('ZIP file size:', fs.statSync(metadata.zipPath).size, 'bytes');
                    zipFileName = metadata.zipPath;
                    console.log('ZIP file path set to:', zipFileName);
                } else {
                    console.log('Starting workspace compression...');
                    zipFileName = await compressWorkspace(rootPath, metadata);
                    console.log('ZIP file created:', zipFileName);
                }
                    
                    if (!zipFileName) {
                        console.log('No ZIP file created - showing error message');
                        // No se pudo crear el ZIP - mostrar mensaje informativo
                        vscode.window.showWarningMessage(
                            'No se encontró un proyecto API válido. Asegúrate de tener un archivo metadata.yml o un proyecto WSO2.',
                            'Ver Documentación'
                        ).then(item => {
                            if (item === 'Ver Documentación') {
                                vscode.env.openExternal(vscode.Uri.parse('https://inditextech.github.io/api-scoring-doc/ide-extensions/overview/'));
                            }
                        });
                        
                        // Mostrar mensaje en la vista
                        let error = new ResponseError();
                        error.message = 'No se encontró un proyecto API válido. Necesitas:\n\n• Un archivo metadata.yml en la raíz del proyecto\n• O una carpeta wso2_extracted con APIs de WSO2\n• O archivos ZIP de WSO2 compatibles';
                        error.code = "NO_VALID_PROJECT";
                        console.log('Throwing extension error to frontend');
                        certificationFrontEnd.throwExtensionError(error);
                        return;
                    }
                    
                    if (token.isCancellationRequested) {
                        return;
                    }
                } catch (error: any) {
                    console.error('Error loading metadata or compressing workspace:', error);
                    
                    // Mostrar mensaje específico según el tipo de error
                    let errorMessage = 'Error al procesar el proyecto API.';
                    if (error.message === 'Metadata file not found.') {
                        errorMessage = 'No se encontró un archivo metadata.yml. Asegúrate de tener uno en la raíz del proyecto.';
                        console.log('Metadata file not found error detected');
                    } else if (error.message.includes('wso2')) {
                        errorMessage = 'Error al procesar proyecto WSO2. Verifica que la estructura sea correcta.';
                        console.log('WSO2 error detected');
                    }
                    
                    console.log('Showing error message to user:', errorMessage);
                    vscode.window.showErrorMessage(errorMessage, 'Ver Documentación').then(item => {
                        if (item === 'Ver Documentación') {
                            vscode.env.openExternal(vscode.Uri.parse('https://inditextech.github.io/api-scoring-doc/ide-extensions/overview/'));
                        }
                    });
                    
                    // Mostrar error en la vista
                    let responseError = new ResponseError();
                    responseError.message = errorMessage;
                    responseError.code = "PROJECT_ERROR";
                    console.log('Throwing extension error to frontend');
                    certificationFrontEnd.throwExtensionError(responseError);
                    return;
                }
                progress.report({ message: 'Sending local files to certification service' });
                serviceUrl = vscode.workspace.getConfiguration('apiScoring.certification.service').get<string>('url');
                console.log('Service URL from configuration:', serviceUrl);
                
                if (!serviceUrl || serviceUrl.trim().length === 0) {
                    console.log('Service URL is not configured');
                    vscode.window.showErrorMessage('Certification service URL is not configured', 'Open Settings').then(item => {
                        if (item === 'Open Settings') {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'apiScoring.certification.service.url');
                        }
                    });
                    let error = new ResponseError();
                    error.message = 'Certification service URL is not configured';
                    error.code = "Error Code";
                    certificationFrontEnd.throwExtensionError(error);
                    return;
                }
                
                console.log('Service URL is configured:', serviceUrl);
                console.log('Calling validateRepo...');
                
                let validationResponse;
                try {
                    validationResponse = await validateRepo(serviceUrl, zipFileName!, apiModule);
                    console.log('validateRepo completed, checking response...');
                    
                    if (!validationResponse) {
                        console.log('No validation response received');
                        vscode.window.showErrorMessage('No response from certification service. Please check your network connection and service URL.');
                        let error = new ResponseError();
                        error.message = 'No response from certification service. Please check your network connection and service URL.';
                        error.code = "SERVICE_NO_RESPONSE";
                        certificationFrontEnd.throwExtensionError(error);
                        return;
                    }
                    
                    if (validationResponse.status !== 200) {
                        console.log('Service returned error status:', validationResponse.status);
                        vscode.window.showErrorMessage(`Service returned error status: ${validationResponse.status}. Please check your service configuration.`);
                        let error = new ResponseError();
                        error.message = `Service returned error status: ${validationResponse.status}. Please check your service configuration.`;
                        error.code = "SERVICE_ERROR";
                        certificationFrontEnd.throwExtensionError(error);
                        return;
                    }
                    
                    console.log('Service response successful, status:', validationResponse.status);
                    
                } catch (error: any) {
                    console.error('Service request failed:', error.message);
                    
                    let errorMessage = 'Failed to connect to certification service.';
                    if (error.code === 'ECONNREFUSED') {
                        errorMessage = 'Cannot connect to certification service. Please check if the service is running and the URL is correct.';
                    } else if (error.code === 'ENOTFOUND') {
                        errorMessage = 'Certification service URL not found. Please check the service URL configuration.';
                    } else if (error.code === 'ETIMEDOUT') {
                        errorMessage = 'Connection to certification service timed out. Please check your network connection.';
                    }
                    
                    vscode.window.showErrorMessage(errorMessage, 'Check Settings').then(item => {
                        if (item === 'Check Settings') {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'apiScoring.certification.service.url');
                        }
                    });
                    
                    let responseError = new ResponseError();
                    responseError.message = errorMessage;
                    responseError.code = "SERVICE_CONNECTION_ERROR";
                    certificationFrontEnd.throwExtensionError(responseError);
                    return;
                }
                
                if (validationResponse && validationResponse.status >= 300) {
                    console.log('Validation failed with status:', validationResponse.status);
                    console.log('Error details:', validationResponse.data);
                    
                    let errorMessage = `Certification Service Error: ${validationResponse.status} ${validationResponse.statusText}`;
                    if (validationResponse.data && validationResponse.data.description) {
                        errorMessage += `\n\nDetails: ${validationResponse.data.description}`;
                    }
                    
                    vscode.window.showErrorMessage(errorMessage);
                    let error = new ResponseError();
                    error.status = validationResponse.status;
                    error.message = validationResponse.data?.description || errorMessage;
                    error.code = validationResponse.statusText || "VALIDATION_ERROR";
                    certificationFrontEnd.throwExtensionError(error);
                    return;
                }
                
                console.log('Validation successful, status:', validationResponse?.status);

                if (token.isCancellationRequested) {
                    return;
                }

                if (apiModule) {
                    progress.report({ message: 'Loading Module Validation Results' });
                    let apiValidationData = validationResponse.data.filter((x: { apiName: string; }) => x.apiName === apiModule.apiName);
                    certificationFrontEnd.setModuleResults({ results: apiValidationData, apiModule: apiModule });
                } else {
                    certificationFrontEnd.setCertificationResults({ metadata, rootPath, results: validationResponse.data });
                }
            }
        );
    });

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    statusBarItem.text = 'APIScoring Certification';
    statusBarItem.tooltip = 'Validate local APIs & Open APIScoring Application';
    statusBarItem.color = '#00ff00';
    statusBarItem.command = {
        command: 'apiScoring.certification.validateRepository',
        title: 'Validate local APIs & Open APIScoring Application',
        tooltip: 'Validate local APIs & Open APIScoring Application',
    };
    statusBarItem.show();

    const statusBarFile = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 2);
    statusBarFile.text = 'APIScoring File Lint';
    statusBarFile.tooltip = 'Open APIScoring Application File & Validate API file with a ruleset';
    statusBarFile.color = '#00ff00';
    statusBarFile.command = {
        command: 'apiScoring.certification.getValidationRules',
        title: 'Open 360 Hub Application File & Validate API file with a ruleset',
        tooltip: 'Open 360 Hub Application File & Validate API file with a ruleset',
    };

    statusBarFile.show();

    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(statusBarFile);

    let getValidationRules = vscode.commands.registerCommand('apiScoring.certification.getValidationRules', () => {
        if (!fileTriggerActivate) {
            certificationFrontEnd = new CertificationServiceWebView(context, new HubController());
            fileTriggerActivate = true;
        }

        certificationFrontEnd.onFileLoaded(null);
        certificationFrontEnd.show("/files");
    });

    let validateFile = vscode.commands.registerCommand('apiScoring.certification.validateFile', (response: ValidationFileModuleType) => {
        serviceUrl = vscode.workspace.getConfiguration('apiScoring.certification.service').get<string>('url');
        if (!serviceUrl || serviceUrl.trim().length === 0) {
            vscode.window.showErrorMessage('Certification service URL is not configured', 'Open Settings').then(item => {
                if (item === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'apiScoring.certification.service.url');
                }
            });
            let error = new ResponseError();
            error.message = 'Certification service URL is not configured';
            error.code = "Error Code";
            certificationFrontEnd.throwExtensionError(error);
            return;
        }
        vscode.workspace.openTextDocument(response.filePath).then((document) => {
            file(serviceUrl, document, response, certificationFrontEnd);
        });
    });
    context.subscriptions.push(getValidationRules);
    context.subscriptions.push(validateFile);
}

export async function file(serviceUrl: any, doc: any, response: ValidationFileModuleType, certificationFrontEnd: any) {

    let tmpDir: fs.PathLike;
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Loading Validation Results',
        cancellable: true,
    },
        async (progress, token) => {
            if (response.filePath) {
                try {
                    let ext = path.extname(response.filePath);
                    let fileName = 'file-to-verify-' + Date.now() + ext;
                    if (ext === ".proto") {
                        fileName = "a.proto";
                    }
                    const validationFileResponse = await validateFile(serviceUrl, doc, fileName, response.apiProtocol);
                    if (!validationFileResponse || validationFileResponse.status >= 300) {
                        vscode.window.showErrorMessage(
                            `Validate File Service Error: ${validationFileResponse?.status || 'Timeout'} ${validationFileResponse?.statusText}`
                        );
                        let error = new ResponseError();
                        error.status = validationFileResponse?.status;
                        error.message = validationFileResponse?.data.description;
                        error.code = validationFileResponse?.statusText;
                        certificationFrontEnd.setFileResultsError(error);
                        return;
                    }
                    certificationFrontEnd.setFileResults(validationFileResponse.data);
                    console.log("File Results", validationFileResponse.data);
                } catch (err: any) {
                    console.log('Error writing:' + err.message);
                } finally {
                    if (tmpDir) {
                        fs.rm(tmpDir, { recursive: true }, (err) => {
                            if (err) {
                                console.error(err.message);
                                return;
                            }
                        });
                    }
                }
            } else {
                vscode.window.showErrorMessage(
                    `FilePath is not valid`
                );
            }
        });
}

export function deactivate() { }