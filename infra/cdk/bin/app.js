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
const huntaze_of_stack_1 = require("../lib/huntaze-of-stack");
const app = new cdk.App();
// ✅ FORCE us-east-1 explicitement
new huntaze_of_stack_1.HuntazeOnlyFansStack(app, 'HuntazeOnlyFansStack', {
    env: {
        account: '317805897534',
        region: 'us-east-1' // ← EXPLICITE, pas de variables
    },
    description: 'Huntaze OnlyFans Infrastructure (us-east-1)',
    tags: {
        Project: 'Huntaze',
        Component: 'OnlyFans',
        Environment: 'production',
        ManagedBy: 'CDK',
        Region: 'us-east-1'
    },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsOERBQStEO0FBRS9ELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGtDQUFrQztBQUNsQyxJQUFJLHVDQUFvQixDQUFDLEdBQUcsRUFBRSxzQkFBc0IsRUFBRTtJQUNwRCxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsY0FBYztRQUN2QixNQUFNLEVBQUUsV0FBVyxDQUFFLGdDQUFnQztLQUN0RDtJQUNELFdBQVcsRUFBRSw2Q0FBNkM7SUFDMUQsSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLFNBQVM7UUFDbEIsU0FBUyxFQUFFLFVBQVU7UUFDckIsV0FBVyxFQUFFLFlBQVk7UUFDekIsU0FBUyxFQUFFLEtBQUs7UUFDaEIsTUFBTSxFQUFFLFdBQVc7S0FDcEI7Q0FDRixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgSHVudGF6ZU9ubHlGYW5zU3RhY2sgfSBmcm9tICcuLi9saWIvaHVudGF6ZS1vZi1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIOKchSBGT1JDRSB1cy1lYXN0LTEgZXhwbGljaXRlbWVudFxubmV3IEh1bnRhemVPbmx5RmFuc1N0YWNrKGFwcCwgJ0h1bnRhemVPbmx5RmFuc1N0YWNrJywge1xuICBlbnY6IHtcbiAgICBhY2NvdW50OiAnMzE3ODA1ODk3NTM0JyxcbiAgICByZWdpb246ICd1cy1lYXN0LTEnICAvLyDihpAgRVhQTElDSVRFLCBwYXMgZGUgdmFyaWFibGVzXG4gIH0sXG4gIGRlc2NyaXB0aW9uOiAnSHVudGF6ZSBPbmx5RmFucyBJbmZyYXN0cnVjdHVyZSAodXMtZWFzdC0xKScsXG4gIHRhZ3M6IHtcbiAgICBQcm9qZWN0OiAnSHVudGF6ZScsXG4gICAgQ29tcG9uZW50OiAnT25seUZhbnMnLFxuICAgIEVudmlyb25tZW50OiAncHJvZHVjdGlvbicsXG4gICAgTWFuYWdlZEJ5OiAnQ0RLJyxcbiAgICBSZWdpb246ICd1cy1lYXN0LTEnXG4gIH0sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=