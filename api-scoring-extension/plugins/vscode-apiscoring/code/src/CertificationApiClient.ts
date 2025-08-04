// SPDX-FileCopyrightText: 2023 Industria de Diseño Textil S.A. INDITEX
//
// SPDX-License-Identifier: Apache-2.0

import axios, { AxiosResponse, Method } from 'axios';
import * as fs from 'fs';
import { ValidationModuleType } from './webview/webview';
// eslint-disable-next-line @typescript-eslint/naming-convention
const FormData = require('form-data');

export async function validateRepo(serviceUrl: string, zipFile: string, apiModule?: ValidationModuleType): Promise<AxiosResponse> {
    console.log('DEBUG: Starting validateRepo...');
    console.log('Service URL:', serviceUrl);
    console.log('ZIP file:', zipFile);
    console.log('API Module:', apiModule);
    
    // Check if ZIP file exists
    if (!fs.existsSync(zipFile)) {
        console.error('DEBUG: ZIP file does not exist:', zipFile);
        throw new Error(`ZIP file not found: ${zipFile}`);
    }
    
    const zipStats = fs.statSync(zipFile);
    console.log('ZIP file size:', zipStats.size, 'bytes');
    
    const form = new FormData();
    form.append('isVerbose', 'true');
    form.append('file', fs.createReadStream(zipFile), `apiScoring-${Date.now()}.zip`);
    form.append('validationType', checkValidationType(apiModule?.validationType));

    const fullUrl = serviceUrl + (serviceUrl.endsWith('/') ? '' : '/') + 'apis/validate';
    console.log('Full URL:', fullUrl);

    const options = {
        method: 'POST' as Method,
        url: fullUrl,
        data: form,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data; boundary=' + form._boundary,
        },
        timeout: 60000
    };
    
    console.log('DEBUG: Sending request to service...');
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    return axios(options)
        .then(function (response) {
            console.log('DEBUG: Service response received:', response.status);
            console.log('Response data length:', response.data ? response.data.length : 'no data');
            return response;
        })
        .catch(function (error) {
            console.error('DEBUG: Service request failed:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                return error.response;
            }
            if (error.request) {
                console.error('Request was made but no response received');
                throw new Error('No response received from service. Please check your network connection and service URL.');
            }
            throw error;
        })
        .finally(function () {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";
            console.log('Request completed');
        });
}

export async function validateFile(serviceUrl: string, content: any, fileName: any, apiProtocol: string): Promise<AxiosResponse> {
    const form = new FormData();
    form.append('file', await fs.createReadStream(content.fileName), fileName);
    form.append('apiProtocol', checkProtocol(apiProtocol));

    const options = {
        method: 'POST' as Method,
        url: serviceUrl + (serviceUrl.endsWith('/') ? '' : '/') + 'apis/verify',
        data: form,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data; boundary=' + form._boundary,
        },
        processData: false,
        timeout: 60000
    };
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    return axios(options)
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            console.error('DEBUG: File validation failed:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                return error.response;
            }
            if (error.request) {
                console.error('Request was made but no response received');
                throw new Error('No response received from service. Please check your network connection and service URL.');
            }
            throw error;
        })
        .finally(function () {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";
        });
}

function checkValidationType(validationType: string | undefined): any {
    if (!validationType) {
        return "OVERALL_SCORE";
    }
    return validationType;
}

function checkProtocol(apiProtocol: string): any {
    switch (apiProtocol) {
        case 'rest':
            return "REST";
        case 'asyncapi':
            return "EVENT";
        case 'grpc':
            return "GRPC";
        default:
            return "REST";
    }
}
export type ValidationsResults = ValidationsResult[];

export interface ValidationsResult {
    pipelineVersion: string;
    apiVersion: string;
    apiProductKey: string;
    apiName: string;
    apiProtocol: string;
    validationHash: string;
    validationDateTime: string;
    validationExecutorId: string;
    tagReference: string;
    documentationGrade: DocumentationGrade;
    lintingGrade: LintingGrade;
    securityGrade: SecurityGrade;
    rating: string;
    selfLink: SelfLink;
}

export interface DocumentationGrade {
    grade: string;
    description: string;
}

export interface LintingGrade {
    grade: string;
    description: string;
}

export interface SecurityGrade {
    grade: string;
    description: string;
}

export interface SelfLink {
    href: string;
}

