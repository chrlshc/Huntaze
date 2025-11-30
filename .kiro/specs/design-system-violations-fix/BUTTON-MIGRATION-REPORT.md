# Button Component Migration Report

## Summary
- **Files Modified**: 44
- **Auto-Fixed**: 79
- **Manual Review Needed**: 717
- **Total Changes**: 796

## Auto-Fixed Buttons (79)

### components/IOSA2HSOverlay.tsx:19
**Original:**
```tsx
<button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-black text-white">
            J’ai c
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
            J’ai compris
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### src/components/use-cases-carousel.tsx:122
**Original:**
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium tra
```

**Fixed:**
```tsx
<Button variant="primary">
                            Read full story →
                          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### src/components/product-mockups.tsx:44
**Original:**
```tsx
<button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-pu
```

**Fixed:**
```tsx
<Button variant="primary">
                Export Report
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### src/components/creator-testimonials.tsx:117
**Original:**
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium tra
```

**Fixed:**
```tsx
<Button variant="primary">
                  Read full story →
                </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### src/components/EditableField.tsx:60
**Original:**
```tsx
<button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSave}>
            Enregistrer
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/pricing/UpgradeModal.tsx:44
**Original:**
```tsx
<button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">✕</
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>✕</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/platforms/InstagramDashboardWidget.tsx:62
**Original:**
```tsx
<button className="text-sm text-red-600 hover:text-red-700">Disconnect</button>
```

**Fixed:**
```tsx
<Button variant="danger">Disconnect</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/SafeAreaExamples.tsx:31
**Original:**
```tsx
<button className="lg:hidden">Menu</button>
```

**Fixed:**
```tsx
<Button variant="primary">Menu</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/SafeAreaExamples.tsx:95
**Original:**
```tsx
<button className="px-4 py-2">Cancel</button>
```

**Fixed:**
```tsx
<Button variant="primary">Cancel</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/SafeAreaExamples.tsx:96
**Original:**
```tsx
<button className="px-4 py-2 bg-primary text-white rounded-lg">
            Confirm
          </butt
```

**Fixed:**
```tsx
<Button variant="primary">
            Confirm
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/CenteredContainer.example.tsx:183
**Original:**
```tsx
<button className="h-12 px-8 bg-accent-primary text-white rounded-md hover:bg-accent-hover text-lg">
```

**Fixed:**
```tsx
<Button variant="primary">
          Get Started Free
        </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/CenteredContainer.example.tsx:284
**Original:**
```tsx
<button className="text-accent-primary hover:text-accent-hover">
                    Edit
          
```

**Fixed:**
```tsx
<Button variant="primary">
                    Edit
                  </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/CenteredContainer.example.tsx:298
**Original:**
```tsx
<button className="text-accent-primary hover:text-accent-hover">
                    Edit
          
```

**Fixed:**
```tsx
<Button variant="primary">
                    Edit
                  </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/CenteredContainer.example.tsx:330
**Original:**
```tsx
<button className="h-12 px-8 bg-accent-primary text-white rounded-md hover:bg-accent-hover">
       
```

**Fixed:**
```tsx
<Button variant="primary">
            Start Free Trial
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/layout/CenteredContainer.example.tsx:333
**Original:**
```tsx
<button className="h-12 px-8 bg-transparent border border-subtle text-primary rounded-md hover:bg-ho
```

**Fixed:**
```tsx
<Button variant="primary">
            Schedule Demo
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/integrations/IntegrationsSection.tsx:204
**Original:**
```tsx
<button className="text-xs bg-white text-purple-600 px-3 py-1.5 rounded-full font-medium hover:bg-gr
```

**Fixed:**
```tsx
<Button variant="ghost">
                          Connect
                        </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/integrations/IntegrationsSection.tsx:246
**Original:**
```tsx
<button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full fo
```

**Fixed:**
```tsx
<Button variant="primary">
            Request an Integration
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/integrations/IntegrationsHero.tsx:44
**Original:**
```tsx
<button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold r
```

**Fixed:**
```tsx
<Button variant="primary">
            Browse All Integrations
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/integrations/IntegrationsHero.tsx:47
**Original:**
```tsx
<button className="px-8 py-4 border-2 border-purple-200 text-purple-600 font-semibold rounded-xl hov
```

**Fixed:**
```tsx
<Button variant="outline">
            Request Integration
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/animations/LiveDashboard.tsx:401
**Original:**
```tsx
<button className="text-xs text-white/70 hover:text-white transition-colors">
          {action} →
 
```

**Fixed:**
```tsx
<Button variant="primary">
          {action} →
        </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/VideoEditor.tsx:67
**Original:**
```tsx
<button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onCancel}>✕</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/VideoEditor.tsx:89
**Original:**
```tsx
<button onClick={addCaption} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-bl
```

**Fixed:**
```tsx
<Button variant="primary" onClick={addCaption}>+ Add</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/VideoEditor.tsx:97
**Original:**
```tsx
<button onClick={() => removeCaption(index)} className="text-red-600 hover:text-red-800 text-sm">Rem
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => removeCaption(index)}>Remove</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/TemplateSelector.tsx:147
**Original:**
```tsx
<button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>✕</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:137
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">👍 Like</button>
```

**Fixed:**
```tsx
<Button variant="ghost">👍 Like</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:138
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">💬 Comment</button>
```

**Fixed:**
```tsx
<Button variant="ghost">💬 Comment</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:139
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">📤 Share</button>
```

**Fixed:**
```tsx
<Button variant="ghost">📤 Share</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:163
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">👍 Like</button>
```

**Fixed:**
```tsx
<Button variant="ghost">👍 Like</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:164
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">💬 Comment</button>
```

**Fixed:**
```tsx
<Button variant="ghost">💬 Comment</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:165
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">🔁 Repost</button>
```

**Fixed:**
```tsx
<Button variant="ghost">🔁 Repost</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/PlatformPreview.tsx:166
**Original:**
```tsx
<button className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded">📤 Send</button>
```

**Fixed:**
```tsx
<Button variant="ghost">📤 Send</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/ImageEditor.tsx:86
**Original:**
```tsx
<button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            ✕
          </
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onCancel}>
            ✕
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### components/content/AIAssistant.tsx:90
**Original:**
```tsx
<button onClick={() => onSuggestionSelect(suggestion.content)} className="text-xs px-3 py-1 bg-purpl
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => onSuggestionSelect(suggestion.content)}>Use This</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/roadmap/roadmap-client.tsx:69
**Original:**
```tsx
<button onClick={() => vote(p.id)} className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 tex
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => vote(p.id)}>Vote</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/status/page.tsx:175
**Original:**
```tsx
<button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colo
```

**Fixed:**
```tsx
<Button variant="primary">
                Subscribe to Updates
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/blog/page.tsx:248
**Original:**
```tsx
<button className="px-8 py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-f
```

**Fixed:**
```tsx
<Button variant="primary">
              Load more articles
            </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/ai-images-comparison/page.tsx:261
**Original:**
```tsx
<button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold round
```

**Fixed:**
```tsx
<Button variant="primary">
              Get The AI That Matches Your Standards →
            </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/ai-technology/page.tsx:208
**Original:**
```tsx
<button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold round
```

**Fixed:**
```tsx
<Button variant="primary">
            Choose Your AI Power Level →
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/manage-business/page.tsx:247
**Original:**
```tsx
<button className="w-full mt-6 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 tra
```

**Fixed:**
```tsx
<Button variant="primary">
                View Full Report
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/flows/page.tsx:47
**Original:**
```tsx
<button className="btn-primary w-full mt-4 rounded-full py-2 animate-pulse-soft">Choose {p.name}</bu
```

**Fixed:**
```tsx
<Button variant="primary">Choose {p.name}</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/design-system/page.tsx:14
**Original:**
```tsx
<button className="btn-primary px-5 py-2 rounded-full hover-lift-soft">Primary</button>
```

**Fixed:**
```tsx
<Button variant="primary">Primary</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/design-system/page.tsx:15
**Original:**
```tsx
<button className="btn-secondary px-5 py-2 rounded-full hover-lift-soft">Secondary</button>
```

**Fixed:**
```tsx
<Button variant="secondary">Secondary</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/design-system/page.tsx:16
**Original:**
```tsx
<button className="btn-outline px-5 py-2 rounded-full hover-lift-soft">Outline</button>
```

**Fixed:**
```tsx
<Button variant="outline">Outline</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/connect-of/page.tsx:71
**Original:**
```tsx
<button onClick={openInApp} className="hz-button">Open in app</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={openInApp}>Open in app</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/platforms/connect/page.tsx:101
**Original:**
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium tra
```

**Fixed:**
```tsx
<Button variant="primary">Import OF CSV</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/platforms/connect/page.tsx:119
**Original:**
```tsx
<button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium tra
```

**Fixed:**
```tsx
<Button variant="primary">
                Connect Reddit
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/platforms/connect/page.tsx:133
**Original:**
```tsx
<button className="px-6 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition
```

**Fixed:**
```tsx
<Button variant="primary">
                Connect TikTok
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/platforms/connect/page.tsx:149
**Original:**
```tsx
<button className="px-6 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition
```

**Fixed:**
```tsx
<Button variant="primary">
                Connect Threads
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/platforms/connect/page.tsx:164
**Original:**
```tsx
<button disabled className="px-6 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-all
```

**Fixed:**
```tsx
<Button variant="primary" disabled>
              Verification required
            </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/features/onlyfans/page.tsx:30
**Original:**
```tsx
<button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:shadow-xl transform
```

**Fixed:**
```tsx
<Button variant="primary">
              View Simple Pricing →
            </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/features/onlyfans/page.tsx:255
**Original:**
```tsx
<button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold round
```

**Fixed:**
```tsx
<Button variant="primary">
                See Simple, Honest Pricing
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/features/dashboard/page.tsx:245
**Original:**
```tsx
<button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition
```

**Fixed:**
```tsx
<Button variant="primary">
                Download for iOS
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/features/dashboard/page.tsx:248
**Original:**
```tsx
<button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition
```

**Fixed:**
```tsx
<Button variant="primary">
                Download for Android
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/features/content-scheduler/page.tsx:507
**Original:**
```tsx
<button className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-co
```

**Fixed:**
```tsx
<Button variant="primary">
                    Schedule Post
                  </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/api/monitoring/metrics/example-component.tsx:64
**Original:**
```tsx
<button onClick={refresh} className="btn-retry">
            Retry
          </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={refresh}>
            Retry
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/settings/page.tsx:340
**Original:**
```tsx
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[var(--colo
```

**Fixed:**
```tsx
<Button variant="ghost">
                    Upgrade Plan
                  </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/fans/page.tsx:132
**Original:**
```tsx
<button className="px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-whi
```

**Fixed:**
```tsx
<Button variant="primary">
                      Message
                    </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/ppv/page.tsx:339
**Original:**
```tsx
<button className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark
```

**Fixed:**
```tsx
<Button variant="primary">
                            Send Now
                          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/ppv/page.tsx:342
**Original:**
```tsx
<button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gra
```

**Fixed:**
```tsx
<Button variant="ghost">
                            Edit
                          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/ppv/page.tsx:348
**Original:**
```tsx
<button className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg t
```

**Fixed:**
```tsx
<Button variant="ghost">
                            View Details
                          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/ppv/page.tsx:351
**Original:**
```tsx
<button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gra
```

**Fixed:**
```tsx
<Button variant="ghost">
                            Duplicate
                          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/ppv/page.tsx:472
**Original:**
```tsx
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 da
```

**Fixed:**
```tsx
<Button variant="ghost">
                Save as Draft
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/ppv/page.tsx:475
**Original:**
```tsx
<button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:
```

**Fixed:**
```tsx
<Button variant="primary">
                Create & Send
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onboarding/optimize/page.tsx:212
**Original:**
```tsx
<button onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-lg hover:b
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onboarding/optimize/page.tsx:216
**Original:**
```tsx
<button onClick={finalizeAndGoDashboard} className="px-6 py-2 text-gray-600 hover:text-gray-800">
  
```

**Fixed:**
```tsx
<Button variant="primary" onClick={finalizeAndGoDashboard}>
              Skip Testing
            </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/upsells/page.tsx:134
**Original:**
```tsx
<button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/churn/page.tsx:148
**Original:**
```tsx
<button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/payouts/page.tsx:81
**Original:**
```tsx
<button onClick={handleSync} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-70
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSync}>Sync Payouts</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/payouts/page.tsx:82
**Original:**
```tsx
<button onClick={handleExport} className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg h
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleExport}>Export</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/payouts/page.tsx:109
**Original:**
```tsx
<button onClick={handleUpdateTaxRate} className="w-full mt-4 px-4 py-2 bg-purple-600 text-white roun
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleUpdateTaxRate}>Update Tax Rate</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/payouts/page.tsx:121
**Original:**
```tsx
<button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/analytics/forecast/page.tsx:89
**Original:**
```tsx
<button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(marketing)/platforms/connect/onlyfans/page.tsx:144
**Original:**
```tsx
<button disabled className="w-full py-2.5 bg-gray-400 text-white rounded-lg font-medium mt-2">
     
```

**Fixed:**
```tsx
<Button variant="primary" disabled>
                Direct connection (coming soon)
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/settings/welcome/page.tsx:448
**Original:**
```tsx
<button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:
```

**Fixed:**
```tsx
<Button variant="primary">
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/messages/mass/page.tsx:474
**Original:**
```tsx
<button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gra
```

**Fixed:**
```tsx
<Button variant="ghost">
                        Edit
                      </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/messages/mass/page.tsx:477
**Original:**
```tsx
<button className="px-3 py-1 text-sm border border-red-300 dark:border-red-600 rounded-lg text-red-7
```

**Fixed:**
```tsx
<Button variant="danger">
                        Cancel
                      </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/onlyfans/messages/mass/page.tsx:531
**Original:**
```tsx
<button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gra
```

**Fixed:**
```tsx
<Button variant="ghost">
                      View Details
                    </Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/marketing/campaigns/new/page.tsx:298
**Original:**
```tsx
<button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
```

**Reason:** Simple button pattern - auto-fixed

---

### app/(app)/marketing/campaigns/[id]/page.tsx:335
**Original:**
```tsx
<button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
```

**Reason:** Simple button pattern - auto-fixed

---


## Manual Review Required (717)

### hooks/useValidationHealth.ts:25
**Current Code:**
```tsx
<button onClick={refresh}>Refresh</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/useOnboardingComplete.ts:26
**Current Code:**
```tsx
<button disabled={loading}>Complete</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/useMonitoringMetrics.ts:25
**Current Code:**
```tsx
<button onClick={refresh}>Refresh</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/useCsrfToken.ts:246
**Current Code:**
```tsx
<button onClick={refresh}>Retry</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/useAuthSession.ts:47
**Current Code:**
```tsx
<button onClick={logout}>Logout</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/useAccessibilityValidation.ts:125
**Current Code:**
```tsx
<button ref={ref}>Click me</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ThemeToggle.tsx:33
**Current Code:**
```tsx
<button
          key={value}
          onClick={() => handleThemeChange(value)}
          aria-pressed={theme === value}
          aria-label={`Switc...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/OFConnectBanner.tsx:31
**Current Code:**
```tsx
<button
                onClick={promptInstall}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary-active)] text-white hover:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/OFConnectBanner.tsx:40
**Current Code:**
```tsx
<button
                onClick={() => setShowIOS(true)}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transit...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/OFConnectBanner.tsx:48
**Current Code:**
```tsx
<button
              onClick={() => (window.location.href = 'huntaze://connect')}
              className="px-4 py-2 rounded-xl border"
            >...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/MobileSidebar.tsx:76
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden"
        style={{
          padding: '8px',
          color: 'var(--co...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/MobileSidebar.tsx:172
**Current Code:**
```tsx
<button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '8px',
              color: 'var(--color-text-sub)',
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/LinearHeader.tsx:82
**Current Code:**
```tsx
<button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white/70 hover:text-white p-2"
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/InteractiveDemo.tsx:117
**Current Code:**
```tsx
<button
                onClick={reset}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                titl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/InteractiveDemo.tsx:124
**Current Code:**
```tsx
<button
                onClick={togglePlay}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
               ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/InteractiveDemo.tsx:277
**Current Code:**
```tsx
<button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-whit...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/InteractiveDemo.tsx:289
**Current Code:**
```tsx
<button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/Header.tsx:35
**Current Code:**
```tsx
<button
            className="rounded-lg"
            style={{
              padding: 'var(--spacing-2)',
              color: 'var(--nav-text-muted)...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/Header.tsx:112
**Current Code:**
```tsx
<button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg"
              style={{
                paddin...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/CookieConsent.tsx:80
**Current Code:**
```tsx
<button
              onClick={() => handleConsent(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-me...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/CookieConsent.tsx:86
**Current Code:**
```tsx
<button
              onClick={() => handleConsent(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-med...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:90
**Current Code:**
```tsx
<button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:168
**Current Code:**
```tsx
<button
                            key={option.value}
                            type="button"
                            onClick={() => setFormDat...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:190
**Current Code:**
```tsx
<button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!formData.firstName || !f...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:217
**Current Code:**
```tsx
<button
                              key={option.value}
                              type="button"
                              onClick={() => setF...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:277
**Current Code:**
```tsx
<button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:284
**Current Code:**
```tsx
<button
                        type="submit"
                        disabled={!formData.currentPainPoint}
                        className="flex-1 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ContactSalesModal.tsx:315
**Current Code:**
```tsx
<button
                      onClick={onClose}
                      className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/global-error.tsx:27
**Current Code:**
```tsx
<button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/error.tsx:25
**Current Code:**
```tsx
<button
          onClick={reset}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/use-cases-carousel.tsx:164
**Current Code:**
```tsx
<button
            onClick={goToPrevious}
            className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/use-cases-carousel.tsx:171
**Current Code:**
```tsx
<button
            onClick={goToNext}
            className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/use-cases-carousel.tsx:181
**Current Code:**
```tsx
<button
              onClick={goToPrevious}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
              aria-label="Previou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/use-cases-carousel.tsx:188
**Current Code:**
```tsx
<button
              onClick={goToNext}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
              aria-label="Next"
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/theme-toggle.tsx:20
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/theme-toggle.tsx:71
**Current Code:**
```tsx
<button
                    key={t.value}
                    onClick={() => {
                      setTheme(t.value as any)
                      se...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/theme-toggle.tsx:111
**Current Code:**
```tsx
<button
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors"
      aria-lab...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/theme-toggle-enhanced.tsx:35
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:ho...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/product-mockups.tsx:221
**Current Code:**
```tsx
<button className="p-2 bg-purple-600 text-white rounded-full">
              <MessageSquare className="w-5 h-5" />
            </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/product-mockups.tsx:245
**Current Code:**
```tsx
<button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/pricing-faq.tsx:47
**Current Code:**
```tsx
<button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/navigation.tsx:45
**Current Code:**
```tsx
<button
        className="md:hidden text-text-primary"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/navigation-unified.tsx:81
**Current Code:**
```tsx
<button
            className="md:hidden p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover rounded-lg transition-colors"
            onClic...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-shopify.tsx:51
**Current Code:**
```tsx
<button
                  className="flex items-center gap-1 text-white hover:text-gray-300 text-[16px] font-medium py-2"
                  onMouseEnt...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-shopify.tsx:205
**Current Code:**
```tsx
<button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileM...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-shopify-style.tsx:49
**Current Code:**
```tsx
<button
                      className="text-gray-300 hover:text-white text-[15px] font-medium flex items-center gap-1 py-2"
                      on...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-shopify-style.tsx:97
**Current Code:**
```tsx
<button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileM...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-mobile-optimized.tsx:152
**Current Code:**
```tsx
<button 
                  onClick={handleLogout} 
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 touch-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-mobile-optimized.tsx:189
**Current Code:**
```tsx
<button
            className="
              lg:hidden
              flex items-center justify-center
              w-[var(--touch-target-min)]
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-mobile-optimized.tsx:363
**Current Code:**
```tsx
<button
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-minimal.tsx:120
**Current Code:**
```tsx
<button className="flex items-center space-x-1 text-gray-300 hover:text-white text-sm focus:outline-none">
                <span>Solutions</span>
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-minimal.tsx:166
**Current Code:**
```tsx
<button className="flex items-center space-x-1 text-gray-300 hover:text-white text-sm focus:outline-none">
                <span>Resources</span>
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-minimal.tsx:226
**Current Code:**
```tsx
<button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobil...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-marketing.tsx:95
**Current Code:**
```tsx
<button
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-1 py-2"
                        onClick={() =>...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-marketing.tsx:164
**Current Code:**
```tsx
<button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileM...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-marketing.tsx:191
**Current Code:**
```tsx
<button
                          className="text-gray-300 text-base font-medium w-full text-left px-4 py-2"
                          onClick={() => ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-improved.tsx:283
**Current Code:**
```tsx
<button 
                  onClick={handleLogout} 
                  className="text-text-secondary hover:text-text-primary text-sm font-medium px-3 p...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-improved.tsx:312
**Current Code:**
```tsx
<button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ?...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/header-improved.tsx:425
**Current Code:**
```tsx
<button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/footer-improved.tsx:194
**Current Code:**
```tsx
<button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Globe className="w-4 h-4" /...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/floating-assistant.tsx:90
**Current Code:**
```tsx
<button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/floating-assistant.tsx:111
**Current Code:**
```tsx
<button
                        key={index}
                        onClick={() => handleSuggestion(suggestion)}
                        className="w-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/faq-section.tsx:76
**Current Code:**
```tsx
<button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/enterprise-nav.tsx:120
**Current Code:**
```tsx
<button
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/enterprise-nav.tsx:175
**Current Code:**
```tsx
<button
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/creator-testimonials.tsx:164
**Current Code:**
```tsx
<button
            onClick={prev}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:-translate-x-fu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/creator-testimonials.tsx:171
**Current Code:**
```tsx
<button
            onClick={next}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 lg:translate-x-ful...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/creator-testimonials.tsx:180
**Current Code:**
```tsx
<button
              onClick={prev}
              className="p-2 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg"
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/creator-testimonials.tsx:186
**Current Code:**
```tsx
<button
              onClick={next}
              className="p-2 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg"
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/command-palette.tsx:71
**Current Code:**
```tsx
<button
        onClick={() => setOpen(true)}
        className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-topbar.tsx:108
**Current Code:**
```tsx
<button
              type="button"
              onClick={onDiscard}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:bord...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-topbar.tsx:115
**Current Code:**
```tsx
<button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm"
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-sidebar.tsx:204
**Current Code:**
```tsx
<button
            onClick={() => toggleExpanded(item.label)}
            className={`nav-item w-full text-left ${depth > 0 ? 'pl-8' : ''}`}
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-sidebar.tsx:313
**Current Code:**
```tsx
<button
        ref={openBtnRef}
        aria-label="Open menu"
        className="mobile-drawer-trigger"
        onClick={() => setDrawerOpen(true)}
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-sidebar.tsx:352
**Current Code:**
```tsx
<button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="mobile-drawer-cl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-sidebar-unified.tsx:202
**Current Code:**
```tsx
<button
        ref={openBtnRef}
        aria-label="Open menu"
        className="mobile-drawer-trigger"
        onClick={() => setDrawerOpen(true)}
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/app-sidebar-unified.tsx:241
**Current Code:**
```tsx
<button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="mobile-drawer-cl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/Toast.ts:39
**Current Code:**
```tsx
<button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200" onclick="this.parentElement.parentEle...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ErrorBoundary.tsx:100
**Current Code:**
```tsx
<button
                  onClick={this.handleReset}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/EditableField.tsx:31
**Current Code:**
```tsx
<button
          onClick={() => {
            setDraft(value);
            setEditing((prev) => !prev);
          }}
          className="text-sm tex...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/CookieConsent.tsx:130
**Current Code:**
```tsx
<button
                onClick={() => setShowDetails(true)}
                className="text-sm text-purple-600 hover:text-purple-700 mt-2 underline"
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/CookieConsent.tsx:141
**Current Code:**
```tsx
<button
                onClick={handleRejectAll}
                className="btn-secondary text-sm"
              >
                Reject All
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/CookieConsent.tsx:147
**Current Code:**
```tsx
<button
                onClick={handleAcceptAll}
                className="btn-primary text-sm"
              >
                Accept All
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/CookieConsent.tsx:155
**Current Code:**
```tsx
<button
              onClick={() => setShowDetails(false)}
              className="lg:hidden absolute top-4 right-4"
            >
              <X ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/CookieConsent.tsx:252
**Current Code:**
```tsx
<button
                onClick={handleRejectAll}
                className="btn-secondary text-sm"
              >
                Reject All
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/CookieConsent.tsx:258
**Current Code:**
```tsx
<button
                onClick={handleAcceptSelected}
                className="btn-primary text-sm"
              >
                Save Preference...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ComplianceChecker.tsx:181
**Current Code:**
```tsx
<button
            onClick={() => checkContent(content, niche, context).then(setResult)}
            disabled={isChecking || (content?.trim()?.length...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ComplianceChecker.tsx:233
**Current Code:**
```tsx
<button
                      onClick={() => applyQuickFix(risk)}
                      disabled={isApplyingFix}
                      className="flex...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ComplianceChecker.tsx:263
**Current Code:**
```tsx
<button
            onClick={applyBulkFixes}
            disabled={isApplyingFix}
            className="w-full text-xs px-3 py-2 bg-blue-600 text-whi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### lib/devtools/hydrationDevtools.ts:637
**Current Code:**
```tsx
<button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: var(--text-base); cursor: pointer;">×</b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/billing/useCheckout.ts:67
**Current Code:**
```tsx
<button onClick={handlePurchase} disabled={loading}>
 *       {loading ? 'Processing...' : 'Buy Pack'}
 *     </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/billing/useCheckout.ts:162
**Current Code:**
```tsx
<button onClick={() => purchasePack('25k')} disabled={loading}>
 *       Buy 25k Pack
 *     </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### hooks/auth/useAuthSession.ts:46
**Current Code:**
```tsx
<button onClick={logout}>Logout</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:50
**Current Code:**
```tsx
<button
                    onClick={() => setActiveExample(example.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:429
**Current Code:**
```tsx
<button onClick={() => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              api.loca...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:471
**Current Code:**
```tsx
<button 
                onClick={toggleTheme}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:596
**Current Code:**
```tsx
<button 
                  onClick={() => setTheme('light')}
                  className="px-2 py-1 bg-yellow-400 text-black rounded text-sm"
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:602
**Current Code:**
```tsx
<button 
                  onClick={() => setTheme('dark')}
                  className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:608
**Current Code:**
```tsx
<button 
                  onClick={() => setTheme('system')}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### examples/hydration/interactive-examples.tsx:664
**Current Code:**
```tsx
<button
              onClick={() => setShowCode(!showCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/validation/ValidationHealthDashboard.tsx:148
**Current Code:**
```tsx
<button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transitio...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/validation/ValidationHealthDashboard.tsx:187
**Current Code:**
```tsx
<button
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/toast.tsx:85
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-sm text-gra...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:53
**Current Code:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:65
**Current Code:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:114
**Current Code:**
```tsx
<button
                type="submit"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRad...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:144
**Current Code:**
```tsx
<button
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1p...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:176
**Current Code:**
```tsx
<button
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: 'no...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:269
**Current Code:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/page-layout.example.tsx:282
**Current Code:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:31
**Current Code:**
```tsx
<button
          onClick={() => setBasicOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:58
**Current Code:**
```tsx
<button
          onClick={() => setConfirmOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:77
**Current Code:**
```tsx
<button
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:90
**Current Code:**
```tsx
<button
                onClick={() => {
                  alert('Item deleted!');
                  setConfirmOpen(false);
                }}
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:118
**Current Code:**
```tsx
<button
          onClick={() => setFormOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: '...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:137
**Current Code:**
```tsx
<button
                onClick={() => setFormOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:150
**Current Code:**
```tsx
<button
                onClick={() => {
                  alert('Item added!');
                  setFormOpen(false);
                }}
            ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:214
**Current Code:**
```tsx
<button
          onClick={() => setLargeOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:251
**Current Code:**
```tsx
<button
          onClick={() => setScrollOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:269
**Current Code:**
```tsx
<button
              onClick={() => setScrollOpen(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:299
**Current Code:**
```tsx
<button
          onClick={() => setNoBackdropClose(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            backgr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/modal.example.tsx:318
**Current Code:**
```tsx
<button
              onClick={() => setNoBackdropClose(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/export-all.tsx:47
**Current Code:**
```tsx
<button className={`px-4 py-2 rounded-md ${variantClasses} ${className}`} {...props}>{children}</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/export-all.tsx:56
**Current Code:**
```tsx
<button className="border rounded px-2 py-1 w-full text-left" {...props}>{children}</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/export-all.tsx:63
**Current Code:**
```tsx
<button className={`px-4 py-2 ${className}`} {...props}>{children}</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/container.example.tsx:41
**Current Code:**
```tsx
<button type="submit">Submit</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/alert.tsx:219
**Current Code:**
```tsx
<button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="alert-dismiss-button"
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/alert.example.tsx:116
**Current Code:**
```tsx
<button
              onClick={() => setShowDismissible(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/alert.example.tsx:155
**Current Code:**
```tsx
<button
              onClick={() => setShowAutoDismiss(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/ShopifyStyleOnboardingModal.tsx:64
**Current Code:**
```tsx
<button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 focus-visible:outline-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/ModuleCard.tsx:99
**Current Code:**
```tsx
<button
            type="button"
            onClick={() => emitAction('refresh')}
            className="rounded-md border border-gray-300 px-3 py-1...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/ModuleCard.tsx:106
**Current Code:**
```tsx
<button
            type="button"
            onClick={() => emitAction('open')}
            className="rounded-md bg-gray-900 px-3 py-1 text-xs font-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ui/Modal.tsx:164
**Current Code:**
```tsx
<button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/SmartNavigation.tsx:145
**Current Code:**
```tsx
<button
          onClick={() => handleNavigation('previous')}
          disabled={!canGoBack || isLoading}
          className={`
            flex it...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/SmartNavigation.tsx:189
**Current Code:**
```tsx
<button
          onClick={() => handleNavigation('next')}
          disabled={!canGoForward || isLoading}
          className={`
            flex ite...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/RealTimeFeedback.tsx:262
**Current Code:**
```tsx
<button
                    onClick={() => handleFeedbackDismiss(feedback.id)}
                    className={`flex-shrink-0 ${colors.text} opacity-70...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/ProgressiveAssistance.tsx:307
**Current Code:**
```tsx
<button
                                      onClick={(e) => {
                                        e.stopPropagation();
                         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/ProgressiveAssistance.tsx:323
**Current Code:**
```tsx
<button
                                        onClick={(e) => {
                                          e.stopPropagation();
                     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/ProgressiveAssistance.tsx:333
**Current Code:**
```tsx
<button
                                        onClick={(e) => {
                                          e.stopPropagation();
                     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/ProgressiveAssistance.tsx:349
**Current Code:**
```tsx
<button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/ProgressiveAssistance.tsx:374
**Current Code:**
```tsx
<button
                onClick={onDismiss}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/MotivationalElements.tsx:366
**Current Code:**
```tsx
<button
                onClick={handleMessageDismiss}
                className={`flex-shrink-0 ${colors.text} opacity-70 hover:opacity-100 transitio...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:211
**Current Code:**
```tsx
<button
                onClick={handleDismiss}
                className={`${colors.icon} hover:opacity-70 transition-opacity`}
              >
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:235
**Current Code:**
```tsx
<button
                        onClick={handleExpand}
                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:243
**Current Code:**
```tsx
<button
                        onClick={handleAction}
                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:290
**Current Code:**
```tsx
<button
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className={`px-3...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:303
**Current Code:**
```tsx
<button
                            onClick={nextStep}
                            className={`px-3 py-1 text-xs font-medium text-white rounded ${colo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:310
**Current Code:**
```tsx
<button
                            onClick={handleAction || handleDismiss}
                            className={`px-3 py-1 text-xs font-medium text...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/InterventionOverlay.tsx:323
**Current Code:**
```tsx
<button
                      onClick={handleAction}
                      className={`w-full py-2 text-sm font-medium text-white rounded ${colors.but...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/ContextualTooltip.tsx:285
**Current Code:**
```tsx
<button
                  onClick={handleDismiss}
                  className={`flex-shrink-0 ${colors.icon} hover:opacity-70 transition-opacity`}
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/CelebrationModal.tsx:303
**Current Code:**
```tsx
<button
                      onClick={handleShare}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors bg-gra...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/CelebrationModal.tsx:311
**Current Code:**
```tsx
<button
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hov...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/CelebrationModal.tsx:321
**Current Code:**
```tsx
<button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/AdaptiveContent.tsx:155
**Current Code:**
```tsx
<button
            key={index}
            onClick={() => {
              handleInteraction('action_clicked', { action: action.id });
              i...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/AdaptiveContent.tsx:228
**Current Code:**
```tsx
<button
          onClick={handleComplete}
          className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg font-medium hove...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/AdaptiveContent.tsx:262
**Current Code:**
```tsx
<button
        onClick={handleComplete}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-col...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/AdaptiveContent.tsx:279
**Current Code:**
```tsx
<button
                  key={optionIndex}
                  onClick={() => handleInteraction('quiz_answer', { 
                    questionIndex: in...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/recovery/RecoveryDashboard.tsx:162
**Current Code:**
```tsx
<button
          onClick={fetchStatus}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/recovery/RecoveryDashboard.tsx:192
**Current Code:**
```tsx
<button
            onClick={fetchStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            R...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/recovery/RecoveryDashboard.tsx:237
**Current Code:**
```tsx
<button
            onClick={() => triggerAction('reset_circuit_breaker')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hov...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/recovery/RecoveryDashboard.tsx:258
**Current Code:**
```tsx
<button
                    onClick={() => triggerAction('reset_circuit_breaker', name)}
                    className="px-2 py-1 bg-blue-600 text-whi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/recovery/RecoveryDashboard.tsx:296
**Current Code:**
```tsx
<button
            onClick={() => triggerAction('trigger_healing')}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/recovery/RecoveryDashboard.tsx:313
**Current Code:**
```tsx
<button
                onClick={() => triggerAction('trigger_healing', name)}
                className="px-2 py-1 bg-blue-600 text-white rounded tex...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pricing/UpgradeModal.tsx:58
**Current Code:**
```tsx
<button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading}
                  className={`mt-3 w-full rounded-m...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pricing/StarterUpgradeBanner.tsx:22
**Current Code:**
```tsx
<button
          onClick={() => setOpen(true)}
          className="ml-3 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pricing/PricingFAQ.tsx:63
**Current Code:**
```tsx
<button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/platforms/TikTokDashboardWidget.tsx:258
**Current Code:**
```tsx
<button
          onClick={handleDisconnect}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 roun...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:65
**Current Code:**
```tsx
<button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:72
**Current Code:**
```tsx
<button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:95
**Current Code:**
```tsx
<button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:105
**Current Code:**
```tsx
<button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:130
**Current Code:**
```tsx
<button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    className={`relative inlin...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:147
**Current Code:**
```tsx
<button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative in...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/pagination/Pagination.tsx:157
**Current Code:**
```tsx
<button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/performance/LazyComponent.tsx:73
**Current Code:**
```tsx
<button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        data-testid="retry-button"
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:101
**Current Code:**
```tsx
<button onClick={handleIos} disabled={!!busy} className={btn('ios')}>iOS bridge</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:102
**Current Code:**
```tsx
<button onClick={handleDesktop} disabled={!!busy} className={btn('desktop')}>Desktop bridge</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:103
**Current Code:**
```tsx
<button onClick={handleNative} disabled={!!busy} className={btn('native')}>Open in app</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:123
**Current Code:**
```tsx
<button onClick={handleIos} disabled={!!busy} className="hz-button">
              {busy === 'ios' ? 'Opening…' : 'Open iOS bridge'}
            </but...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:126
**Current Code:**
```tsx
<button onClick={handleDesktop} disabled={!!busy} className="hz-button">
              {busy === 'desktop' ? 'Opening…' : 'Open desktop bridge'}
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:129
**Current Code:**
```tsx
<button onClick={handleNative} disabled={!!busy} className="hz-button primary">
              {busy === 'native' ? 'Opening…' : 'Open in app'}
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:143
**Current Code:**
```tsx
<button onClick={handleIos} disabled={!!busy} className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:146
**Current Code:**
```tsx
<button onClick={handleDesktop} disabled={!!busy} className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/of/BridgeLauncher.tsx:149
**Current Code:**
```tsx
<button onClick={handleNative} disabled={!!busy} className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-whit...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/WhatsNew.tsx:85
**Current Code:**
```tsx
<button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              aria-labe...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/WhatsNew.tsx:131
**Current Code:**
```tsx
<button
                      onClick={() => handleStartTour(feature.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-6...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/WhatsNew.tsx:147
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-m...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/TourNotificationBadge.tsx:69
**Current Code:**
```tsx
<button
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-fu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/TourNotificationBadge.tsx:91
**Current Code:**
```tsx
<button
                onClick={handleDismissNotification}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/TourNotificationBadge.tsx:131
**Current Code:**
```tsx
<button
                    onClick={() => handleStartTour(tour)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-bl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/TourNotificationBadge.tsx:143
**Current Code:**
```tsx
<button
                onClick={handleDismissNotification}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 da...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/StepShell.tsx:50
**Current Code:**
```tsx
<button className="btn btn-ghost" onClick={onBack} type="button">
            {C.common.back}
          </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/StepShell.tsx:53
**Current Code:**
```tsx
<button className="btn" onClick={onSkip} type="button">
            {C.common.skip}
          </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/StepShell.tsx:57
**Current Code:**
```tsx
<button
            className="btn btn-primary"
            onClick={onContinue}
            disabled={continueDisabled}
            type="button"
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/StepNavigation.tsx:46
**Current Code:**
```tsx
<button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/StepNavigation.tsx:64
**Current Code:**
```tsx
<button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/StepNavigation.tsx:76
**Current Code:**
```tsx
<button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex items-center gap-2 px-6 py-2 rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:59
**Current Code:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:63
**Current Code:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:67
**Current Code:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:71
**Current Code:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:236
**Current Code:**
```tsx
<button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:247
**Current Code:**
```tsx
<button
              onClick={handleNext}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg tr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/PlatformConnection.tsx:137
**Current Code:**
```tsx
<button
                      onClick={() => handleConnect(platform.id)}
                      disabled={!platform.available || isConnecting}
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/PlatformConnection.tsx:183
**Current Code:**
```tsx
<button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`w-full py-3 rounded-lg font-semibold transition ${
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/OnboardingWizard.tsx:171
**Current Code:**
```tsx
<button
                onClick={() => handleStepComplete('welcome')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/OnboardingWizard.tsx:178
**Current Code:**
```tsx
<button
                  onClick={async () => {
                    try {
                      await fetch('/api/force-complete-onboarding');
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/OnboardingWizard.tsx:228
**Current Code:**
```tsx
<button
                onClick={() => {
                  handleStepComplete('completion');
                  onComplete?.();
                }}
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/OnboardingErrorBoundary.tsx:101
**Current Code:**
```tsx
<button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/OnboardingErrorBoundary.tsx:109
**Current Code:**
```tsx
<button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/OnboardingErrorBoundary.tsx:117
**Current Code:**
```tsx
<button
                onClick={this.handleReset}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/LoadDemoButton.tsx:73
**Current Code:**
```tsx
<button className="btn btn-outline w-full" onClick={load} type="button">
      Load demo persona (Luxury)
    </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/GoalSelection.tsx:84
**Current Code:**
```tsx
<button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-6 rounded-lg border-2 text-left transition...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/GoalSelection.tsx:123
**Current Code:**
```tsx
<button
        onClick={handleContinue}
        disabled={selectedGoals.length === 0}
        className={`w-full py-3 rounded-lg font-semibold transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureUnlockModal.tsx:77
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg trans...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureUnlockModal.tsx:139
**Current Code:**
```tsx
<button
              onClick={onClose}
              className={`${feature.quickStartUrl ? 'flex-1' : 'w-full'} px-4 py-3 border-2 border-gray-300 te...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTourGuide.tsx:148
**Current Code:**
```tsx
<button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label=...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTourGuide.tsx:182
**Current Code:**
```tsx
<button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-sm font-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTourGuide.tsx:191
**Current Code:**
```tsx
<button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTourGuide.tsx:211
**Current Code:**
```tsx
<button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-3...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTour.tsx:123
**Current Code:**
```tsx
<button
              onClick={handleSkip}
              className="p-1 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTour.tsx:155
**Current Code:**
```tsx
<button
              onClick={handleSkip}
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTour.tsx:164
**Current Code:**
```tsx
<button
                  onClick={handleBack}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
               ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/FeatureTour.tsx:173
**Current Code:**
```tsx
<button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-mediu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/DashboardPreview.tsx:152
**Current Code:**
```tsx
<button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/DashboardPreview.tsx:162
**Current Code:**
```tsx
<button
          onClick={() => setActiveTab('engagement')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/CreatorAssessment.tsx:113
**Current Code:**
```tsx
<button
          onClick={() => onComplete({ level: calculatedLevel, responses })}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg f...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/CreatorAssessment.tsx:142
**Current Code:**
```tsx
<button
                  key={option.value}
                  onClick={() => handleOptionSelect(question.id, option.value)}
                  classNa...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/CreatorAssessment.tsx:159
**Current Code:**
```tsx
<button
        onClick={calculateLevel}
        disabled={!isComplete}
        className={`w-full py-3 rounded-lg font-semibold transition ${
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/CompletionCelebration.tsx:170
**Current Code:**
```tsx
<button
              onClick={handleStartCreating}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/CompletionCelebration.tsx:177
**Current Code:**
```tsx
<button
              onClick={handleExploreFeatures}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AdditionalPlatforms.tsx:142
**Current Code:**
```tsx
<button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                    className="flex...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AdditionalPlatforms.tsx:176
**Current Code:**
```tsx
<button
          onClick={onSkip}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AdditionalPlatforms.tsx:182
**Current Code:**
```tsx
<button
          onClick={handleContinue}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transiti...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AIConfiguration.tsx:61
**Current Code:**
```tsx
<button
              key={option.value}
              onClick={() => handleConfigChange('verbosity', option.value)}
              className={`p-4 rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AIConfiguration.tsx:89
**Current Code:**
```tsx
<button
              key={option.value}
              onClick={() => handleConfigChange('helpFrequency', option.value)}
              className={`p-4...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AIConfiguration.tsx:117
**Current Code:**
```tsx
<button
              key={option.value}
              onClick={() => handleConfigChange('suggestionStyle', option.value)}
              className={`p...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/AIConfiguration.tsx:147
**Current Code:**
```tsx
<button
        onClick={() => onComplete(config)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 tr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onlyfans/SmartMessageInbox.tsx:147
**Current Code:**
```tsx
<button
                  onClick={() => toggleQuickReply(fan.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-w...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onlyfans/SmartMessageInbox.tsx:176
**Current Code:**
```tsx
<button
                            key={idx}
                            onClick={() => setMessages({ ...messages, [fan.id]: suggestion })}
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onlyfans/SmartMessageInbox.tsx:202
**Current Code:**
```tsx
<button
                          onClick={() => sendQuickMessage(fan.id, messages[fan.id])}
                          disabled={!messages[fan.id]}
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onlyfans/AIMessageComposer.tsx:151
**Current Code:**
```tsx
<button
              onClick={loadSuggestions}
              disabled={loading}
              className="group relative flex items-center gap-2 px-4 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onlyfans/AIMessageComposer.tsx:239
**Current Code:**
```tsx
<button
                  onClick={() => handleSelectSuggestion(suggestion, index)}
                  className="w-full text-left"
                >
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/monitoring/ThreeJsHealthDashboard.tsx:133
**Current Code:**
```tsx
<button
              onClick={fetchStats}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/monitoring/ThreeJsHealthDashboard.tsx:197
**Current Code:**
```tsx
<button
                onClick={clearErrors}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clea...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/monitoring/ThreeJsHealthDashboard.tsx:251
**Current Code:**
```tsx
<button
              onClick={() => window.open('/docs/THREE_JS_TROUBLESHOOTING_GUIDE.md', '_blank')}
              className="text-xs text-blue-600 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/monitoring/ThreeJsHealthDashboard.tsx:258
**Current Code:**
```tsx
<button
              onClick={() => window.open('/api/monitoring/three-js-errors', '_blank')}
              className="text-xs text-blue-600 hover:te...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/monitoring/GoldenSignalsDashboard.tsx:173
**Current Code:**
```tsx
<button
            onClick={fetchData}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/monitoring/GoldenSignalsDashboard.tsx:204
**Current Code:**
```tsx
<button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-7...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/UserMenu.tsx:84
**Current Code:**
```tsx
<button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/UserMenu.tsx:126
**Current Code:**
```tsx
<button
                        type="button"
                        onClick={() => handleMenuItemClick(item)}
                        className="fle...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/UserMenu.tsx:150
**Current Code:**
```tsx
<button
                  key={item.label}
                  type="button"
                  onClick={() => handleMenuItemClick(item)}
               ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/TopHeader.tsx:19
**Current Code:**
```tsx
<button
            type="button"
            onClick={toggle}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SkeletonScreen.example.tsx:91
**Current Code:**
```tsx
<button 
              type="submit"
              className="h-10 px-4 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] rounded-md"
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SkeletonScreen.example.tsx:337
**Current Code:**
```tsx
<button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-md transition-colors $...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:35
**Current Code:**
```tsx
<button>Notifications</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:36
**Current Code:**
```tsx
<button>Profile</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:65
**Current Code:**
```tsx
<button className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs">{label}</span>
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:85
**Current Code:**
```tsx
<button>Close</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:119
**Current Code:**
```tsx
<button>Notifications</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:120
**Current Code:**
```tsx
<button>Profile</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:133
**Current Code:**
```tsx
<button>Tab 1</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:134
**Current Code:**
```tsx
<button>Tab 2</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/SafeAreaExamples.tsx:135
**Current Code:**
```tsx
<button>Tab 3</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/NotificationBell.tsx:33
**Current Code:**
```tsx
<button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-600 transition-colors ho...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/NotificationBell.tsx:56
**Current Code:**
```tsx
<button
                type="button"
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/NotificationBell.tsx:93
**Current Code:**
```tsx
<button
              type="button"
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/MobileNav.tsx:132
**Current Code:**
```tsx
<button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="inline-flex it...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/MarketingHeader.tsx:77
**Current Code:**
```tsx
<button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-white hover:bg-wh...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/CenteredContainer.example.tsx:110
**Current Code:**
```tsx
<button
            type="submit"
            className="h-10 px-6 bg-accent-primary text-white rounded-md hover:bg-accent-hover"
          >
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/layout/CenteredContainer.example.tsx:116
**Current Code:**
```tsx
<button
            type="button"
            className="h-10 px-6 bg-surface border border-subtle text-primary rounded-md hover:bg-hover"
          >...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationsSectionSimple.tsx:208
**Current Code:**
```tsx
<button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
             ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationsSection.tsx:224
**Current Code:**
```tsx
<button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationCard.tsx:179
**Current Code:**
```tsx
<button
            onClick={handleConnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-center...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationCard.tsx:207
**Current Code:**
```tsx
<button
                onClick={handleConnect}
                disabled={isLoading}
                className={cn(
                  'flex-1 inline-f...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationCard.tsx:231
**Current Code:**
```tsx
<button
              onClick={handleDisconnect}
              disabled={isLoading}
              className={cn(
                showAddAnother ? '' :...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationCard.tsx:263
**Current Code:**
```tsx
<button
            onClick={handleReconnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-cent...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/IntegrationCard.tsx:290
**Current Code:**
```tsx
<button
            onClick={handleReconnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-cent...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/AccountSwitcher.tsx:61
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/integrations/AccountSwitcher.tsx:96
**Current Code:**
```tsx
<button
                    key={account.providerAccountId}
                    onClick={() => {
                      onAccountChange(account.provide...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationRecoverySystem.tsx:278
**Current Code:**
```tsx
<button
                onClick={manualRecovery}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationNotificationSystem.tsx:153
**Current Code:**
```tsx
<button
                onClick={clearAllNotifications}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationNotificationSystem.tsx:217
**Current Code:**
```tsx
<button
                    key={index}
                    onClick={() => {
                      action.action();
                      onClose();
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationNotificationSystem.tsx:239
**Current Code:**
```tsx
<button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          <svg className="w-4 h-4" fill="cu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationHealthDashboard.tsx:172
**Current Code:**
```tsx
<button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationHealthDashboard.tsx:318
**Current Code:**
```tsx
<button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationErrorBoundary.tsx:130
**Current Code:**
```tsx
<button
                    type="button"
                    onClick={this.handleRetry}
                    className="bg-yellow-50 text-yellow-800 r...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationErrorBoundary.tsx:161
**Current Code:**
```tsx
<button
                  type="button"
                  onClick={this.handleRetry}
                  className="bg-red-50 text-red-800 rounded-md px...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDiffViewer.tsx:126
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDiffViewer.tsx:142
**Current Code:**
```tsx
<button
                  onClick={() => {
                    hydrationDebugger.clearMismatches();
                    setMismatches([]);
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDiffViewer.tsx:197
**Current Code:**
```tsx
<button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`py-2 px...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDebugPanel.tsx:24
**Current Code:**
```tsx
<button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-2 rounded-full text-white font-medium shadow-lg transition-colors $...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDebugPanel.tsx:46
**Current Code:**
```tsx
<button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDebugPanel.tsx:92
**Current Code:**
```tsx
<button
                  onClick={() => setIsDiffViewerOpen(true)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md ho...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDebugPanel.tsx:98
**Current Code:**
```tsx
<button
                  onClick={clearErrors}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hydration/HydrationDebugPanel.tsx:160
**Current Code:**
```tsx
<button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/hz/PWAInstall.tsx:45
**Current Code:**
```tsx
<button className="hz-button primary" onClick={onInstall}>Install app</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/home/InteractiveDashboardDemo.tsx:81
**Current Code:**
```tsx
<button
          onClick={onClick}
          className="relative w-full max-w-[40px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/landing/SimpleHeroSection.tsx:119
**Current Code:**
```tsx
<button className="group relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/landing/SimpleFAQSection.tsx:40
**Current Code:**
```tsx
<button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/landing/LandingHeader.tsx:67
**Current Code:**
```tsx
<button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-60...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/landing/HeroSection.tsx:207
**Current Code:**
```tsx
<button className="group relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/landing/FAQSection.tsx:27
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between gap-4 text-left hover:text-blue-60...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/features/FeatureDetail.tsx:84
**Current Code:**
```tsx
<button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/features/FeatureDetail.tsx:139
**Current Code:**
```tsx
<button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-sem...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/OnboardingChecklist.tsx:108
**Current Code:**
```tsx
<button
          onClick={() => setIsCollapsed(true)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/OnboardingChecklist.tsx:131
**Current Code:**
```tsx
<button
                  onClick={() => !step.completed && handleStepComplete(step.id)}
                  disabled={step.completed}
                 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/OnboardingChecklist.example.tsx:315
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="Close"
          >
            ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/OnboardingChecklist.example.tsx:326
**Current Code:**
```tsx
<button
          onClick={onClose}
          className="mt-4 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/ChangelogWidget.tsx:105
**Current Code:**
```tsx
<button className="relative flex items-center gap-2 p-2 hover:bg-surface rounded-lg transition-colors opacity-50">
        <Bell strokeWidth={1.5} siz...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/ChangelogWidget.tsx:114
**Current Code:**
```tsx
<button 
        onClick={handleOpen}
        className="relative flex items-center gap-2 p-2 hover:bg-surface rounded-lg transition-colors"
      >
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/engagement/ChangelogWidget.tsx:144
**Current Code:**
```tsx
<button
                  onClick={handleClose}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                  aria...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/PerformanceMonitor.tsx:37
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 bg-[var(--color-indigo)] text-white ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/PerformanceMonitor.tsx:54
**Current Code:**
```tsx
<button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/LoadingStates.tsx:287
**Current Code:**
```tsx
<button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-cen...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/LazyLoadErrorBoundary.tsx:41
**Current Code:**
```tsx
<button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/GlobalSearch.tsx:138
**Current Code:**
```tsx
<button
                      key={result.id}
                      className={styles.resultItem}
                      onClick={() => handleResultCli...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/GamifiedOnboarding.tsx:48
**Current Code:**
```tsx
<button
            className={styles.primaryButton}
            onClick={onConnectAccount}
            disabled={hasConnectedAccounts}
          >
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/GamifiedOnboarding.tsx:112
**Current Code:**
```tsx
<button
            className={styles.primaryButton}
            onClick={onCreateContent}
          >
            Commencer à créer
          </butto...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/DashboardErrorBoundary.tsx:158
**Current Code:**
```tsx
<button
                  onClick={this.handleRetry}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[var(--c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/DashboardErrorBoundary.tsx:171
**Current Code:**
```tsx
<button
                onClick={() => (window.location.href = '/home')}
                className="flex-1 inline-flex items-center justify-center px-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/DashboardErrorBoundary.tsx:237
**Current Code:**
```tsx
<button
          onClick={resetError}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try again
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/ContentPageErrorBoundary.tsx:179
**Current Code:**
```tsx
<button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/ContentPageErrorBoundary.tsx:187
**Current Code:**
```tsx
<button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/ContentPageErrorBoundary.tsx:195
**Current Code:**
```tsx
<button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/Button.tsx:44
**Current Code:**
```tsx
<button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || isLoading}
        {...props}
      >
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/AsyncOperationWrapper.tsx:138
**Current Code:**
```tsx
<button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/dashboard/AsyncButton.tsx:38
**Current Code:**
```tsx
<button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/billing/MessagePacksCheckout.tsx:122
**Current Code:**
```tsx
<button
                    onClick={() => handlePurchase(pack)}
                    disabled={loading}
                    className={`w-full py-4 ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/animations/MobileOptimizations.tsx:120
**Current Code:**
```tsx
<button
      className={`
        min-h-[44px] min-w-[44px] 
        touch-manipulation select-none
        ${isPressed ? 'scale-95' : ''}
        ${...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/SocialAuthButtons.tsx:70
**Current Code:**
```tsx
<button
        type="button"
        onClick={() => handleSocialSignIn('google')}
        disabled={disabled || loadingProvider !== null}
        cla...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/SignupForm.tsx:113
**Current Code:**
```tsx
<button
          onClick={() => {
            setEmailSent(false);
            setSentEmail('');
          }}
          className="text-purple-600 ho...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/SignInForm.tsx:181
**Current Code:**
```tsx
<button
                    type="button"
                    onClick={handleRecovery}
                    className="mt-2 text-sm font-medium text-re...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/SignInForm.tsx:195
**Current Code:**
```tsx
<button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-40...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/SignInForm.tsx:264
**Current Code:**
```tsx
<button
            type="button"
            onClick={() => signIn('google', { callbackUrl })}
            disabled={isLoading}
            className...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/RegisterForm.tsx:110
**Current Code:**
```tsx
<button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/LoginForm.tsx:85
**Current Code:**
```tsx
<button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/EmailSignupForm.tsx:200
**Current Code:**
```tsx
<button
        type="submit"
        disabled={!isValid || isSubmitting || isMobileSubmitting || csrfLoading || !!csrfError}
        className={`
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/AuthInput.tsx:70
**Current Code:**
```tsx
<button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translat...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/auth/AuthButton.tsx:28
**Current Code:**
```tsx
<button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      classNa...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VideoEditor.tsx:120
**Current Code:**
```tsx
<button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50" disabled={saving}>Cancel</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VideoEditor.tsx:121
**Current Code:**
```tsx
<button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VariationPerformance.tsx:236
**Current Code:**
```tsx
<button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VariationManager.tsx:133
**Current Code:**
```tsx
<button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={variations.length >= 5 || getRemainingPercentage() === 0}
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VariationManager.tsx:206
**Current Code:**
```tsx
<button
                onClick={createVariation}
                disabled={!variationName || !variationText}
                className="px-4 py-2 bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VariationManager.tsx:213
**Current Code:**
```tsx
<button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/VariationManager.tsx:278
**Current Code:**
```tsx
<button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVariation(variation.id);
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/UrlImporter.tsx:86
**Current Code:**
```tsx
<button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="px-6 py-2 bg-blue-600 text-white round...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/UrlImporter.tsx:94
**Current Code:**
```tsx
<button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hove...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TemplateSelector.tsx:154
**Current Code:**
```tsx
<button onClick={() => setSelectedCategory('all')} className={`px-3 py-1 rounded text-sm ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TemplateSelector.tsx:156
**Current Code:**
```tsx
<button key={category} onClick={() => setSelectedCategory(category)} className={`px-3 py-1 rounded text-sm capitalize ${selectedCategory === category ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TagInput.tsx:64
**Current Code:**
```tsx
<button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-900"
            >
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TagInput.tsx:97
**Current Code:**
```tsx
<button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full te...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TagAnalytics.tsx:59
**Current Code:**
```tsx
<button
            onClick={() => setView('frequency')}
            className={`px-3 py-1 text-sm rounded ${view === 'frequency' ? 'bg-blue-600 text-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TagAnalytics.tsx:65
**Current Code:**
```tsx
<button
            onClick={() => setView('combinations')}
            className={`px-3 py-1 text-sm rounded ${view === 'combinations' ? 'bg-blue-600...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/TagAnalytics.tsx:71
**Current Code:**
```tsx
<button
            onClick={() => setView('cloud')}
            className={`px-3 py-1 text-sm rounded ${view === 'cloud' ? 'bg-blue-600 text-white' :...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/SchedulePicker.tsx:151
**Current Code:**
```tsx
<button
          type="button"
          onClick={() => setViewMode('input')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/SchedulePicker.tsx:163
**Current Code:**
```tsx
<button
          type="button"
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/SchedulePicker.tsx:217
**Current Code:**
```tsx
<button
                    key={suggestion.time}
                    type="button"
                    onClick={() => handleTimeSelect(suggestion.tim...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/SchedulePicker.tsx:236
**Current Code:**
```tsx
<button
              type="button"
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/SchedulePicker.tsx:249
**Current Code:**
```tsx
<button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 roun...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/SchedulePicker.tsx:276
**Current Code:**
```tsx
<button
                key={index}
                type="button"
                onClick={() => date && !isPast(date) && handleDateSelect(date)}
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ProductivityDashboard.tsx:57
**Current Code:**
```tsx
<button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm ${
                per...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/PlatformPreview.tsx:187
**Current Code:**
```tsx
<button 
            onClick={() => setViewMode('mobile')} 
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'mob...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/PlatformPreview.tsx:193
**Current Code:**
```tsx
<button 
            onClick={() => setViewMode('desktop')} 
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'de...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/PlatformPreview.tsx:210
**Current Code:**
```tsx
<button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg text-s...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/MediaUpload.tsx:278
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-purple-600 hover:t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/MediaUpload.tsx:347
**Current Code:**
```tsx
<button
              onClick={() => setErrors([])}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
            >
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/MediaUpload.tsx:402
**Current Code:**
```tsx
<button
                  onClick={() => handleRemove(file.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/MediaPicker.tsx:90
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/MediaPicker.tsx:169
**Current Code:**
```tsx
<button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/MediaPicker.tsx:175
**Current Code:**
```tsx
<button
              onClick={handleConfirm}
              disabled={selectedMedia.size === 0}
              className="px-4 py-2 bg-blue-600 text-wh...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ImageEditor.tsx:156
**Current Code:**
```tsx
<button
                  onClick={() => setRotate((prev) => prev - 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ImageEditor.tsx:162
**Current Code:**
```tsx
<button
                  onClick={() => setRotate((prev) => prev + 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ImageEditor.tsx:190
**Current Code:**
```tsx
<button
              onClick={() => {
                setBrightness(0);
                setContrast(0);
                setSaturation(0);
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ImageEditor.tsx:207
**Current Code:**
```tsx
<button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={saving}
          >
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ImageEditor.tsx:214
**Current Code:**
```tsx
<button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-7...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/EmojiPicker.tsx:27
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 rounded hover:bg-gray-200"
        type="button"
      >
        😀
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/EmojiPicker.tsx:45
**Current Code:**
```tsx
<button
                  key={category}
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/EmojiPicker.tsx:63
**Current Code:**
```tsx
<button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-10...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/CsvImporter.tsx:157
**Current Code:**
```tsx
<button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/CsvImporter.tsx:288
**Current Code:**
```tsx
<button
              onClick={handleImport}
              disabled={loading || !mapping.title || !mapping.content}
              className="flex-1 px...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/CsvImporter.tsx:295
**Current Code:**
```tsx
<button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg h...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/CsvImporter.tsx:330
**Current Code:**
```tsx
<button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/CsvImporter.tsx:337
**Current Code:**
```tsx
<button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentValidator.tsx:75
**Current Code:**
```tsx
<button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentModal.tsx:70
**Current Code:**
```tsx
<button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentList.tsx:90
**Current Code:**
```tsx
<button
            onClick={() => {
              setSelectedItems(new Set());
              setSelectAll(false);
              onSelectionChange?.([...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentList.tsx:179
**Current Code:**
```tsx
<button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick?.(item);
                  }}
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentForm.tsx:233
**Current Code:**
```tsx
<button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentForm.tsx:250
**Current Code:**
```tsx
<button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-purple-900 dark...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentForm.tsx:308
**Current Code:**
```tsx
<button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentForm.tsx:316
**Current Code:**
```tsx
<button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opac...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditorWithAutoSave.tsx:83
**Current Code:**
```tsx
<button
          onClick={saveNow}
          disabled={status.status === 'saving'}
          className="px-3 py-1 text-sm bg-blue-600 text-white roun...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:101
**Current Code:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            e...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:110
**Current Code:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:119
**Current Code:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:131
**Current Code:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:140
**Current Code:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:152
**Current Code:**
```tsx
<button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().se...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentEditor.tsx:168
**Current Code:**
```tsx
<button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 text-red-600"
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCreator.tsx:50
**Current Code:**
```tsx
<button
            onClick={() => setShowMediaPicker(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCreator.tsx:79
**Current Code:**
```tsx
<button
                    onClick={() => removeMedia(media.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCalendar.tsx:306
**Current Code:**
```tsx
<button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-color...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCalendar.tsx:315
**Current Code:**
```tsx
<button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-color...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCalendar.tsx:321
**Current Code:**
```tsx
<button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCalendar.tsx:330
**Current Code:**
```tsx
<button
            onClick={() => setView('month')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCalendar.tsx:338
**Current Code:**
```tsx
<button
            onClick={() => setView('week')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === '...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/ContentCalendar.tsx:346
**Current Code:**
```tsx
<button
            onClick={() => setView('day')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'd...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/CategorySelector.tsx:25
**Current Code:**
```tsx
<button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`p-3 bo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:119
**Current Code:**
```tsx
<button
              onClick={handleSchedule}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-l...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:127
**Current Code:**
```tsx
<button
              onClick={handleDuplicate}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:135
**Current Code:**
```tsx
<button
              onClick={handleTag}
              disabled={processing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg h...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:143
**Current Code:**
```tsx
<button
              onClick={handleDelete}
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg h...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:202
**Current Code:**
```tsx
<button
                onClick={confirmSchedule}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-w...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:209
**Current Code:**
```tsx
<button
                onClick={() => setShowScheduleModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:245
**Current Code:**
```tsx
<button
                onClick={confirmTag}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-purple-600 text-whit...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:252
**Current Code:**
```tsx
<button
                onClick={() => setShowTagModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:280
**Current Code:**
```tsx
<button
                onClick={confirmOperation}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white round...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/BatchOperationsToolbar.tsx:291
**Current Code:**
```tsx
<button
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/content/AIAssistant.tsx:78
**Current Code:**
```tsx
<button onClick={generateSuggestions} disabled={loading} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded h...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/chatbot/ChatbotWidget.tsx:92
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 sh...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/chatbot/ChatbotWidget.tsx:111
**Current Code:**
```tsx
<button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label="M...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/chatbot/ChatbotWidget.tsx:118
**Current Code:**
```tsx
<button
            onClick={() => {
              setIsOpen(false);
              setMessages([messages[0]]); // Reset to initial message
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/chatbot/ChatbotWidget.tsx:181
**Current Code:**
```tsx
<button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AIChatAssistant.tsx:88
**Current Code:**
```tsx
<button
          className="generate-button"
          onClick={handleGenerateResponse}
          disabled={loading || !message.trim()}
        >
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AIChatAssistant.tsx:151
**Current Code:**
```tsx
<button
              className="use-response-button"
              onClick={handleUseResponse}
            >
              Use This Response
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AIChatAssistant.tsx:157
**Current Code:**
```tsx
<button
              className="regenerate-button"
              onClick={handleGenerateResponse}
              disabled={loading}
            >
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AICaptionGenerator.tsx:84
**Current Code:**
```tsx
<button
                key={p.value}
                className={`platform-button ${platform === p.value ? 'active' : ''}`}
                onClick={(...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AICaptionGenerator.tsx:142
**Current Code:**
```tsx
<button
          className="generate-button"
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
        >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AICaptionGenerator.tsx:208
**Current Code:**
```tsx
<button
              className="copy-button"
              onClick={handleCopyCaption}
            >
              📋 Copy Caption
            </butt...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AICaptionGenerator.tsx:214
**Current Code:**
```tsx
<button
              className="regenerate-button"
              onClick={handleGenerate}
              disabled={loading}
            >
            ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AIAnalyticsDashboard.tsx:72
**Current Code:**
```tsx
<button
              key={tf.value}
              className={`timeframe-button ${timeframe === tf.value ? 'active' : ''}`}
              onClick={() ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AIAnalyticsDashboard.tsx:95
**Current Code:**
```tsx
<button className="retry-button" onClick={handleAnalyze}>
            Try Again
          </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/ai/AIAnalyticsDashboard.tsx:187
**Current Code:**
```tsx
<button
              className="refresh-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {l...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/auth-client.tsx:273
**Current Code:**
```tsx
<button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all d...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/auth-client.tsx:283
**Current Code:**
```tsx
<button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all du...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/auth-client.tsx:317
**Current Code:**
```tsx
<button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2.5...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/auth-client.tsx:385
**Current Code:**
```tsx
<button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/auth-client.tsx:464
**Current Code:**
```tsx
<button
              type="submit"
              disabled={isLoading || (!isLogin && !agreeTerms)}
              className="w-full py-2.5 px-4 rounde...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/auth-client.tsx:486
**Current Code:**
```tsx
<button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ui/export-all.tsx:26
**Current Code:**
```tsx
<button className={`px-4 py-2 rounded-md ${variantClasses} ${className}`} {...props}>{children}</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ui/export-all.tsx:35
**Current Code:**
```tsx
<button className="border rounded px-2 py-1 w-full text-left" {...props}>{children}</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/ui/export-all.tsx:42
**Current Code:**
```tsx
<button className={`px-4 py-2 ${className}`} {...props}>{children}</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/inbox.tsx:51
**Current Code:**
```tsx
<button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/inbox.tsx:75
**Current Code:**
```tsx
<button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className="w-full p-4...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/create-campaign-modal.tsx:78
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/create-campaign-modal.tsx:127
**Current Code:**
```tsx
<button
                onClick={() => setAudienceType('all')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/create-campaign-modal.tsx:142
**Current Code:**
```tsx
<button
                onClick={() => setAudienceType('segment')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/create-campaign-modal.tsx:210
**Current Code:**
```tsx
<button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 r...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/create-campaign-modal.tsx:216
**Current Code:**
```tsx
<button
              onClick={handleCreate}
              disabled={!name.trim() || !content.trim() || creating || (audienceType === 'segment' && sel...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/conversation-view.tsx:95
**Current Code:**
```tsx
<button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/conversation-view.tsx:108
**Current Code:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5" />
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/conversation-view.tsx:150
**Current Code:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/conversation-view.tsx:168
**Current Code:**
```tsx
<button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className={`p-2 rounded-lg transition-all ${
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/conversation-view.tsx:181
**Current Code:**
```tsx
<button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/ofm/ai/draft', ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/conversation-view.tsx:203
**Current Code:**
```tsx
<button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/ofm/ai/escalate', { method:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaigns.tsx:85
**Current Code:**
```tsx
<button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaigns.tsx:106
**Current Code:**
```tsx
<button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaigns.tsx:139
**Current Code:**
```tsx
<button
                        onClick={() => handleCampaignAction(campaign.id, 'launch')}
                        className="p-2 text-green-600 hove...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaigns.tsx:148
**Current Code:**
```tsx
<button
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        className="p-2 text-yellow-600 hove...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaigns.tsx:157
**Current Code:**
```tsx
<button
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        className="p-2 text-green-600 hove...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaign-details.tsx:78
**Current Code:**
```tsx
<button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaign-details.tsx:103
**Current Code:**
```tsx
<button
                onClick={() => handleAction('launch')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaign-details.tsx:112
**Current Code:**
```tsx
<button
                onClick={() => handleAction('pause')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaign-details.tsx:121
**Current Code:**
```tsx
<button
                onClick={() => handleAction('resume')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/of/campaign-details.tsx:130
**Current Code:**
```tsx
<button
                onClick={() => handleAction('cancel')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white roun...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/onboarding/progressive-onboarding.tsx:175
**Current Code:**
```tsx
<button
              onClick={() => completeOnboarding()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/components/hznew/app-shell.tsx:20
**Current Code:**
```tsx
<button className="lg:hidden text-gray-300 hover:text-white" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellOpportunity.tsx:89
**Current Code:**
```tsx
<button
          onClick={() => onDismiss(opportunity.id)}
          disabled={isSending}
          className="text-gray-400 hover:text-gray-600 tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellOpportunity.tsx:155
**Current Code:**
```tsx
<button
            onClick={() => setIsEditingMessage(!isEditingMessage)}
            className="text-xs text-blue-600 hover:text-blue-700 font-mediu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellOpportunity.tsx:178
**Current Code:**
```tsx
<button
          onClick={() => onDismiss(opportunity.id)}
          disabled={isSending}
          className="flex-1 px-4 py-2 text-sm font-medium t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellOpportunity.tsx:185
**Current Code:**
```tsx
<button
          onClick={handleSend}
          disabled={isSending || loading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:66
**Current Code:**
```tsx
<button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors fo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:120
**Current Code:**
```tsx
<button
              onClick={() => handleMaxDailyChange(Math.max(1, settings.maxDailyUpsells - 1))}
              disabled={!settings.enabled || set...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:138
**Current Code:**
```tsx
<button
              onClick={() => handleMaxDailyChange(Math.min(100, settings.maxDailyUpsells + 1))}
              disabled={!settings.enabled || s...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:167
**Current Code:**
```tsx
<button
                      onClick={() => {
                        setSettings({
                          ...settings,
                          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:237
**Current Code:**
```tsx
<button
            onClick={handleReset}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:244
**Current Code:**
```tsx
<button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/shared/Toast.tsx:127
**Current Code:**
```tsx
<button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <svg className...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/shared/ErrorBoundary.tsx:103
**Current Code:**
```tsx
<button
              onClick={onReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium trans...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/shared/EmptyState.tsx:26
**Current Code:**
```tsx
<button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/pricing/PricingCard.tsx:108
**Current Code:**
```tsx
<button
        onClick={handleApply}
        disabled={isApplying || loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disab...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/pricing/PricingCard.tsx:125
**Current Code:**
```tsx
<button
          onClick={handleApply}
          disabled={isApplying || loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/pricing/PPVPricing.tsx:87
**Current Code:**
```tsx
<button
              onClick={() => handleApply(rec.contentId)}
              disabled={applying === rec.contentId}
              className="w-full p...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/payout/PayoutTimeline.tsx:101
**Current Code:**
```tsx
<button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/payout/PayoutTimeline.tsx:127
**Current Code:**
```tsx
<button
          onClick={() => setFilterPlatform('all')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filte...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/payout/PayoutTimeline.tsx:138
**Current Code:**
```tsx
<button
            key={platform}
            onClick={() => setFilterPlatform(platform)}
            className={`px-3 py-1.5 text-sm rounded-lg tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/payout/PayoutSummary.tsx:111
**Current Code:**
```tsx
<button
                  onClick={() => setIsEditingTaxRate(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-me...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/payout/PayoutSummary.tsx:144
**Current Code:**
```tsx
<button
                  onClick={handleSaveTaxRate}
                  className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded hove...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/payout/PayoutSummary.tsx:150
**Current Code:**
```tsx
<button
                  onClick={handleCancelTaxRate}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border borde...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskList.tsx:118
**Current Code:**
```tsx
<button
            onClick={() => setFilterRisk('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fil...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskList.tsx:128
**Current Code:**
```tsx
<button
            onClick={() => setFilterRisk('high')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskList.tsx:138
**Current Code:**
```tsx
<button
            onClick={() => setFilterRisk('medium')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskList.tsx:148
**Current Code:**
```tsx
<button
            onClick={() => setFilterRisk('low')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fil...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskList.tsx:238
**Current Code:**
```tsx
<button
                  onClick={() => onViewDetails(fan.id)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskList.tsx:244
**Current Code:**
```tsx
<button
                  onClick={() => handleReEngage(fan.id)}
                  disabled={engagingFans.has(fan.id)}
                  className="fl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskDetail.tsx:93
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskDetail.tsx:218
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg ho...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/churn/ChurnRiskDetail.tsx:224
**Current Code:**
```tsx
<button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transit...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/forecast/RevenueForecastChart.tsx:82
**Current Code:**
```tsx
<button
          onClick={() => setShowGoalInput(!showGoalInput)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/forecast/RevenueForecastChart.tsx:104
**Current Code:**
```tsx
<button
              onClick={handleSetGoal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-7...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/forecast/RevenueForecastChart.tsx:110
**Current Code:**
```tsx
<button
              onClick={() => setShowGoalInput(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/revenue/forecast/GoalAchievement.tsx:115
**Current Code:**
```tsx
<button
                  onClick={() => setExpandedRec(expandedRec === index ? null : index)}
                  className="w-full px-4 py-3 flex item...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/SystemAlerts.tsx:299
**Current Code:**
```tsx
<button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-xs text-blue-600 hover...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/SystemAlerts.tsx:307
**Current Code:**
```tsx
<button
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs text-gray-600 hover:text-gr...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/SystemAlerts.tsx:320
**Current Code:**
```tsx
<button
                              key={action.id}
                              onClick={() => handleAction(alert.id, action.action)}
            ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/OnboardingAnalyticsDashboard.tsx:148
**Current Code:**
```tsx
<button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm rounded ${
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/MLModelMonitoring.tsx:204
**Current Code:**
```tsx
<button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/MLModelMonitoring.tsx:287
**Current Code:**
```tsx
<button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetrain(model.id);
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/MLModelMonitoring.tsx:519
**Current Code:**
```tsx
<button
                    onClick={() => setSelectedModel(null)}
                    className="text-gray-400 hover:text-gray-600"
                 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/InterventionEffectivenessReporting.tsx:199
**Current Code:**
```tsx
<button
            onClick={handleExportReport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/smart-onboarding/analytics/InterventionEffectivenessReporting.tsx:213
**Current Code:**
```tsx
<button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/StepItem.tsx:117
**Current Code:**
```tsx
<button
                onClick={() => handleUpdate('skipped')}
                disabled={loading}
                className="text-sm font-medium text...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/StepItem.tsx:128
**Current Code:**
```tsx
<button
              onClick={() => handleUpdate('done')}
              disabled={loading}
              className="inline-flex items-center gap-2 ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SimpleOnboarding.tsx:118
**Current Code:**
```tsx
<button
                  type="button"
                  role="checkbox"
                  aria-checked={isActive}
                  onClick={() => t...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SimpleOnboarding.tsx:178
**Current Code:**
```tsx
<button
            onClick={onSkip}
            className="text-sm font-medium text-violet-400 hover:text-violet-300 focus-visible:outline-none focus...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SimpleOnboarding.tsx:184
**Current Code:**
```tsx
<button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white shadow-lg shadow-violet...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:94
**Current Code:**
```tsx
<button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:100
**Current Code:**
```tsx
<button
                onClick={onSkip}
                className="px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-600 transition...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:128
**Current Code:**
```tsx
<button
                  key={platform.id}
                  onClick={() => handlePlatformSelect(platform.id as Platform)}
                  classNam...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:174
**Current Code:**
```tsx
<button
                  key={goal.id}
                  onClick={() => handleGoalSelect(goal.id as Goal)}
                  className="w-full p-4 ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:220
**Current Code:**
```tsx
<button
                  key={tone.id}
                  onClick={() => handleToneSelect(tone.id as Tone)}
                  className="w-full p-4 ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:231
**Current Code:**
```tsx
<button
              onClick={handleSkipTone}
              className="w-full px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-600...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:226
**Current Code:**
```tsx
<button
                onClick={onSkip}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
   ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:232
**Current Code:**
```tsx
<button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-white shadow-lg sha...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:262
**Current Code:**
```tsx
<button
                      type="button"
                      onClick={() => handleSelect('platform', platform.id)}
                      classNam...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:300
**Current Code:**
```tsx
<button
                onClick={() => setStep(0)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:306
**Current Code:**
```tsx
<button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 rounde...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:337
**Current Code:**
```tsx
<button
                      type="button"
                      onClick={() => handleSelect('primary_goal', goal.id)}
                      classNam...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:375
**Current Code:**
```tsx
<button
                onClick={() => setStep(1)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:381
**Current Code:**
```tsx
<button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 rounde...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:412
**Current Code:**
```tsx
<button
                      type="button"
                      onClick={() => handleSelect('ai_tone', tone.id)}
                      className={[
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:450
**Current Code:**
```tsx
<button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:457
**Current Code:**
```tsx
<button
                  onClick={handleSkipTone}
                  className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:463
**Current Code:**
```tsx
<button
                  onClick={handleComplete}
                  className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-white shado...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/SetupGuideContainer.tsx:95
**Current Code:**
```tsx
<button
              onClick={retry}
              className="text-sm font-medium text-primary hover:text-primary-hover underline"
            >
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/GuardRailModal.tsx:157
**Current Code:**
```tsx
<button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 text-content-secondary hover:text-content-prim...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### components/onboarding/huntaze-onboarding/CompletionNudge.tsx:103
**Current Code:**
```tsx
<button
          onClick={handleDismiss}
          className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-surface-muted rounded-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/register/page.tsx:167
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/register/page.tsx:204
**Current Code:**
```tsx
<button
            type="submit"
            className="btn-primary btn-full"
            disabled={submitting}
            aria-busy={submitting}
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/verify-pending/page.tsx:70
**Current Code:**
```tsx
<button
              onClick={() => window.location.reload()}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/login/page.tsx:128
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/auth/login/page.tsx:157
**Current Code:**
```tsx
<button
            type="submit"
            className="btn-primary btn-full"
            disabled={isLoading}
            aria-busy={isLoading}
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/why-huntaze/page.tsx:102
**Current Code:**
```tsx
<button
                key={index}
                onClick={() => setActiveWidget(index)}
                className={`w-full text-left p-6 rounded-xl...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/blog/page.tsx:122
**Current Code:**
```tsx
<button
                key={index}
                className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all ${
               ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/blog/page.tsx:270
**Current Code:**
```tsx
<button
              type="submit"
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-co...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/skip-onboarding/page.tsx:61
**Current Code:**
```tsx
<button
            onClick={skipOnboarding}
            disabled={isLoading}
            className="px-6 py-3 bg-[var(--color-indigo)] text-white rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/schedule/page.tsx:137
**Current Code:**
```tsx
<button 
              onClick={create} 
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/schedule/page.tsx:170
**Current Code:**
```tsx
<button 
                    onClick={() => del(p.id)} 
                    className="ml-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/repost/page.tsx:123
**Current Code:**
```tsx
<button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm" onClick={() => schedule(s)}>Add to calendar</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans-assisted/page.tsx:57
**Current Code:**
```tsx
<button className="hz-button" aria-label="Notifications"><Bell className="hz-icon"/></button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/mobile-setup.tsx:61
**Current Code:**
```tsx
<button
                key={platform.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedPlatform...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/mobile-setup.tsx:112
**Current Code:**
```tsx
<button
                key={goal.id}
                onClick={() => {
                  if (isSelected) {
                    setGoals(prev => prev.f...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/mobile-setup.tsx:167
**Current Code:**
```tsx
<button 
              onClick={() => router.push('/dashboard')}
              className="p-2"
            >
              <X className="w-5 h-5 text-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/mobile-setup.tsx:183
**Current Code:**
```tsx
<button 
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600"
            >
              Skip
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/mobile-setup.tsx:209
**Current Code:**
```tsx
<button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-3 min-h-[44px] rounded-xl font-medium transi...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:160
**Current Code:**
```tsx
<button
                  key={option.id}
                  type="button"
                  onClick={() => toggleContentType(option.id)}
             ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:192
**Current Code:**
```tsx
<button
                onClick={() => router.push('/home')}
                className="text-[var(--text-secondary)] hover:text-white transition-color...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:198
**Current Code:**
```tsx
<button
                onClick={handleStep1Next}
                className="px-6 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:291
**Current Code:**
```tsx
<button
          onClick={onBack}
          className="text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          ← Back
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:298
**Current Code:**
```tsx
<button
            onClick={onSkip}
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            S...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:304
**Current Code:**
```tsx
<button
            onClick={handleSubmit}
            disabled={!username || !password}
            className="px-6 py-2 bg-gradient-to-r from-[var(-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:352
**Current Code:**
```tsx
<button
              key={option.id}
              type="button"
              onClick={() => setSelectedGoal(option.id)}
              className={`w...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:403
**Current Code:**
```tsx
<button
          onClick={onBack}
          className="text-[var(--text-secondary)] hover:text-white transition-colors"
          disabled={isLoading...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/beta-onboarding-client.tsx:410
**Current Code:**
```tsx
<button
          onClick={handleSubmit}
          disabled={!selectedGoal || isLoading}
          className="px-6 py-2 bg-gradient-to-r from-[var(--a...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/of-analytics/page.tsx:79
**Current Code:**
```tsx
<button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium tran...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/of-connect/DebugLogin.tsx:49
**Current Code:**
```tsx
<button onClick={startLogin} disabled={busy} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/menu/page.tsx:189
**Current Code:**
```tsx
<button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transit...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/menu/page.tsx:207
**Current Code:**
```tsx
<button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/manage-business/page.tsx:255
**Current Code:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/manage-business/page.tsx:258
**Current Code:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/manage-business/page.tsx:261
**Current Code:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/manage-business/page.tsx:264
**Current Code:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/integrations/integrations-client.tsx:90
**Current Code:**
```tsx
<button
              onClick={() => window.location.reload()}
              className="integrations-error-retry"
            >
              Retry
  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/diagnostics/page.tsx:111
**Current Code:**
```tsx
<button
            onClick={startDiagnostic}
            disabled={isRunning || loading}
            className="px-4 py-2 bg-blue-600 text-white roun...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/diagnostics/page.tsx:118
**Current Code:**
```tsx
<button
            onClick={stopDiagnostic}
            disabled={!isRunning || loading}
            className="px-4 py-2 bg-green-600 text-white rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/diagnostics/page.tsx:125
**Current Code:**
```tsx
<button
            onClick={resetDiagnostic}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:101
**Current Code:**
```tsx
<button 
            className="p-2 text-gray-400 hover:text-[var(--color-text-main)] transition-colors"
            title="View"
          >
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:110
**Current Code:**
```tsx
<button 
            className="p-2 text-gray-400 hover:text-[var(--color-text-main)] transition-colors"
            onClick={() => onEdit(item)}
    ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:119
**Current Code:**
```tsx
<button 
            className="p-2 text-red-400 hover:text-red-600 transition-colors"
            onClick={() => onDelete(item.id)}
            disab...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:278
**Current Code:**
```tsx
<button 
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:406
**Current Code:**
```tsx
<button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:424
**Current Code:**
```tsx
<button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setDisplayCount(20); // Rese...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:473
**Current Code:**
```tsx
<button 
                  onClick={handleCreate}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-indigo)] ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/content/page.tsx:500
**Current Code:**
```tsx
<button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-[var(--c...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/home/RecentActivity.tsx:219
**Current Code:**
```tsx
<button
          onClick={() => setShowAll(!showAll)}
          className="load-more-button"
        >
          {showAll ? 'Show less' : `Show ${act...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/configure/page.tsx:184
**Current Code:**
```tsx
<button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focu...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/chatbot/page.tsx:113
**Current Code:**
```tsx
<button
            onClick={startNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex it...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/chatbot/page.tsx:131
**Current Code:**
```tsx
<button
                key={conv.id}
                onClick={() => setCurrentConversation(conv.id)}
                className={`w-full text-left p-3...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/chatbot/page.tsx:256
**Current Code:**
```tsx
<button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/campaigns/page.tsx:382
**Current Code:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/campaigns/page.tsx:386
**Current Code:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/campaigns/page.tsx:390
**Current Code:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                <Plus...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/campaigns/page.tsx:545
**Current Code:**
```tsx
<button 
                onClick={() => {
                  try {
                    localStorage.setItem('first_campaign_started', '1');
           ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/complete-onboarding/page.tsx:43
**Current Code:**
```tsx
<button
          onClick={completeOnboarding}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
     ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/billing/page.tsx:148
**Current Code:**
```tsx
<button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/billing/page.tsx:158
**Current Code:**
```tsx
<button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/billing/page.tsx:221
**Current Code:**
```tsx
<button
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    selectedPlan === plan.id
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/billing/page.tsx:259
**Current Code:**
```tsx
<button
            onClick={() => {/* handle checkout */}}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/analytics/page.tsx:218
**Current Code:**
```tsx
<button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`time-range-button ${
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### src/app/(auth)/register/page.tsx:224
**Current Code:**
```tsx
<button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent round...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/page.tsx:81
**Current Code:**
```tsx
<button
            disabled
            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/page.tsx:103
**Current Code:**
```tsx
<button onClick={joinOFWaitlist} disabled={loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opa...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/onlyfans-placeholder.tsx:56
**Current Code:**
```tsx
<button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm fo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:108
**Current Code:**
```tsx
<button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justif...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:138
**Current Code:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:141
**Current Code:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:164
**Current Code:**
```tsx
<button
                        key={i}
                        className={`aspect-square p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:184
**Current Code:**
```tsx
<button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full flex items-center justify-center gap-2 py...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:357
**Current Code:**
```tsx
<button
                  onClick={() => setAiSuggestions(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-p...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:399
**Current Code:**
```tsx
<button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                            <Check className="w-4 h-4 text-green-600 dark:te...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:480
**Current Code:**
```tsx
<button
                        key={platform}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/features/content-scheduler/page.tsx:501
**Current Code:**
```tsx
<button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/ai/assistant/AssistantClient.tsx:240
**Current Code:**
```tsx
<button
                    key={idx}
                    onClick={() => executeQuickAction(action.agentKey, action.action, action.params)}
          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/ai/assistant/AssistantClient.tsx:309
**Current Code:**
```tsx
<button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/creator/messages/page.tsx:32
**Current Code:**
```tsx
<button
              className="mt-3 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:98
**Current Code:**
```tsx
<button type="submit" disabled={loading}>
        {loading ? 'Completing...' : 'Complete Onboarding'}
      </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:138
**Current Code:**
```tsx
<button onClick={() => setStep(2)}>Next</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:147
**Current Code:**
```tsx
<button onClick={() => setStep(1)}>Back</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:148
**Current Code:**
```tsx
<button onClick={() => setStep(3)}>Next</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:179
**Current Code:**
```tsx
<button onClick={() => setStep(2)}>Back</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:180
**Current Code:**
```tsx
<button onClick={handleComplete} disabled={loading}>
            {loading ? 'Completing...' : 'Complete'}
          </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:238
**Current Code:**
```tsx
<button onClick={handleComplete} disabled={loading}>
        {loading ? 'Loading...' : 'Complete Onboarding'}
      </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:298
**Current Code:**
```tsx
<button onClick={handleComplete} disabled={loading}>
        Complete Onboarding
      </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:341
**Current Code:**
```tsx
<button onClick={reset}>Dismiss</button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:344
**Current Code:**
```tsx
<button onClick={handleSubmit} disabled={loading}>
        {loading ? `Completing... (Attempt ${retryCount + 1})` : 'Complete'}
      </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/onboarding/complete/example-usage.tsx:395
**Current Code:**
```tsx
<button onClick={() => handleSubmit({ contentTypes: ['photos'] })} disabled={loading}>
        Submit
      </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/api/monitoring/metrics/example-component.tsx:87
**Current Code:**
```tsx
<button
            onClick={refresh}
            disabled={isRefreshing}
            className="btn-refresh"
          >
            <RefreshCw class...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/smart-onboarding/analytics/page.tsx:58
**Current Code:**
```tsx
<button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/page.tsx:284
**Current Code:**
```tsx
<button
                      onClick={disconnectOnlyFans}
                      className="flex items-center gap-2 px-4 py-2 border border-red-300 da...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/page.tsx:306
**Current Code:**
```tsx
<button
                    onClick={connectOnlyFans}
                    disabled={connecting}
                    className="flex items-center gap-2...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/page.tsx:517
**Current Code:**
```tsx
<button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--colo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/page.tsx:321
**Current Code:**
```tsx
<button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/page.tsx:393
**Current Code:**
```tsx
<button
                        onClick={getAISuggestions}
                        disabled={loadingAI}
                        className="flex items-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/page.tsx:416
**Current Code:**
```tsx
<button
                            key={suggestion.id}
                            onClick={() => useSuggestion(suggestion)}
                        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/page.tsx:483
**Current Code:**
```tsx
<button
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sendingMessage}
                      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/fans/page.tsx:58
**Current Code:**
```tsx
<button
              key={segment.value}
              onClick={() => setSelectedSegment(segment.value as FanSegment)}
              className={`p-4 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/fans/page.tsx:89
**Current Code:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/ppv/page.tsx:134
**Current Code:**
```tsx
<button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-l...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/ppv/page.tsx:239
**Current Code:**
```tsx
<button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/ppv/page.tsx:372
**Current Code:**
```tsx
<button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/ppv/page.tsx:466
**Current Code:**
```tsx
<button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/wizard/page.tsx:92
**Current Code:**
```tsx
<button
                  onClick={handleContinueAnyway}
                  className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/wizard/page.tsx:98
**Current Code:**
```tsx
<button
                  onClick={() => setError(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neut...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:247
**Current Code:**
```tsx
<button
                      key={lang.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, lang...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:370
**Current Code:**
```tsx
<button
                      key={niche.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, niche...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:423
**Current Code:**
```tsx
<button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
      ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:451
**Current Code:**
```tsx
<button
                        key={type.id}
                        type="button"
                        onClick={() => toggleContentType(type.id)}...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:558
**Current Code:**
```tsx
<button 
                            onClick={() => togglePlatform(platform.id)}
                            className="btn-sm btn-primary"
          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:641
**Current Code:**
```tsx
<button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, respo...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:762
**Current Code:**
```tsx
<button
              onClick={handleComplete}
              className="btn-primary btn-lg mt-8"
            >
              <span>Go to Dashboard</sp...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:828
**Current Code:**
```tsx
<button
                  onClick={handlePrevious}
                  disabled={loading}
                  className="btn-secondary"
                >
...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:838
**Current Code:**
```tsx
<button
                onClick={handleNext}
                disabled={loading || (currentStep === 'profile' && !formData.gdprConsent)}
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:936
**Current Code:**
```tsx
<button
          onClick={() => setBillingCycle('monthly')}
          className={billingCycle === 'monthly' ? 'active' : ''}
        >
          Mont...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:942
**Current Code:**
```tsx
<button
          onClick={() => setBillingCycle('yearly')}
          className={billingCycle === 'yearly' ? 'active' : ''}
        >
          Yearly...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/setup/page-new.tsx:990
**Current Code:**
```tsx
<button 
              className={`plan-cta ${plan.id === 'starter' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={(e) => {
             ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/optimize/page.tsx:219
**Current Code:**
```tsx
<button
              onClick={handleStartTests}
              disabled={selectedTests.length === 0}
              className="px-6 py-2 bg-blue-600 te...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/huntaze/page.tsx:151
**Current Code:**
```tsx
<button
                  onClick={simulateGatedAction}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primar...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/dashboard/page.tsx:148
**Current Code:**
```tsx
<button
                onClick={handleContinueOnboarding}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onboarding/dashboard/page.tsx:177
**Current Code:**
```tsx
<button
                    onClick={handleContinueOnboarding}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/of-connect/cookies/page.tsx:46
**Current Code:**
```tsx
<button type="submit" disabled={loading}>
            {loading ? 'Envoi…' : 'Déposer'}
          </button>
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/calendar/page.tsx:73
**Current Code:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900">
          ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/calendar/page.tsx:87
**Current Code:**
```tsx
<button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
        ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/calendar/page.tsx:93
**Current Code:**
```tsx
<button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-60...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/calendar/page.tsx:99
**Current Code:**
```tsx
<button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
            ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/billing/packs/MessagePacksClient.tsx:73
**Current Code:**
```tsx
<button
              onClick={() => handleCheckout(p.key as any)}
              className="mt-4 w-full rounded-md bg-[var(--color-indigo)] px-4 py-2 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/analytics/pricing/page.tsx:211
**Current Code:**
```tsx
<button
                  onClick={() => setShowToast(false)}
                  className="text-white hover:text-gray-200"
                >
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/analytics/upsells/page.tsx:79
**Current Code:**
```tsx
<button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/analytics/churn/page.tsx:113
**Current Code:**
```tsx
<button
                key={level}
                onClick={() => setSelectedRiskLevel(level)}
                className={`px-4 py-2 rounded-lg text-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/analytics/churn/page.tsx:127
**Current Code:**
```tsx
<button
              onClick={handleBulkReEngage}
              disabled={isReEngaging}
              className="px-4 py-2 bg-purple-600 text-white r...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/reddit/publish/page.tsx:93
**Current Code:**
```tsx
<button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
       ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/reddit/publish/page.tsx:144
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setKind('link')}
                className={`p-4 border-2 rounded-lg transition-a...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/reddit/publish/page.tsx:161
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setKind('self')}
                className={`p-4 border-2 rounded-lg transition-a...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/reddit/publish/page.tsx:291
**Current Code:**
```tsx
<button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-6...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/reddit/publish/page.tsx:308
**Current Code:**
```tsx
<button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-l...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/reddit/page.tsx:88
**Current Code:**
```tsx
<button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/reddit/page.tsx:94
**Current Code:**
```tsx
<button
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/reddit/page.tsx:154
**Current Code:**
```tsx
<button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/tiktok/page.tsx:107
**Current Code:**
```tsx
<button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibol...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/tiktok/page.tsx:113
**Current Code:**
```tsx
<button
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:b...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/tiktok/page.tsx:173
**Current Code:**
```tsx
<button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 bg-black text-white rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/onlyfans/page.tsx:115
**Current Code:**
```tsx
<button
                disabled={waitlistLoading}
                onClick={async () => {
                  try {
                    setNotice('');
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/connect/instagram/page.tsx:161
**Current Code:**
```tsx
<button
            onClick={handleConnect}
            disabled={isConnecting || !!success}
            className={`w-full py-3 px-4 rounded-lg font-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/import/onlyfans/page.tsx:118
**Current Code:**
```tsx
<button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium"
         ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/import/onlyfans/page.tsx:154
**Current Code:**
```tsx
<button
                onClick={doImport}
                disabled={importing}
                className="w-full py-3 bg-purple-600 text-white rounde...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/tiktok/upload/page.tsx:258
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center justify-center px-4...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/tiktok/upload/page.tsx:270
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setMode('file')}
                className={`flex items-center justify-center px-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/tiktok/upload/page.tsx:447
**Current Code:**
```tsx
<button
            type="submit"
            disabled={status.uploading}
            className="w-full px-6 py-3 bg-black text-white rounded-lg hover...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/onlyfans/analytics/page.tsx:179
**Current Code:**
```tsx
<button 
              onClick={exportData}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center ga...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/onlyfans/analytics/page.tsx:243
**Current Code:**
```tsx
<button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(marketing)/platforms/onlyfans/analytics/page.tsx:249
**Current Code:**
```tsx
<button
              onClick={() => setActiveTab('fans')}
              className={`px-4 py-2 font-medium ${activeTab === 'fans' ? 'border-b-2 border...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/social/tiktok/upload/page.tsx:122
**Current Code:**
```tsx
<button
                    onClick={() => setVideoFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
               ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/social/tiktok/upload/page.tsx:190
**Current Code:**
```tsx
<button
            onClick={handleUpload}
            disabled={isUploading || !videoFile || !caption.trim()}
            className="w-full py-3 bg-g...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:134
**Current Code:**
```tsx
<button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-l...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:200
**Current Code:**
```tsx
<button
            onClick={() => setAutomationEnabled(!automationEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounde...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:283
**Current Code:**
```tsx
<button
                        onClick={() => handleToggleTemplate(template.id)}
                        className={`p-2 rounded-lg transition-colors...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:294
**Current Code:**
```tsx
<button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModa...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:304
**Current Code:**
```tsx
<button
                        onClick={() => handleTestSend(template)}
                        className="p-2 bg-purple-100 text-purple-700 rounded-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:311
**Current Code:**
```tsx
<button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowCreateModal(...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:321
**Current Code:**
```tsx
<button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-2 bg-gray-100 text-gray-700 rou...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:328
**Current Code:**
```tsx
<button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 bg-red-100 text-red-700 round...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:351
**Current Code:**
```tsx
<button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:439
**Current Code:**
```tsx
<button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }}
 ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:477
**Current Code:**
```tsx
<button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedTemplate(null);
                }}...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/settings/welcome/page.tsx:486
**Current Code:**
```tsx
<button
                onClick={() => handleTestSend(selectedTemplate)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/mass/page.tsx:231
**Current Code:**
```tsx
<button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/mass/page.tsx:259
**Current Code:**
```tsx
<button
                      key={audience.id}
                      onClick={() => setSelectedAudience(audience.id)}
                      className...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/mass/page.tsx:285
**Current Code:**
```tsx
<button
                      key={template.id}
                      onClick={() => setMessageText(template.text)}
                      className="p...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/mass/page.tsx:418
**Current Code:**
```tsx
<button
                      onClick={() => {
                        setMessageText('');
                        setScheduleDate('');
              ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/messages/mass/page.tsx:429
**Current Code:**
```tsx
<button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || !selectedAudience}
                  ...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/onlyfans/fans/[id]/page.tsx:61
**Current Code:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <MessageSquare className="w-4 h...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/campaigns/new/page.tsx:273
**Current Code:**
```tsx
<button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isCreating}
            className="flex ite...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/campaigns/new/page.tsx:282
**Current Code:**
```tsx
<button
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white ro...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/campaigns/[id]/page.tsx:152
**Current Code:**
```tsx
<button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="flex items-center gap-2 px-4 py-2 bg-...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/campaigns/[id]/page.tsx:161
**Current Code:**
```tsx
<button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---

### app/(app)/marketing/campaigns/[id]/page.tsx:168
**Current Code:**
```tsx
<button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 border bor...
```

**Migration Instructions:**
1. Import Button component: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop:
   - `btn-primary` or `bg-purple-600` → `variant="primary"`
   - `btn-secondary` or `btn-ghost` → `variant="secondary"`
   - `btn-outline` or `border-2` → `variant="outline"`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
```tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
```

**Reason:** Complex button pattern - requires manual review

---


## Next Steps

1. ✅ Review auto-fixed changes and run tests
2. 📝 Manually migrate the 717 complex buttons listed above
3. 🧪 Run property-based test: `npm run test -- tests/unit/properties/button-component-usage.property.test.ts --run`
4. 🔍 Verify no visual regressions

## Button Component API Reference

```tsx
<Button
  variant="primary" | "secondary" | "outline" | "ghost" | "tonal" | "danger" | "gradient" | "link"
  size="sm" | "md" | "lg" | "xl" | "pill"
  loading={boolean}
  disabled={boolean}
  onClick={handler}
  type="button" | "submit" | "reset"
  // ... all other standard button props
>
  Button Text
</Button>
```
