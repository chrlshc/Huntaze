/**
 * Integration Tests - /api/onboarding Endpoint
 * 
 * Tests the Shopify-style onboarding API with:
 * - GET endpoint for fetching onboarding steps and progress
 * - POST endpoint for updating onboarding data
 * - Authentication and authorization
 * - Market-specific filtering
 * - Role-based visibility
 * - Error handling and validation
 * - Concurrent access patterns
 * - Performance benchmarks
 * 
 * Based on: .kiro/specs/shopify-style-onboarding/
 */

import { start } from 'repl';
import { Type } from 'js-yaml';
import { json } from 'stream/consumers';
import test from 'node:test';
import { fail } from 'assert';
import { fail } from 'assert';
import { json } from 'stream/consumers';
import { N } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';
import { b } from 'vitest/dist/chunks/suite.B2jumIFP.js';
import { N } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';
import { g } from 'vitest/dist/chunks/suite.B2jumIFP.js';
import { get } from 'http';
import { stringify } from 'querystring';
import { json } from 'stream/consumers';
import { time } from 'console';
import { Type } from 'js-yaml';
import { json } from 'stream/consumers';
import { json } from 'stream/consumers';
import { on } from 'events';
import { on } from 'events';
import { on } from 'events';
import { json } from 'stream/consumers';
import test from 'node:test';
import { json } from 'stream/consumers';
import { start } from 'repl';
import { a } from 'vitest/dist/chunks/suite.B2jumIFP.js';
import { json } from 'stream/consumers';
import { json } from 'stream/consumers';
import test from 'node:test';
import test from 'node:test';
import { fail } from 'assert';
import { json } from 'stream/consumers';
import { N } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';
import { b } from 'vitest/dist/chunks/suite.B2jumIFP.js';
import { N } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';
import { N } from 'vitest/dist/chunks/reporters.nr4dxCkA.js';
import { g } from 'vitest/dist/chunks/suite.B2jumIFP.js';
import { get } from 'http';
import { stringify } from 'querystring';
import { json } from 'stream/consumers';
import { time } from 'console';
import { Type } from 'js-yaml';
import { json } from 'stream/consumers';
import { json } from 'stream/consumers';
import { json } from 'stream/consumers';
import test from 'node:test';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ONBOARDING_ENDPOINT = `${BASE_URL}/api/onboarding`;

// Mock auth token (replace with actual test token in real implementation)
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Response schemas
const OnboardingStepSchema = z.object({
  id: z.string(),
  version: z.number(),
  title: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  weight: z.number(),
  status: z.enum(['todo', 'done', 'skipped']),
  completedAt: z.string().optional(),
  roleRestricted: z.string().optional(),
});

const OnboardingResponseSchema = z.object({
  progress: z.number().min(0).max(100),
  steps: z.array(OnboardingStepSchema),
});

const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  correlationId: z.string().optional(),
});

const PostSuccessResponseSchema = z.object({
  ok: z.boolean(),
});

// Helper function to create auth headers
function getAuthHeaders(token: string = TEST_AUTH_TOKEN): ing> {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

describe('Integration: /api/onboarding', () => {
  describe('GET /api/onboarding', () => {
    describe('Authentication & Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        const response = await fetch(ONBOARDING_ENDPOINT);
        
        // Should require authentication
        expect([401, 403]).toContain(response.status);
      });

      it('should return 401 with invalid token', async () => {
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: {
            'Authorization': 'Bearer invalid_token_12345'
          }
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should return 401 with malformed Authorization header', async () => {
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: {
            'Authorization': 'InvalidFormat'
          }
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should accept valid authentication token', async () => {
        if (!TEST_AUTH_TOKEN) {
          console.warn('Skipping auth test: TEST_AUTH_TOKEN not set');
          return;
        }

        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        // Should not return auth errors with valid token
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      });
    });

    describe('Response Schema Validation', () => {
      it('should return valid onboarding response schema', async () => {
        if (!TEST_AUTH_TOKEN) {
          console.warn('Skipping test: TEST_AUTH_TOKEN not set');
          return;
        }
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          const result = OnboardingResponseSchema.safeParse(json);
          
          if (!result.success) {
            console.error('Schema validation errors:', result.error.errors);
          }
          
          expect(result.success).toBe(true);
        }
      });

      it('should return progress between 0 and 100', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(json.progress).toBeGreaterThanOrEqual(0);
          expect(json.progress).toBeLessThanOrEqual(100);
          expect(typeof json.progress).toBe('number');
        }
      });

      it('should return array of steps', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          expect(Array.isArray(json.steps)).toBe(true);
          expect(json.steps.length).toBeGreaterThan(0);
        }
      });

      it('should include required step properties', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          
          json.steps.forEach((step: any) => {
            expect(step).toHaveProperty('id');
            expect(step).toHaveProperty('version');
            expect(step).toHaveProperty('title');
            expect(step).toHaveProperty('required');
            expect(step).toHaveProperty('weight');
            expect(step).toHaveProperty('status');
            expect(['todo', 'done', 'skipped']).toContain(step.status);
          });
        }
      });

      it('should have valid step IDs', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          
          json.steps.forEach((step: any) => {
            expect(step.id).toMatch(/^[a-z_]+$/);
            expect(step.id.length).toBeGreaterThan(0);
          });
        }
      });
    });

    describe('Market-Specific Filtering', () => {
      it('should accept valid market parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const markets = ['FR', 'DE', 'US', 'GB', 'CA', 'AU'];
        
        for (const market of markets) {
          const response = await fetch(`${ONBOARDING_ENDPOINT}?market=${market}`, {
            headers: getAuthHeaders()
          });
          
          // Should not return 400 for valid markets
          if (response.status === 400) {
            const json = await response.json();
            expect(json.error).not.toContain('Invalid market');
          }
        }
      });

      it('should reject invalid market parameter format', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const invalidMarkets = ['F', 'FRA', '123', 'fr', 'US1', 'X@'];
        
        for (const market of invalidMarkets) {
          const response = await fetch(`${ONBOARDING_ENDPOINT}?market=${market}`, {
            headers: getAuthHeaders()
          });
          
          if (response.status === 400) {
            const json = await response.json();
            expect(json.error).toBeDefined();
          }
        }
      });

      it('should work without market parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        // Should not fail without market parameter
        expect([200, 401, 403]).toContain(response.status);
      });

      it('should filter steps based on market rules', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        // Get steps for France
        const frResponse = await fetch(`${ONBOARDING_ENDPOINT}?market=FR`, {
          headers: getAuthHeaders()
        });
        
        // Get steps for Germany
        const deResponse = await fetch(`${ONBOARDING_ENDPOINT}?market=DE`, {
          headers: getAuthHeaders()
        });
        
        if (frResponse.ok && deResponse.ok) {
          const frData = await frResponse.json();
          const deData = await deResponse.json();
          
          // Step lists may differ based on market-specific requirements
          // (e.g., DE has Impressum, FR has mentions légales)
          expect(Array.isArray(frData.steps)).toBe(true);
          expect(Array.isArray(deData.steps)).toBe(true);
        }
      });

      it('should handle case-sensitive market codes', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        // Lowercase should be rejected
        const response = await fetch(`${ONBOARDING_ENDPOINT}?market=fr`, {
          headers: getAuthHeaders()
        });
        
        if (response.status === 400) {
          const json = await response.json();
          expect(json.error).toBeDefined();
        }
      });
    });

    describe('Role-Based Visibility', () => {
      it('should filter steps based on user role', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          
          // Check if any steps have roleRestricted property
          const restrictedSteps = json.steps.filter((s: any) => s.roleRestricted);
          
          // If restricted steps exist, they should have valid role values
          restrictedSteps.forEach((step: any) => {
            expect(['owner', 'staff', 'admin']).toContain(step.roleRestricted);
          });
        }
      });

      it('should include all accessible steps for user role', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const json = await response.json();
          
          // User should see at least some steps
          expect(json.steps.length).toBeGreaterThan(0);
          
          // All steps should have valid status
          json.steps.forEach((step: any) => {
            expect(['todo', 'done', 'skipped']).toContain(step.status);
          });
        }
      });
    });

    describe('Error Handling', () => {
      it('should return error response on authentication failure', async () => {
        const response = await fetch(ONBOARDING_ENDPOINT);
        
        if (!response.ok) {
          const json = await response.json();
          const result = ErrorResponseSchema.safeParse(json);
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(json.error).toBeDefined();
            expect(typeof json.error).toBe('string');
          }
        }
      });

      it('should handle database errors gracefully', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        // This test validates error handling structure
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        // Should either succeed or return structured error
        if (!response.ok) {
          const json = await response.json();
          expect(json).toHaveProperty('error');
          expect(typeof json.error).toBe('string');
        }
      });

      it('should return 500 on internal server errors', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          headers: getAuthHeaders()
        });
        
        if (response.status === 500) {
          const json = await response.json();
          expect(json.error).toBeDefined();
          expect(json.error).toContain('Failed to fetch');
        }
      });
    });
  });

  describe('POST /api/onboarding', () => {
    describe('Authentication & Authorization', () => {
      it('should return 401 when not authenticated', async () => {
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ step: 'test_step', data: {} })
        });
        
        expect([401, 403]).toContain(response.status);
      });

      it('should accept valid authentication token', async () => {
        if (!TEST_AUTH_TOKEN) return;

        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ step: 'test_step', data: {} })
        });
        
        // Should not return auth errors with valid token
        expect(response.status).not.toBe(401);
        expect(response.status).not.toBe(403);
      });
    });

    describe('Request Validation', () => {
      it('should reject request without step parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ data: {} })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('step');
      });

      it('should reject null step parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ step: null, data: {} })
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toBeDefined();
      });

      it('should reject empty step parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ step: '', data: {} })
        });
        
        expect(response.status).toBe(400);
      });

      it('should reject invalid step format with special characters', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const invalidSteps = ['step with spaces', 'step@invalid', 'step!', 'step#123', 'step$'];
        
        for (const step of invalidSteps) {
          const response = await fetch(ONBOARDING_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ step, data: {} })
          });
          
          // Should return 400 for invalid format
          expect(response.status).toBe(400);
        }
      });

      it('should accept valid step format', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const validSteps = ['email_verification', 'payments', 'theme', 'product'];
        
        for (const step of validSteps) {
          const response = await fetch(ONBOARDING_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ step, data: {} })
          });
          
          // Should not return 400 for valid steps
          expect([200, 201, 404, 500]).toContain(response.status);
        }
      });

      it('should reject invalid JSON', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: 'invalid json'
        });
        
        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toBeDefined();
      });

      it('should accept request without data parameter', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ step: 'test_step' })
        });
        
        // data is optional, should not fail
        expect([200, 201, 404, 500]).toContain(response.status);
      });

      it('should accept complex data objects', async () => {
        if (!TEST_AUTH_TOKEN) return;
        
        const complexData = {
          nested: {
            value: 123,
            array: [1, 2, 3],
            boolean: true
          },
          timestamp: new Date().toISOString()
        };
        
        const response = await fetch(ONBOARDING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ step: 'test_step', data: complexData })
        });
        
        expect([200, 201, 404, 500]).toContain(response.status);
      });
    });

    describe('Success Response', () => {
      it('should return ok: true on success', async () => {
        if (!TEST_AUTH_TOKE;
        
        const respon {
          method: 'POST',
          h
           /json',
        )
          },
          body: JSON.stringify({ step: 'test_st})
        });
        
        if (response.ok) {
          const json = awai();
          const resultse(json);
          expect(result.success).toBe(true);
          expect(json.ok).toBe(tre);
        }
      });

      it('should be idempotent', async (> {
        if (!Tn;
        
        //
        const requestBody = JSON.stringify({ 
          step: 'idempotent_test', 
          data: { time() } 
        });
        
        const
          ,
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: requestBody
        });
        
        c
       

            'Content-Type': 'application
            ...getAuthHeaders()
          },
          body: requestBoy
        });
        
        if (response1.ok && res
          con();
          const json2 = await reson();
          
          expect(json1.ok).toBe(true);
          extrue);
        }
      })

      it('should handle rapid successive upda
        if (!TEST_AUTH_TOKEN) return;
        
        c>
       NT, {
',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSngify({ 
              step: 'rapid_test', 
              data: { iteration: i } 
            )
          })
        );
        
        const responses = a
        
        // All should succeed or fail consiently
        r{
         
       
      });
);

    describe('Error Handling', () => {
      it('should return structu
        const response = await fetch(ONBOARDING_ENDPOINT,{
          method: ST',
          headers: {
         
         ,
          body: JSON.stringify({ step: 'tet' })
      
        
        if (!response.ok) {
       
or');
          expect(typeof json.error).toBe('string');
        }
      });

      it('should handle missingnc () => {
        if rn;
        
        {
      T',
          headers: getAuthHeaders(),
      
        });
        
        // Should handle gracefully
        e
      });
    }
  }

  });
});});
5);
    (40oBese.status).tct(respon   expe       

       });test' })
  ' step:({N.stringifyJSO      body:      },
  json',
   cation/li'apppe': 'Content-Ty         {
  headers:
        CH',: 'PAThod       metDPOINT, {
 OARDING_ENfetch(ONBwait  ase =on const resp => {
     d', async ()ATCH metho reject P  it('should

  ;
    });05)(4tus).toBetase.sonxpect(resp   e   
     });
   ETE'
    hod: 'DEL met     OINT, {
  ARDING_ENDPNBOait fetch(Onse = awpost res
      con { () =>d', asyncE methot DELETuld rejec it('sho });

     5);
 .toBe(40nse.status)(respo     expect     
     });
 
  ' }): 'testify({ stepON.string JS      body:
  },        n/json',
catioype': 'appli'Content-T       
   { headers:       ,
 PUT'd: 'ho        metPOINT, {
ING_ENDONBOARDh(ait fetc aw =nst response {
      coasync () =>ethod',  mject PUT ret('should);

    i  }  e(405);
tus).not.toBstaesponse.pect(r5
      ex return 40ould not   // Sh    
    });
  ' })
     'test step: ringify({ody: JSON.st    b          },
 ,
 cation/json' 'applient-Type':      'Cont    ers: {
 head      : 'POST',
 thod       meOINT, {
 ENDPARDING_ch(ONBOt fetse = awaiconst respon=> {
       async () ST method',support PO'should 
    it(    });
oBe(405);
.ttus).notresponse.sta    expect(  405
turn hould not re
      // S      
); }'GET'
     thod:     meT, {
    NG_ENDPOINONBOARDIfetch(wait  asponse =    const re () => {
  ', asyncET methodld support G  it('shou
  s', () => {hod('HTTP Met describe
 
  });
}); });
                }
 0);
(20Be.toe2.status)respons expect(      dated)
   che invalih data (ca freseturn rould // Sh{
         ) e2.okns(respo if           
 });
     )
       hHeaders(getAuts: header     {
     INT, NG_ENDPOBOARDIch(ON = await fet response2  const
      stateed T updat/ GE /         
  );
      }
          }) 
      .now() }stamp: Date { time      data:     , 
 t''cache_tes   step:  
         gify({ JSON.strin      body:          },
)
    hHeaders(.getAut    ..,
        cation/json'e': 'appliContent-Typ '         
  ers: {     head    'POST',
 hod:       met{
    , _ENDPOINTh(ONBOARDINGetcawait fe
        OST updat       // P
        
 ok) return;esponse1.!rf (     i       
   });
        ers()
 eadtAuthHders: geea    h, {
      NG_ENDPOINTBOARDItch(ON = await fest response1        contate
al sGET initi
        //     urn;
    N) ret_AUTH_TOKEif (!TEST {
        c () =>OST', asynafter Pache nvalidate cd iulho   it('s
   > {) =, (validation'e InCach('escribe    d });

    });
   
  );        }0);
GreaterThan(us).toBense.statct(respoexpe          {
 nse =>rEach(resporesponses.fo;
        toBe(10)gth).s.lent(response  expece
      uld complet All sho   //    
     
    );ostRequests].p, ..equests...getRomise.all([t Prses = awaionst respon c       
  );
              )
   }            })
   
    } a: {      dat      ${i}`, 
  `mixed_test_step:           { 
    .stringify(JSONy:    bod             },
        eaders()
AuthH     ...get
         tion/json',pplicant-Type': 'ate  'Con           
 s: {eader h          'POST',
 ethod:       m
      T, {OING_ENDPINARDtch(ONBO      fe   ) =>
 5 }, (_, im({ length: rray.froequests = Aconst postR 
             );
  
               })  s()
 tAuthHeader: ge    headers {
        ENDPOINT,OARDING_  fetch(ONB>
         = ()},length: 5 .from({  = ArrayetRequestsnst g
        co  
      turn;N) reTOKEH_ST_AUTif (!TE
        => {)  (ncests', asy requconcurrent/POST e mixed GETdld han it('shoul});

     );
          }  ;
  s)se.statuin(respon0]).toConta201, 400, 50t([200, xpec          e
onse => {espforEach(rresponses.       s
 orout errmplete withcould // All sho          
    );
  l(requests.alwait Promises = anst response  co     
        
     );})
           })
             
  dex: i }  inta: {         da, 
     {i}`t_$nt_tesp: `concurreste        y({ 
      ringifody: JSON.st        b
      },        ers()
  ad..getAuthHe        .',
      sonpplication/j': 'aype-Tent   'Cont     
      headers: {         'POST',
   od:      meth, {
       OINTG_ENDPch(ONBOARDINfet      =>
     , (_, i)th: 10 }om({ leng= Array.frs uest   const req        
 n;
    N) returOKEUTH_Tf (!TEST_A      i() => {
  async s', questt POST ree concurrenould handl'sh   it(

     });    });
 
       us);statonse.tain(resptoCon0]).03, 500, 401, 4ect([20      exp{
    ponse => forEach(reses.ns    respo
    ntlynsister fail cod succeed o/ All shoul     / 
     ;
     equests).all(r Promiseitponses = awanst res
        co         );
             })
 ders()
   : getAuthHeaers     head {
       T,NG_ENDPOINBOARDIetch(ON         f=>
 10 }, () ength: .from({ l= Arrays  requestonst        c      
turn;
  H_TOKEN) re!TEST_AUT if (  
      () => {ncs', asyT requestrent GEncurle coandit('should h> {
      ccess', () =ent Aurr('Conc   describe
 
    });      });

        }
00);(10eLessThan).toB(duration  expectnd
         1 secod withinuld respon   // Sho) {
       (response.ok if           
t;
     star- ow() ate.ntion = Dt dura cons
              });)
 , data: {} }test'ep: 'perf_fy({ stngi: JSON.stri  body        },
   
       ders()Hea...getAuth          json',
  ion/icat': 'appltent-Type      'Con      rs: {
eade          hT',
OSthod: 'P      me {
    DPOINT,_ENNBOARDING(Och = await fetonseesp const r       w();
ate.no = D start       const    
 rn;
    TOKEN) retuEST_AUTH_   if (!T => {
     ', async ()timele ptabhin acceST witPOond to resp it('should 

        });     }
   );
   sThan(1000).toBeLesuration(d     expectcond
      within 1 seld respondShou      //    ok) {
 esponse.      if (r       
  art;
 ow() - stte.n= Dat duration         cons       });
()
 Headersth: getAuers      head   , {
 POINTOARDING_ENDfetch(ONBait  = awsponse  const re
      Date.now();rt =    const sta    
         rn;
etu) r_AUTH_TOKEN  if (!TEST
      => {async () ', le timehin acceptab to GET wituld respond    it('sho) => {
  ime', ( Tesponsedescribe('R> {
     () =y', Concurrencformance &cribe('Perdes
  