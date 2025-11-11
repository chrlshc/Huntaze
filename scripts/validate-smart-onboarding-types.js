#!/usr/bin/env node

/**
 * Smart Onboarding Types Validation Script
 * 
 * Quick validatiotegrity
 * Run: node scripts/validate-smart-onboardi
 */

const fs = require('fs');
con);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
',
  yellow: '\x1b[33m',
,
  cyan: '\x1b[36m'
};

function log(messag
  console.log(;
}

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  ret
}

fu) {
  const fullPath = path.j
  try {
    return fs.readFileS;
  } catch (error) {
    return null;
  }
}

function validateTypeEts() {
  log('\n📦 n');
  
  co
  
  
  t) {
    log('❌ Cannot read types/index
    return false;
  }
  
  const requiredTypes = [
   int',
    'RealTimeMetr,
    'EngagementTrend',
 ry',
lert',
    'AnalyticsDashboard',
    'InteractionEvent',
    '
    'Adaptation',
    'Intervention',
    'OnboardingJourney',
    'OnboardingCotext'
  ];
  
  e;
  requiredTypes.for
    const regex = new RegExp(`(export (interface|type) ${type}|export \\{[^}]*${ty);
    if (regex.test(content)) {
      log(
    } else {
      log(`  ✗ ${type} not found`, 'red');
    false;
    }
);
  
  return allFound;
}

function validateServiceInterfaces() {
  log('\n🔌 Validating Service Interfaces...', 'cyan');
  
  const se;
  const content = readFileContent(servicesFile);
  
  if (!content) {
    log('❌ Cannot read interfaces/services.ts', 'red');
 n false;
 }
  
  const requiredExports = [
    'ce',
    'MLPersonalizationEngie',
    'SmartOnboardingOrchestrator',
    'OnboardingContext'
  ];
  
  let allFound = true;
  requiredExports.forEach(exportName => {
    if (content.includes(ame)) {
      log(en');
    } else {
   
      allFound = ;
    }
  });
  
  return allFound;
}

fun {
 n');

  const te [
    'tests/unit/smart-onboarding/ty,
    'tests/unit/smart-onboarding/build-ts'

  
ue;
  testFiles.forEach(file => {
    if (checkFileExists(file)) {
      log(`  ✓ ${file}`, 'green');
    } else {
   ed');
lse;
    }
);
  
  return allExist;
}

function validateD) {
  log('\
  
  const docFiles = [
    'lib/smart-onb
 
in();
}
}

ma1);
  ess.exit(
    proc);ellow'es\n', 'y fix issubove andrrors aiew the eg('📝 Rev');
    lo 'yellow/${total})`,d}d (${passeleais fation  Some validlog(`\n⚠️
    } else {  
ss.exit(0);  proce);
  en', 'greor use\n'nd ready fs healthy aystem i🎉 Type s
    log(''green');${total})`, assed}/${p (ed!asslidations p`\n✅ All vag() {
    lo === total  if (passede');
  
blu4), 'at(5'.repe' + '═log('\n
  
  
  }); color);}`,${labels} {statu(`  $);
    log').trim(' $1])/g, e(/([A-Zacy.replt label = ke
    cons;: 'red' ? 'green' ueor = valonst col'✗';
    c'✓' : ? ue  = valustatonst s c) => {
   value]h(([key, s).forEacsultes(rerit.ent  
  Objecngth;
leults).eys(resect.kotal = Obj;
  const t).lengther(Booleanltresults).fict.values( = Objet passedns co
 blue');
  4), '.repeat(5 log('═'n');
 ', 'cyaummaryalidation S📊 V');
  log('(54), 'blueat.repe + '═'og('\n'  l};
  
)
  tion(Documentaatelidon: vaentati,
    documestFiles(): validateTtFileses   t,
 rfaces()eServiceIntedatlirfaces: varviceInte  se,
  rts()ateTypeExpolideExports: va
    typlts = {t resu  conslue');
  
╝', 'b═══════════════════════════════════════════════════
  log('╚═'blue');  ║',             on   Validatirding TypesOnboamart 
  log('║  Se');═╗', 'blu═══════════════════════════════════════════════'╔════  log() {
tion main(
}

func for docspassays e; // Alwn truturre  
  
  });
 }ical
   t crition is noDocumentat/     /');
  yellow 'ssing`,file} mi✗ ${  log(`  
    lse {
    } e);}`, 'green'✓ ${file   log(`  )) {
   Exists(fileeckFile   if (ch
 le => {.forEach(fiescFile;
  doExist = trut all le
 
  ];
  md'T.RAGE_REPOROVE    'TYPE_C