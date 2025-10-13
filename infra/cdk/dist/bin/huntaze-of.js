#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
// Use dynamic requires to avoid constructing unused stacks at synth time
const app = new cdk.App();
const stacks = (process.env.STACKS || 'main,ci').split(',').map(s => s.trim());
const resolvedRegion = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const resolvedAccount = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const env = { region: resolvedRegion, account: resolvedAccount };
const qualifier = process.env.CDK_QUALIFIER || 'ofq1abcde';
const synthesizer = new cdk.DefaultStackSynthesizer({ qualifier });
if (stacks.includes('main')) {
    const { HuntazeOfStack } = require('../lib/huntaze-of-stack');
    new HuntazeOfStack(app, 'HuntazeOfStack', { env, synthesizer });
}
if (stacks.includes('ci')) {
    const { HuntazeOfCiStack } = require('../lib/huntaze-of-ci-stack');
    new HuntazeOfCiStack(app, 'HuntazeOfCiStack', { env, synthesizer });
}
