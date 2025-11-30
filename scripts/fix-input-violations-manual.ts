#!/usr/bin/env node
/**
 * Manual fixes for Input component violations
 * Handles complex cases that automated script couldn't handle
 */

import fs from 'fs';
import path from 'path';

interface Fix {
  file: string;
  search: string;
  replace: string;
}

const fixes: Fix[] = [
  // app/(app)/schedule/page.tsx - Fix broken onChange
  {
    file: 'app/(app)/schedule/page.tsx',
    search: `<Input type="datetime-local" value={form.scheduledAt} /> setForm({ ...form, scheduledAt: e.target.value })} 
              />`,
    replace: `<Input 
                type="datetime-local" 
                value={form.scheduledAt} 
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} 
              />`
  },
  {
    file: 'app/(app)/schedule/page.tsx',
    search: `<Input value={form.mediaUrl} /> setForm({ ...form, mediaUrl: e.target.value })}
                placeholder="https://..."
              />`,
    replace: `<Input 
                value={form.mediaUrl} 
                onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                placeholder="https://..."
              />`
  },
  
  // app/(app)/of-connect/DebugLogin.tsx - Fix broken onChange
  {
    file: 'app/(app)/of-connect/DebugLogin.tsx',
    search: `<Input placeholder="Email" value={email} />setEmail(e.target.value)} />`,
    replace: `<Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />`
  },
  {
    file: 'app/(app)/of-connect/DebugLogin.tsx',
    search: `<Input type="password" placeholder="Password" value={password} />setPassword(e.target.value)} />`,
    replace: `<Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />`
  },
  {
    file: 'app/(app)/of-connect/DebugLogin.tsx',
    search: `<Input placeholder="OTP (optional)" value={otp} />setOtp(e.target.value)} />`,
    replace: `<Input placeholder="OTP (optional)" value={otp} onChange={(e) => setOtp(e.target.value)} />`
  },
  
  // components/pricing/UpgradeModal.tsx - Fix range inputs
  {
    file: 'components/pricing/UpgradeModal.tsx',
    search: `<Input type="range" value={gmv} min={{0} max={{50000} step={{100} /> setGmv(+e.target.value)} className="mt-2 w-full" />`,
    replace: `<input type="range" min={0} max={50000} step={100} value={gmv} onChange={(e) => setGmv(+e.target.value)} className="mt-2 w-full" />`
  },
  {
    file: 'components/pricing/UpgradeModal.tsx',
    search: `<Input type="range" value={msgs} min={{0} max={{100000} step={{500} /> setMsgs(+e.target.value)} className="mt-2 w-full" />`,
    replace: `<input type="range" min={0} max={100000} step={500} value={msgs} onChange={(e) => setMsgs(+e.target.value)} className="mt-2 w-full" />`
  },
  
  // components/content/VideoEditor.tsx - Revert range inputs (keep as <input>)
  {
    file: 'components/content/VideoEditor.tsx',
    search: `<Input type="range" value={startTime} min={{"0"} max={{duration} step={{"0.1"} /> setStartTime(Number(e.target.value))} className="flex-1" />`,
    replace: `<input type="range" min="0" max={duration} step="0.1" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="flex-1" />`
  },
  {
    file: 'components/content/VideoEditor.tsx',
    search: `<Input type="range" value={endTime} min={{"0"} max={{duration} step={{"0.1"} /> setEndTime(Number(e.target.value))} className="flex-1" />`,
    replace: `<input type="range" min="0" max={duration} step="0.1" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="flex-1" />`
  },
  {
    file: 'components/content/VideoEditor.tsx',
    search: `<Input type="number" value={caption.startTime} /> updateCaption(index, 'startTime', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" step="0.1" />`,
    replace: `<Input type="number" value={caption.startTime} onChange={(e) => updateCaption(index, 'startTime', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" step="0.1" />`
  },
  {
    file: 'components/content/VideoEditor.tsx',
    search: `<Input type="number" value={caption.endTime} /> updateCaption(index, 'endTime', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" step="0.1" />`,
    replace: `<Input type="number" value={caption.endTime} onChange={(e) => updateCaption(index, 'endTime', Number(e.target.value))} className="w-full px-2 py-1 border rounded text-sm" step="0.1" />`
  },
  
  // components/content/TemplateSelector.tsx
  {
    file: 'components/content/TemplateSelector.tsx',
    search: `<Input type="text" placeholder="Search templates..." value={searchTerm} /> setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded" />`,
    replace: `<Input type="text" placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded" />`
  },
  
  // app/(marketing)/platforms/connect/onlyfans/page.tsx - Fix file input
  {
    file: 'app/(marketing)/platforms/connect/onlyfans/page.tsx',
    search: `<Input type="file" id="csv-upload" /> {`,
    replace: `<input type="file" id="csv-upload" accept=".csv" onChange={(e) => {`
  },
];

async function applyFixes() {
  console.log('🔧 Applying manual fixes for Input violations\n');
  
  let fixesApplied = 0;
  let fixesFailed = 0;
  
  for (const fix of fixes) {
    const fullPath = path.join(process.cwd(), fix.file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      fixesFailed++;
      continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    if (!content.includes(fix.search)) {
      console.log(`⚠️  Pattern not found in ${fix.file}`);
      fixesFailed++;
      continue;
    }
    
    content = content.replace(fix.search, fix.replace);
    fs.writeFileSync(fullPath, content, 'utf-8');
    
    console.log(`✅ Fixed: ${fix.file}`);
    fixesApplied++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixes applied: ${fixesApplied}`);
  console.log(`   Fixes failed: ${fixesFailed}`);
}

applyFixes().catch(console.error);
