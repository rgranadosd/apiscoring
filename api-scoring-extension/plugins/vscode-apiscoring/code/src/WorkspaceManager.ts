// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as archiver from 'archiver';
import * as path from 'path';
import * as os from 'os';
import { parse } from '@stoplight/yaml';
import * as yaml from 'js-yaml';

const protocolsAvailable = ['rest/', 'grpc/', 'event/'];

// WSO2 detection patterns
const WSO2_PATTERNS = {
    DIRECTORY: 'wso2_extracted',
    API_FILES: ['api.yaml', 'swagger.yaml', 'openapi.yaml'],
    METADATA_KEYS: ['type', 'version', 'data', 'name', 'context', 'provider'],
    ENDPOINT_PATTERNS: ['localhost:9443', 'wso2', 'carbon'],
    ZIP_PATTERNS: ['admin-', '-1.0.0.zip', 'PizzaShackAPI', 'API']
};

export async function isWSO2Project(rootFolder: string): Promise<boolean> {
    console.log('🔍 Checking if project is WSO2...');
    
    // Check for wso2_extracted directory
    const wso2Dir = path.join(rootFolder, WSO2_PATTERNS.DIRECTORY);
    if (await checkFileExists(wso2Dir)) {
        console.log('✅ Found wso2_extracted directory');
        return true;
    }
    
    // Check for WSO2 API files
    for (const apiFile of WSO2_PATTERNS.API_FILES) {
        const apiFilePath = path.join(rootFolder, apiFile);
        if (await checkFileExists(apiFilePath)) {
            console.log(`✅ Found WSO2 API file: ${apiFile}`);
            return true;
        }
    }
    
    // Check subdirectories for WSO2 files
    try {
        const files = await vscode.workspace.findFiles('**/*.yaml', '**/node_modules/**');
        for (const file of files) {
            const content = await vscode.workspace.fs.readFile(file);
            const text = content.toString();
            
            // Check for WSO2 metadata patterns
            const hasWSO2Patterns = WSO2_PATTERNS.METADATA_KEYS.every(key => 
                text.includes(key)
            );
            
            if (hasWSO2Patterns && WSO2_PATTERNS.ENDPOINT_PATTERNS.some(pattern => 
                text.includes(pattern)
            )) {
                console.log(`✅ Found WSO2 patterns in: ${file.fsPath}`);
                return true;
            }
        }
    } catch (error) {
        console.log('⚠️ Error scanning for WSO2 files:', error);
    }
    
    console.log('❌ No WSO2 patterns found');
    return false;
}

export async function processWSO2Project(rootFolder: string): Promise<any> {
    console.log('🔧 Processing WSO2 project...');
    
    const wso2Dir = path.join(rootFolder, WSO2_PATTERNS.DIRECTORY);
    const processedApis = [];
    
    if (await checkFileExists(wso2Dir)) {
        console.log('📁 Processing wso2_extracted directory...');
        
        try {
            const wso2Items = await vscode.workspace.fs.readDirectory(vscode.Uri.file(wso2Dir));
            console.log('📂 WSO2 items found:', wso2Items);
            
            for (const item of wso2Items) {
                const itemPath = path.join(wso2Dir, item[0]);
                console.log(`📂 Processing item: ${item[0]} (type: ${item[1]})`);
                
                if (item[1] === vscode.FileType.Directory) {
                    console.log(`📂 Processing WSO2 API directory: ${item[0]}`);
                    
                    // Look for api.yaml and swagger.yaml files
                    const apiYamlPath = path.join(itemPath, 'api.yaml');
                    const swaggerYamlPath = path.join(itemPath, 'Definitions', 'swagger.yaml');
                    
                    console.log(`🔍 Checking api.yaml at: ${apiYamlPath}`);
                    console.log(`🔍 Checking swagger.yaml at: ${swaggerYamlPath}`);
                    
                    const apiYamlExists = await checkFileExists(apiYamlPath);
                    const swaggerYamlExists = await checkFileExists(swaggerYamlPath);
                    
                    console.log(`✅ api.yaml exists: ${apiYamlExists}`);
                    console.log(`✅ swagger.yaml exists: ${swaggerYamlExists}`);
                    
                    if (await checkFileExists(apiYamlPath)) {
                        console.log(`📖 Reading api.yaml from: ${apiYamlPath}`);
                        const apiContent = await vscode.workspace.fs.readFile(vscode.Uri.file(apiYamlPath));
                        const apiData = parse(apiContent.toString()) as any;
                        
                        if (apiData && apiData.data) {
                            const apiInfo = apiData.data;
                            processedApis.push({
                                name: apiInfo.name || item[0],
                                apiSpecType: "REST",
                                definitionPath: `wso2_extracted/${item[0]}/Definitions`,
                                definitionFile: "swagger.yaml",
                                wso2Data: apiInfo,
                                type: "WSO2"
                            });
                            console.log(`✅ Processed WSO2 API: ${apiInfo.name}`);
                        } else {
                            console.log(`❌ No valid data found in api.yaml for: ${item[0]}`);
                        }
                    } else {
                        console.log(`❌ api.yaml not found for: ${item[0]}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error processing WSO2 directory:', error);
        }
    } else {
        console.log('❌ wso2_extracted directory not found');
    }
    
    console.log(`📊 Total APIs processed: ${processedApis.length}`);
    console.log('📋 Processed APIs:', processedApis);
    
    return {
        apis: processedApis,
        isWSO2Project: true
    };
}

export async function loadRepositoryMetadataYml(rootFolder?: string) {
    console.log('WORKSPACE MANAGER - LOAD REPOSITORY METADATA CALLED');
    console.log('DEBUG: Loading repository metadata from:', rootFolder);
    
    rootFolder = rootFolder || (await getRootFolder());
    if (!rootFolder) {
        console.log('DEBUG: No root folder found');
        throw new Error('No se encontró la carpeta raíz del proyecto.');
    }
    
    console.log('DEBUG: Root folder:', rootFolder);
    
    // 1. PRIMERO: Buscar metadata.yml
    const metadataPath = path.join(rootFolder, 'metadata.yml');
    if (await checkFileExists(metadataPath)) {
        console.log('DEBUG: metadata.yml encontrado, leyendo...');
        const text = await vscode.workspace.fs.readFile(vscode.Uri.file(metadataPath));
        console.log('DEBUG: Metadata content length:', text.length);
        const parsed = convertToOneNamingConvention(parse<any>(text.toString()));
        console.log('DEBUG: Metadata convertido:', parsed);
        return parsed;
    }
    
    // 2. SEGUNDO: Buscar ZIP compatible (en la raíz también)
    console.log('DEBUG: STEP 2 - Buscando ZIPs en el workspace...');
    const wso2ZipFiles = await findWSO2ZipFiles(rootFolder);
    console.log('DEBUG: ZIPs encontrados:', wso2ZipFiles);
    if (wso2ZipFiles.length > 0) {
        const zipPath = wso2ZipFiles[0];
        console.log('DEBUG: ZIP encontrado:', zipPath);
        
        // Validar que es un ZIP WSO2 válido sin extraerlo completamente
        try {
            const extract = require('extract-zip');
            const tempExtractPath = path.join(os.tmpdir(), `wso2-validate-${Date.now()}`);
            await fs.promises.mkdir(tempExtractPath, { recursive: true });
            
            // Extraer solo para validar estructura WSO2
            await extract(zipPath, { dir: tempExtractPath });
            console.log('DEBUG: ZIP extraído para validación');
            
            // Comprobar si es WSO2 válido (api.yaml y Definitions/swagger.yaml)
            const apiDirs = await fs.promises.readdir(tempExtractPath);
            let foundWSO2 = false;
            let apiInfo = null;
            
            for (const dir of apiDirs) {
                const apiYaml = path.join(tempExtractPath, dir, 'api.yaml');
                const swaggerYaml = path.join(tempExtractPath, dir, 'Definitions', 'swagger.yaml');
                
                console.log('DEBUG: checkFileExists called for:', apiYaml);
                const apiYamlExists = await checkFileExists(apiYaml);
                console.log('DEBUG: File exists:', apiYamlExists);
                
                console.log('DEBUG: checkFileExists called for:', swaggerYaml);
                const swaggerYamlExists = await checkFileExists(swaggerYaml);
                console.log('DEBUG: File exists:', swaggerYamlExists);
                
                if (apiYamlExists && swaggerYamlExists) {
                    foundWSO2 = true;
                    console.log('DEBUG: Estructura WSO2 encontrada en:', dir);
                    
                    // Leer api.yaml para info básica
                    const apiYamlContent = await fs.promises.readFile(apiYaml, 'utf8');
                    const apiYamlParsed = parse(apiYamlContent);
                    
                    apiInfo = {
                        name: dir,
                        apiSpecType: 'REST',
                        definitionPath: path.join(dir, 'Definitions'),
                        definitionFile: 'swagger.yaml',
                        wso2Data: apiYamlParsed,
                        type: 'WSO2',
                        source: 'ZIP_ORIGINAL',
                        originalZipPath: zipPath // Usar el ZIP original, no uno temporal
                    };
                    break;
                }
            }
            
            // Limpiar archivos temporales de validación
            await fs.promises.rm(tempExtractPath, { recursive: true, force: true });
            
            if (foundWSO2 && apiInfo) {
                console.log('DEBUG: ZIP es un proyecto WSO2 válido. Info:', apiInfo);
                console.log('DEBUG: Enviando ZIP original al backend sin modificar');
                
                return {
                    apis: [apiInfo],
                    isWSO2Project: true,
                    source: 'ZIP_ORIGINAL',
                    originalZipPath: zipPath // Usar el ZIP original
                };
            } else {
                console.log('DEBUG: El ZIP no es un proyecto WSO2 válido.');
                throw new Error('El ZIP encontrado no es un proyecto WSO2 válido.');
            }
        } catch (err: any) {
            console.log('DEBUG: Error validando el ZIP:', err);
            throw new Error('Error validando el ZIP: ' + (err.message || err));
        }
    }
    // 3. TERCERO: No hay nada válido
    console.log('DEBUG: No se encontró metadata.yml ni ZIP válido.');
    throw new Error('No se encontró un proyecto API válido.');
}

export async function processWSO2ProjectLocally(metadata: any): Promise<any[]> {
    console.log('🔧 Processing WSO2 project locally...');
    
    // WSO2 projects should use the backend for real validation instead of mock data
    console.log('⚠️ WSO2 projects require backend validation - no local processing available');
    console.log('📊 No WSO2 APIs processed locally - use backend validation instead');
    return [];
}

function convertToOneNamingConvention(text : any){
    let apis: { name: string; apiSpecType: string; definitionPath: string; definitionFile?: string; }[] = [];
    text.apis.forEach( (element:any) => {
        apis.push({
            name : element.name,
            apiSpecType: element["api-spec-type"],
            definitionPath: element["definition-path"],
            definitionFile: element["definition-file"]
        });
    });
    text.apis = apis;
    return text;
}

export async function checkFileExists(filePath : string) {
    console.log('🔍 DEBUG: checkFileExists called for:', filePath);
    const exists = await fs.promises
      .access(filePath, fs.constants.F_OK)
      .then(() => {
        console.log('✅ DEBUG: File exists:', filePath);
        return true;
      })
      .catch(() => {
        console.log('❌ DEBUG: File does not exist:', filePath);
        return false;
      });
    return exists;
  };

export async function getRootFolder(): Promise<string | undefined> {
    console.log('🔍 DEBUG: getRootFolder() called');
    // Solo buscar metadata.yml en la raíz del workspace abierto
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const root = workspaceFolders[0].uri.fsPath;
        const metadataPath = path.join(root, 'metadata.yml');
        if (fs.existsSync(metadataPath)) {
            console.log('✅ DEBUG: metadata.yml found in root:', root);
            return root;
        } else {
            console.log('❌ DEBUG: metadata.yml not found in root:', root);
            return undefined;
        }
    }
    // Si no hay workspace abierto, mostrar el selector de carpeta
    console.log('🔍 DEBUG: No workspace folder, showing folder picker...');
    const selectedFolder = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: true,
        canSelectFiles: false,
        openLabel: 'Select Root Folder',
    });
    if (!selectedFolder) {
        console.log('❌ DEBUG: No folder selected');
        return;
    }
    const root = selectedFolder[0].fsPath;
    const metadataPath = path.join(root, 'metadata.yml');
    if (fs.existsSync(metadataPath)) {
        console.log('✅ DEBUG: metadata.yml found in selected root:', root);
        return root;
    } else {
        console.log('❌ DEBUG: metadata.yml not found in selected root:', root);
        return undefined;
    }
}

export async function compressWorkspace(rootFolder?: string, metadata? : any): Promise<string | undefined> {
    rootFolder = rootFolder || (await getRootFolder());
    if (!rootFolder || !metadata) {
        console.log('❌ Missing rootFolder or metadata for compression');
        return;
    }
    
    console.log('📦 Starting workspace compression...');
    console.log('📁 Root folder:', rootFolder);
    console.log('📄 Metadata:', JSON.stringify(metadata, null, 2));
    
    // Standard compression for non-ZIP projects
    const destination = path.join(os.tmpdir(), `api-repo-${Date.now()}.zip`);
    console.log('🎯 Destination ZIP:', destination);
    
    try {
        await zipDirectory(rootFolder, destination, metadata);
        console.log('✅ Workspace compressed successfully');
        return destination;
    } catch (error) {
        console.error('❌ Error compressing workspace:', error);
        throw error;
    }
}

function zipDirectory(sourceDir: string, outPath: string, metadata: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        console.log('🔧 Creating ZIP archive...');
        
        const archive = archiver('zip', { 
            zlib: { level: 9 },
            store: false
        });
        
        const stream = fs.createWriteStream(outPath);
        
        // Collect all paths that should be included
        const pathsToInclude = new Set<string>();
        
        // Always include metadata.yml
        pathsToInclude.add('metadata.yml');
        
        // Check if this is a WSO2 project
        const isWSO2Project = metadata.isWSO2Project || false;
        
        if (isWSO2Project) {
            console.log('🚀 Processing WSO2 project for ZIP...');
            // Include all WSO2 related paths
            pathsToInclude.add('wso2_extracted');
            pathsToInclude.add('__metadata.yml');
        }
        
        // Include all definition paths from metadata
        if (metadata.apis && Array.isArray(metadata.apis)) {
            metadata.apis.forEach((api: any) => {
                if (api.definitionPath) {
                    pathsToInclude.add(api.definitionPath);
                    console.log('📁 Including definition path:', api.definitionPath);
                    
                    // If there's a specific definition file, also include its parent directory
                    if (api.definitionFile) {
                        const fullPath = path.join(api.definitionPath, api.definitionFile);
                        pathsToInclude.add(fullPath);
                        console.log('📄 Including definition file:', fullPath);
                    }
                }
            });
        }
        
        // Only include specific paths defined in metadata
        // Removed automatic inclusion of common API directories to prevent confusion
        
        console.log('📋 Paths to include:', Array.from(pathsToInclude));
        
        // Handle archive events
        archive.on('error', (err) => {
            console.error('❌ Archive error:', err);
            reject(err);
        });
        
        archive.on('warning', (err) => {
            console.warn('⚠️ Archive warning:', err);
        });
        
        archive.on('entry', (entry) => {
            console.log('📄 Adding to ZIP:', entry.name);
        });
        
        // Handle stream events
        stream.on('close', () => {
            console.log('✅ ZIP file created successfully');
            resolve();
        });
        
        stream.on('error', (err) => {
            console.error('❌ Stream error:', err);
            reject(err);
        });
        
        // Pipe archive to stream
        archive.pipe(stream);
        
        // Add files to archive
        archive.directory(sourceDir, false, (entryData) => {
            const entryName = entryData.name;
            
            // Check if this entry should be included
            const shouldInclude = Array.from(pathsToInclude).some(pathToInclude => {
                return entryName.startsWith(pathToInclude) || 
                       entryName === 'metadata.yml';
            });
            
            if (shouldInclude) {
                console.log('✅ Including:', entryName);
                return entryData;
            } else {
                console.log('❌ Excluding:', entryName);
                return false;
            }
        });
        
        // Finalize the archive
        archive.finalize();
    });
}

export async function findWSO2ZipFiles(rootFolder: string): Promise<string[]> {
    console.log('🔍 DEBUG: Looking for WSO2 ZIP files in:', rootFolder);
    console.log('🔍 DEBUG: WSO2_PATTERNS.ZIP_PATTERNS:', WSO2_PATTERNS.ZIP_PATTERNS);
    
    try {
        const files = await vscode.workspace.findFiles('*.zip', '**/node_modules/**');
        console.log('📦 DEBUG: Total ZIP files found:', files.length);
        
        const wso2Zips: string[] = [];
        
        for (const file of files) {
            const fileName = path.basename(file.fsPath);
            console.log('📄 DEBUG: Found ZIP file:', fileName);
            console.log('📄 DEBUG: Full path:', file.fsPath);
            
            // Check if it matches WSO2 naming patterns
            const isWSO2Zip = WSO2_PATTERNS.ZIP_PATTERNS.some(pattern => {
                const matches = fileName.includes(pattern);
                console.log(`🔍 DEBUG: Checking pattern "${pattern}" against "${fileName}": ${matches}`);
                return matches;
            });
            
            if (isWSO2Zip) {
                console.log('✅ DEBUG: Detected WSO2 ZIP:', fileName);
                wso2Zips.push(file.fsPath);
            } else {
                console.log('❌ DEBUG: Not a WSO2 ZIP:', fileName);
            }
        }
        
        console.log('📋 DEBUG: WSO2 ZIP files found:', wso2Zips);
        return wso2Zips;
    } catch (error) {
        console.log('⚠️ DEBUG: Error searching for WSO2 ZIP files:', error);
        return [];
    }
}

export async function extractAndAnalyzeWSO2Zip(zipPath: string): Promise<any> {
    console.log('🔧 DEBUG: Extracting and analyzing WSO2 ZIP:', zipPath);
    
    // Create temporary extraction directory
    const extractPath = path.join(os.tmpdir(), `wso2-extract-${Date.now()}`);
    console.log('📁 DEBUG: Extraction path:', extractPath);
    
    try {
        // Create extraction directory
        await fs.promises.mkdir(extractPath, { recursive: true });
        console.log('✅ DEBUG: Extraction directory created');
        
        // Extract ZIP
        const extract = require('extract-zip');
        console.log('📦 DEBUG: Starting ZIP extraction...');
        await extract(zipPath, { dir: extractPath });
        console.log('✅ DEBUG: ZIP extracted successfully');
        
        // Look for swagger.yaml files in the extracted content
        console.log('🔍 DEBUG: Looking for swagger.yaml files...');
        const swaggerFiles = await vscode.workspace.findFiles('**/swagger.yaml', '**/node_modules/**');
        console.log('📄 DEBUG: Found swagger files:', swaggerFiles.length);
        
        const processedApis = [];
        
        for (const swaggerFile of swaggerFiles) {
            if (swaggerFile.fsPath.startsWith(extractPath)) {
                console.log('📄 DEBUG: Processing swagger file:', swaggerFile.fsPath);
                
                try {
                    const content = await vscode.workspace.fs.readFile(swaggerFile);
                    const swaggerData = parse(content.toString()) as any;
                    
                    // Get relative path from extraction directory
                    const relativePath = path.relative(extractPath, swaggerFile.fsPath);
                    const apiDir = path.dirname(relativePath);
                    const apiName = path.basename(apiDir);
                    
                    console.log('📋 DEBUG: API directory:', apiDir);
                    console.log('📋 DEBUG: API name:', apiName);
                    
                    processedApis.push({
                        name: apiName,
                        apiSpecType: "REST",
                        definitionPath: apiDir,
                        definitionFile: "swagger.yaml",
                        swaggerData: swaggerData,
                        type: "WSO2",
                        source: "ZIP_EXTRACTED"
                    });
                    
                    console.log(`✅ DEBUG: Processed WSO2 API from ZIP: ${apiName}`);
                } catch (error) {
                    console.error('❌ DEBUG: Error processing swagger file:', error);
                }
            }
        }
        
        // Clean up extraction directory
        console.log('🧹 DEBUG: Cleaning up extraction directory...');
        await fs.promises.rm(extractPath, { recursive: true, force: true });
        console.log('✅ DEBUG: Extraction directory cleaned up');
        
        return {
            apis: processedApis,
            isWSO2Project: true,
            source: "ZIP_EXTRACTED",
            originalZipPath: zipPath
        };
        
    } catch (error) {
        console.error('❌ DEBUG: Error extracting and analyzing WSO2 ZIP:', error);
        // Clean up on error
        try {
            await fs.promises.rm(extractPath, { recursive: true, force: true });
            console.log('✅ DEBUG: Cleaned up extraction directory after error');
        } catch (cleanupError) {
            console.error('❌ DEBUG: Error cleaning up:', cleanupError);
        }
        throw error;
    }
}

