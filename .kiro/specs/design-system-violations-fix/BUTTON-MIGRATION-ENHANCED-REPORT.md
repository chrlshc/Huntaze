# Enhanced Button Migration Report

## Summary
- **Files Modified**: 248
- **High Confidence**: 25
- **Medium Confidence**: 597
- **Manual Review**: 52
- **Total**: 674

## High Confidence Migrations (25)

### hooks/useValidationHealth.ts:25
**Original:**
```tsx
<button onClick={refresh}>Refresh</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={refresh}>Refresh</Button>
```

---

### hooks/useOnboardingComplete.ts:26
**Original:**
```tsx
<button disabled={loading}>Complete</button>
```

**Fixed:**
```tsx
<Button variant="primary" disabled={loading}>Complete</Button>
```

---

### hooks/useMonitoringMetrics.ts:25
**Original:**
```tsx
<button onClick={refresh}>Refresh</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={refresh}>Refresh</Button>
```

---

### hooks/useCsrfToken.ts:246
**Original:**
```tsx
<button onClick={refresh}>Retry</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={refresh}>Retry</Button>
```

---

### hooks/useAuthSession.ts:47
**Original:**
```tsx
<button onClick={logout}>Logout</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={logout}>Logout</Button>
```

---

### lib/devtools/hydrationDevtools.ts:637
**Original:**
```tsx
<button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: var(--text-base); cursor: pointer;">×</b...
```

**Fixed:**
```tsx
<Button variant="primary">×</Button>
```

---

### hooks/auth/useAuthSession.ts:46
**Original:**
```tsx
<button onClick={logout}>Logout</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={logout}>Logout</Button>
```

---

### components/ui/container.example.tsx:41
**Original:**
```tsx
<button type="submit">Submit</button>
```

**Fixed:**
```tsx
<Button variant="primary" type="submit">Submit</Button>
```

---

### components/of/BridgeLauncher.tsx:101
**Original:**
```tsx
<button onClick={handleIos} disabled={!!busy} className={btn('ios')}>iOS bridge</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleIos} disabled={!!busy}>iOS bridge</Button>
```

---

### components/of/BridgeLauncher.tsx:102
**Original:**
```tsx
<button onClick={handleDesktop} disabled={!!busy} className={btn('desktop')}>Desktop bridge</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDesktop} disabled={!!busy}>Desktop bridge</Button>
```

---

### components/of/BridgeLauncher.tsx:103
**Original:**
```tsx
<button onClick={handleNative} disabled={!!busy} className={btn('native')}>Open in app</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNative} disabled={!!busy}>Open in app</Button>
```

---

### components/layout/SafeAreaExamples.tsx:36
**Original:**
```tsx
<button>Notifications</button>
```

**Fixed:**
```tsx
<Button variant="primary">Notifications</Button>
```

---

### components/layout/SafeAreaExamples.tsx:37
**Original:**
```tsx
<button>Profile</button>
```

**Fixed:**
```tsx
<Button variant="primary">Profile</Button>
```

---

### components/layout/SafeAreaExamples.tsx:86
**Original:**
```tsx
<button>Close</button>
```

**Fixed:**
```tsx
<Button variant="primary">Close</Button>
```

---

### components/layout/SafeAreaExamples.tsx:120
**Original:**
```tsx
<button>Notifications</button>
```

**Fixed:**
```tsx
<Button variant="primary">Notifications</Button>
```

---

### components/layout/SafeAreaExamples.tsx:121
**Original:**
```tsx
<button>Profile</button>
```

**Fixed:**
```tsx
<Button variant="primary">Profile</Button>
```

---

### components/layout/SafeAreaExamples.tsx:134
**Original:**
```tsx
<button>Tab 1</button>
```

**Fixed:**
```tsx
<Button variant="primary">Tab 1</Button>
```

---

### components/layout/SafeAreaExamples.tsx:135
**Original:**
```tsx
<button>Tab 2</button>
```

**Fixed:**
```tsx
<Button variant="primary">Tab 2</Button>
```

---

### components/layout/SafeAreaExamples.tsx:136
**Original:**
```tsx
<button>Tab 3</button>
```

**Fixed:**
```tsx
<Button variant="primary">Tab 3</Button>
```

---

### components/hz/PWAInstall.tsx:45
**Original:**
```tsx
<button className="hz-button primary" onClick={onInstall}>Install app</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onInstall}>Install app</Button>
```

---

### components/content/VideoEditor.tsx:121
**Original:**
```tsx
<button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50" disabled={saving}>Cancel</button>
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
```

---

### app/(app)/repost/page.tsx:123
**Original:**
```tsx
<button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm" onClick={() => schedule(s)}>Add to calendar</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => schedule(s)}>schedule(s)}>Add to calendar</Button>
```

---

### app/api/onboarding/complete/example-usage.tsx:148
**Original:**
```tsx
<button onClick={() => setStep(3)}>Next</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setStep(3)}>setStep(3)}>Next</Button>
```

---

### app/api/onboarding/complete/example-usage.tsx:179
**Original:**
```tsx
<button onClick={() => setStep(2)}>Back</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setStep(2)}>setStep(2)}>Back</Button>
```

---

### app/api/onboarding/complete/example-usage.tsx:341
**Original:**
```tsx
<button onClick={reset}>Dismiss</button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={reset}>Dismiss</Button>
```

---


## Medium Confidence Migrations (597)

### components/ThemeToggle.tsx:33
**Original:**
```tsx
<button
          key={value}
          onClick={() => handleThemeChange(value)}
          aria-pressed={theme === value}
          aria-label={`Switc...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleThemeChange(value)} aria-pressed={theme === value}>
  handleThemeChange(value)}
          aria-pressed={theme === value}
          aria-label={`Switch to ${label} theme`}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md
            text-sm font-medium transition-all duration-200
            ${
              theme === value
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-text hover:bg-theme-border/50'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/OFConnectBanner.tsx:31
**Original:**
```tsx
<button
                onClick={promptInstall}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary-active)] text-white hover:bg-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={promptInstall}>
  Install app
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/OFConnectBanner.tsx:40
**Original:**
```tsx
<button
                onClick={() => setShowIOS(true)}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transit...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowIOS(true)}>
  setShowIOS(true)}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition"
              >
                How to install on iPhone
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/OFConnectBanner.tsx:48
**Original:**
```tsx
<button
              onClick={() => (window.location.href = 'huntaze://connect')}
              className="px-4 py-2 rounded-xl border"
            >...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => (window.location.href = 'huntaze://connect')}>
  (window.location.href = 'huntaze://connect')}
              className="px-4 py-2 rounded-xl border"
            >
              Open in app
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/MobileSidebar.tsx:172
**Original:**
```tsx
<button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '8px',
              color: 'var(--color-text-sub)',
...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(false)} style={{
              padding: '8px',
              color: 'var(--color-text-sub)',
              borderRadius: 'var(--radius-button)',
              transition: 'color var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            } aria-label="Close menu">
  setIsOpen(false)}
            style={{
              padding: '8px',
              color: 'var(--color-text-sub)',
              borderRadius: 'var(--radius-button)',
              transition: 'color var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close menu"
          >
            <svg
              style={{
                width: '20px',
                height: '20px'
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/LinearHeader.tsx:82
**Original:**
```tsx
<button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white/70 hover:text-white p-2"
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
  setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white/70 hover:text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/InteractiveDemo.tsx:117
**Original:**
```tsx
<button
                onClick={reset}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                titl...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={reset}>
  <RotateCw className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/InteractiveDemo.tsx:124
**Original:**
```tsx
<button
                onClick={togglePlay}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
               ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={togglePlay}>
  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/InteractiveDemo.tsx:277
**Original:**
```tsx
<button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-whit...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={prevStep} disabled={currentStep === 0}>
  <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/InteractiveDemo.tsx:289
**Original:**
```tsx
<button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => goToStep(index)} disabled={currentStep === steps.length - 1}>
  goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-purple-600'
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/Header.tsx:112
**Original:**
```tsx
<button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg"
              style={{
                paddin...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => signOut({ callbackUrl: '/' } style={{
                padding: 'var(--spacing-2)',
                color: 'var(--nav-text-muted)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer'
              } aria-label="Sign out">
  signOut({ callbackUrl: '/' })}
              className="rounded-lg"
              style={{
                padding: 'var(--spacing-2)',
                color: 'var(--nav-text-muted)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
                e.currentTarget.style.color = 'var(--nav-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--nav-text-muted)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--nav-border-strong)';
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-label="Sign out"
            >
              <svg
                style={{
                  width: 'var(--spacing-5)',
                  height: 'var(--spacing-5)'
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/CookieConsent.tsx:80
**Original:**
```tsx
<button
              onClick={() => handleConsent(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-me...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleConsent(false)}>
  handleConsent(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
            >
              Refuser
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/CookieConsent.tsx:86
**Original:**
```tsx
<button
              onClick={() => handleConsent(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-med...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleConsent(true)}>
  handleConsent(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-medium transition-colors"
            >
              Accepter
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ContactSalesModal.tsx:90
**Original:**
```tsx
<button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
       ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onClose}>
  <X className="w-5 h-5 text-gray-500" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ContactSalesModal.tsx:168
**Original:**
```tsx
<button
                            key={option.value}
                            type="button"
                            onClick={() => setFormDat...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setFormData({ ...formData, monthlyRevenue: option.value } type="button">
  setFormData({ ...formData, monthlyRevenue: option.value })}
                            className={`
                              p-4 border rounded-lg text-left transition-all
                              ${formData.monthlyRevenue === option.value
                                ? 'border-purple-600 bg-purple-50 text-purple-900'
                                : 'border-gray-300 hover:border-gray-400'
                              }
                            `}
                          >
                            <div className="font-medium">{option.label}</div>
                            {option.value === '1m+' && (
                              <div className="text-xs text-purple-600 mt-1">Enterprise Plan</div>
                            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ContactSalesModal.tsx:217
**Original:**
```tsx
<button
                              key={option.value}
                              type="button"
                              onClick={() => setF...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setFormData({ ...formData, currentPainPoint: option.value } type="button">
  setFormData({ ...formData, currentPainPoint: option.value })}
                              className={`
                                w-full p-4 border rounded-lg text-left transition-all flex items-center gap-4
                                ${formData.currentPainPoint === option.value
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-300 hover:border-gray-400'
                                }
                              `}
                            >
                              <Icon className="w-6 h-6 text-purple-600" />
                              <div>
                                <div className="font-medium text-gray-900">{option.label}</div>
                              </div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ContactSalesModal.tsx:277
**Original:**
```tsx
<button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border b...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setStep(1)} type="button">
  setStep(1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ContactSalesModal.tsx:284
**Original:**
```tsx
<button
                        type="submit"
                        disabled={!formData.currentPainPoint}
                        className="flex-1 ...
```

**Fixed:**
```tsx
<Button variant="primary" disabled={!formData.currentPainPoint} type="submit">
  Submit & Book a Call
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ContactSalesModal.tsx:315
**Original:**
```tsx
<button
                      onClick={onClose}
                      className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  Close
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/global-error.tsx:27
**Original:**
```tsx
<button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backg...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => window.location.reload()} style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: 'var(--text-base)'
              }>
  window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: 'var(--text-base)'
              }}
            >
              Refresh Page
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/error.tsx:25
**Original:**
```tsx
<button
          onClick={reset}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={reset}>
  Try again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/use-cases-carousel.tsx:165
**Original:**
```tsx
<button
            onClick={goToPrevious}
            className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:b...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={goToPrevious} aria-label="Previous case study">
  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/use-cases-carousel.tsx:172
**Original:**
```tsx
<button
            onClick={goToNext}
            className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={goToNext} aria-label="Next case study">
  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/use-cases-carousel.tsx:182
**Original:**
```tsx
<button
              onClick={goToPrevious}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
              aria-label="Previou...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={goToPrevious} aria-label="Previous">
  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/use-cases-carousel.tsx:189
**Original:**
```tsx
<button
              onClick={goToNext}
              className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full"
              aria-label="Next"
     ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={goToNext} aria-label="Next">
  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/theme-toggle.tsx:71
**Original:**
```tsx
<button
                    key={t.value}
                    onClick={() => {
                      setTheme(t.value as any)
                      se...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {
                      setTheme(t.value as any)
                      setIsOpen(false)
                    }>
  {
                      setTheme(t.value as any)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="theme-indicator"
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600"
                      />
                    )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/product-mockups.tsx:222
**Original:**
```tsx
<button className="p-2 bg-purple-600 text-white rounded-full">
              <MessageSquare className="w-5 h-5" />
            </button>
```

**Fixed:**
```tsx
<Button variant="primary">
  <MessageSquare className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/product-mockups.tsx:246
**Original:**
```tsx
<button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1...
```

**Fixed:**
```tsx
<Button variant="primary">
  View Details 
            <span className="text-lg">→</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/pricing-faq.tsx:47
**Original:**
```tsx
<button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
  setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-shopify.tsx:51
**Original:**
```tsx
<button
                  className="flex items-center gap-1 text-white hover:text-gray-300 text-[16px] font-medium py-2"
                  onMouseEnt...
```

**Fixed:**
```tsx
<Button variant="primary">
  setActiveDropdown('solutions')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  Solutions
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-shopify.tsx:205
**Original:**
```tsx
<button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileM...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
  setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-shopify-style.tsx:49
**Original:**
```tsx
<button
                      className="text-gray-300 hover:text-white text-[15px] font-medium flex items-center gap-1 py-2"
                      on...
```

**Fixed:**
```tsx
<Button variant="primary">
  setActiveDropdown(item.name)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-mobile-optimized.tsx:152
**Original:**
```tsx
<button 
                  onClick={handleLogout} 
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 touch-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleLogout}>
  Logout
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-mobile-optimized.tsx:363
**Original:**
```tsx
<button
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
   ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }>
  {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          className="
                            block w-full
                            min-h-[var(--touch-target-comfortable)]
                            px-6 py-3
                            text-gray-600
                            rounded-lg font-medium
                            text-center
                            hover:bg-gray-50
                            transition-colors
                            touch-manipulation
                          "
                        >
                          Logout
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-minimal.tsx:120
**Original:**
```tsx
<button className="flex items-center space-x-1 text-gray-300 hover:text-white text-sm focus:outline-none">
                <span>Solutions</span>
    ...
```

**Fixed:**
```tsx
<Button variant="primary">
  <span>Solutions</span>
                <ChevronDown className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-minimal.tsx:166
**Original:**
```tsx
<button className="flex items-center space-x-1 text-gray-300 hover:text-white text-sm focus:outline-none">
                <span>Resources</span>
    ...
```

**Fixed:**
```tsx
<Button variant="primary">
  <span>Resources</span>
                <ChevronDown className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-marketing.tsx:95
**Original:**
```tsx
<button
                        className="text-gray-400 hover:text-white text-sm flex items-center gap-1 py-2"
                        onClick={() =>...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}>
  setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                      >
                        {item.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          activeDropdown === item.name ? 'rotate-180' : ''
                        }`} />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-marketing.tsx:164
**Original:**
```tsx
<button
              className="p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileM...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
  setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-marketing.tsx:191
**Original:**
```tsx
<button
                          className="text-gray-300 text-base font-medium w-full text-left px-4 py-2"
                          onClick={() => ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}>
  setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                        >
                          {item.name}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-improved.tsx:283
**Original:**
```tsx
<button 
                  onClick={handleLogout} 
                  className="text-text-secondary hover:text-text-primary text-sm font-medium px-3 p...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleLogout}>
  Logout
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/header-improved.tsx:425
**Original:**
```tsx
<button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
       ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }>
  {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                      >
                        <LogOut className="w-5 h-5 text-text-secondary" />
                        <span className="text-text-primary">Logout</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/footer-improved.tsx:194
**Original:**
```tsx
<button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Globe className="w-4 h-4" /...
```

**Fixed:**
```tsx
<Button variant="primary">
  <Globe className="w-4 h-4" />
                <span>English (US)</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/floating-assistant.tsx:90
**Original:**
```tsx
<button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(false)}>
  setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/floating-assistant.tsx:111
**Original:**
```tsx
<button
                        key={index}
                        onClick={() => handleSuggestion(suggestion)}
                        className="w-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleSuggestion(suggestion)}>
  handleSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        {suggestion}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/enterprise-nav.tsx:120
**Original:**
```tsx
<button
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium tran...
```

**Fixed:**
```tsx
<Button variant="primary">
  setSolutionsOpen(true)}
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/enterprise-nav.tsx:175
**Original:**
```tsx
<button
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium tran...
```

**Fixed:**
```tsx
<Button variant="primary">
  setResourcesOpen(true)}
                onMouseLeave={() => setResourcesOpen(false)}
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/creator-testimonials.tsx:165
**Original:**
```tsx
<button
            onClick={prev}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:-translate-x-fu...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={prev}>
  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/creator-testimonials.tsx:172
**Original:**
```tsx
<button
            onClick={next}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 lg:translate-x-ful...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={next}>
  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/creator-testimonials.tsx:181
**Original:**
```tsx
<button
              onClick={prev}
              className="p-2 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg"
      ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={prev}>
  <ChevronLeft className="w-3 h-3 text-purple-600 dark:text-purple-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/creator-testimonials.tsx:187
**Original:**
```tsx
<button
              onClick={next}
              className="p-2 rounded-full bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg"
      ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={next}>
  <ChevronRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/app-topbar.tsx:108
**Original:**
```tsx
<button
              type="button"
              onClick={onDiscard}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:bord...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={onDiscard} type="button">
  Discard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/app-topbar.tsx:115
**Original:**
```tsx
<button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm"
 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onSave} type="button">
  Save
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/app-sidebar.tsx:352
**Original:**
```tsx
<button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="mobile-drawer-cl...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
  setDrawerOpen(false)}
                  className="mobile-drawer-close"
                >
                  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/app-sidebar-unified.tsx:241
**Original:**
```tsx
<button
                  aria-label="Close menu"
                  onClick={() => setDrawerOpen(false)}
                  className="mobile-drawer-cl...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
  setDrawerOpen(false)}
                  className="mobile-drawer-close"
                >
                  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/Toast.ts:39
**Original:**
```tsx
<button class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200" onclick="this.parentElement.parentEle...
```

**Fixed:**
```tsx
<Button variant="primary" aria-label="Close notification">
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/ErrorBoundary.tsx:100
**Original:**
```tsx
<button
                  onClick={this.handleReset}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={this.handleReset}>
  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/EditableField.tsx:32
**Original:**
```tsx
<button
          onClick={() => {
            setDraft(value);
            setEditing((prev) => !prev);
          }}
          className="text-sm tex...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
            setDraft(value);
            setEditing((prev) => !prev);
          }>
  {
            setDraft(value);
            setEditing((prev) => !prev);
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          {editing ? 'Annuler' : 'Personnaliser'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/CookieConsent.tsx:130
**Original:**
```tsx
<button
                onClick={() => setShowDetails(true)}
                className="text-sm text-purple-600 hover:text-purple-700 mt-2 underline"
...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowDetails(true)}>
  setShowDetails(true)}
                className="text-sm text-purple-600 hover:text-purple-700 mt-2 underline"
              >
                Customize preferences
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/CookieConsent.tsx:141
**Original:**
```tsx
<button
                onClick={handleRejectAll}
                className="btn-secondary text-sm"
              >
                Reject All
       ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleRejectAll}>
  Reject All
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/CookieConsent.tsx:147
**Original:**
```tsx
<button
                onClick={handleAcceptAll}
                className="btn-primary text-sm"
              >
                Accept All
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAcceptAll}>
  Accept All
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/CookieConsent.tsx:155
**Original:**
```tsx
<button
              onClick={() => setShowDetails(false)}
              className="lg:hidden absolute top-4 right-4"
            >
              <X ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowDetails(false)}>
  setShowDetails(false)}
              className="lg:hidden absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-gray-500" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/CookieConsent.tsx:252
**Original:**
```tsx
<button
                onClick={handleRejectAll}
                className="btn-secondary text-sm"
              >
                Reject All
       ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleRejectAll}>
  Reject All
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/CookieConsent.tsx:258
**Original:**
```tsx
<button
                onClick={handleAcceptSelected}
                className="btn-primary text-sm"
              >
                Save Preference...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAcceptSelected}>
  Save Preferences
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/ComplianceChecker.tsx:181
**Original:**
```tsx
<button
            onClick={() => checkContent(content, niche, context).then(setResult)}
            disabled={isChecking || (content?.trim()?.length...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => checkContent(content, niche, context).then(setResult)} disabled={isChecking || (content?.trim()?.length || 0) < 10}>
  checkContent(content, niche, context).then(setResult)}
            disabled={isChecking || (content?.trim()?.length || 0) < 10}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Check'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/ComplianceChecker.tsx:233
**Original:**
```tsx
<button
                      onClick={() => applyQuickFix(risk)}
                      disabled={isApplyingFix}
                      className="flex...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => applyQuickFix(risk)} disabled={isApplyingFix}>
  applyQuickFix(risk)}
                      disabled={isApplyingFix}
                      className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      title={`Fix: ${quickFix.slice(0, 50)}${quickFix.length > 50 ? '…' : ''}`}
                    >
                      {isApplyingFix ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      {isApplyingFix ? 'Fixing…' : 'Quick Fix'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/ComplianceChecker.tsx:263
**Original:**
```tsx
<button
            onClick={applyBulkFixes}
            disabled={isApplyingFix}
            className="w-full text-xs px-3 py-2 bg-blue-600 text-whi...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={applyBulkFixes} disabled={isApplyingFix}>
  🪄 Fix All Issues ({result.risks.length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:50
**Original:**
```tsx
<button
                    onClick={() => setActiveExample(example.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setActiveExample(example.id)}>
  setActiveExample(example.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeExample === example.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {example.title}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:429
**Original:**
```tsx
<button onClick={() => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              api.loca...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              api.localStorage?.setItem('theme', newTheme);
            }>
  {
              const newTheme = theme === 'light' ? 'dark' : 'light';
              setTheme(newTheme);
              api.localStorage?.setItem('theme', newTheme);
            }}>
              Toggle Theme
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:471
**Original:**
```tsx
<button 
                onClick={toggleTheme}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
           ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={toggleTheme}>
  Changer le thème
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:596
**Original:**
```tsx
<button 
                  onClick={() => setTheme('light')}
                  className="px-2 py-1 bg-yellow-400 text-black rounded text-sm"
        ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setTheme('light')}>
  setTheme('light')}
                  className="px-2 py-1 bg-yellow-400 text-black rounded text-sm"
                >
                  ☀️ Clair
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:602
**Original:**
```tsx
<button 
                  onClick={() => setTheme('dark')}
                  className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
           ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setTheme('dark')}>
  setTheme('dark')}
                  className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
                >
                  🌙 Sombre
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:608
**Original:**
```tsx
<button 
                  onClick={() => setTheme('system')}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setTheme('system')}>
  setTheme('system')}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  🖥️ Système
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### examples/hydration/interactive-examples.tsx:664
**Original:**
```tsx
<button
              onClick={() => setShowCode(!showCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowCode(!showCode)}>
  setShowCode(!showCode)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showCode ? 'Masquer' : 'Voir'} le code
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### hooks/billing/useCheckout.ts:67
**Original:**
```tsx
<button onClick={handlePurchase} disabled={loading}>
 *       {loading ? 'Processing...' : 'Buy Pack'}
 *     </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handlePurchase} disabled={loading}>
  *       {loading ? 'Processing...' : 'Buy Pack'}
 *
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### hooks/billing/useCheckout.ts:162
**Original:**
```tsx
<button onClick={() => purchasePack('25k')} disabled={loading}>
 *       Buy 25k Pack
 *     </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => purchasePack('25k')} disabled={loading}>
  purchasePack('25k')} disabled={loading}>
 *       Buy 25k Pack
 *
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/validation/ValidationHealthDashboard.tsx:148
**Original:**
```tsx
<button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transitio...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={onRetry}>
  Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/validation/ValidationHealthDashboard.tsx:187
**Original:**
```tsx
<button
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white b...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => refresh()}>
  refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/toast.tsx:85
**Original:**
```tsx
<button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-sm text-gra...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => removeToast(toast.id)} type="button" aria-label="Fermer la notification" aria-hidden="true">
  removeToast(toast.id)}
                className="rounded-md p-1 text-sm text-gray-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:53
**Original:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Fixed:**
```tsx
<Button variant="primary" style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }>
  Filter
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:65
**Original:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Fixed:**
```tsx
<Button variant="primary" style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'white',
              cursor: 'pointer',
            }>
  Create New
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:114
**Original:**
```tsx
<button
                type="submit"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRad...
```

**Fixed:**
```tsx
<Button variant="primary" type="submit" style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  cursor: 'pointer',
                }>
  Save Changes
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:144
**Original:**
```tsx
<button
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1p...
```

**Fixed:**
```tsx
<Button variant="primary" style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }>
  Export
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:176
**Original:**
```tsx
<button
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: 'no...
```

**Fixed:**
```tsx
<Button variant="primary" style={{
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'white',
            cursor: 'pointer',
          }>
  Add Integration
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:269
**Original:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Fixed:**
```tsx
<Button variant="primary" style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }>
  Action 1
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/page-layout.example.tsx:282
**Original:**
```tsx
<button
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              bor...
```

**Fixed:**
```tsx
<Button variant="primary" style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: 'var(--accent-primary)',
              color: 'white',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }>
  Action 2
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:31
**Original:**
```tsx
<button
          onClick={() => setBasicOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setBasicOpen(true)} style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }>
  setBasicOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Basic Modal
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:58
**Original:**
```tsx
<button
          onClick={() => setConfirmOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setConfirmOpen(true)} style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }>
  setConfirmOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Delete Item
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:77
**Original:**
```tsx
<button
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setConfirmOpen(false)} style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }>
  setConfirmOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:90
**Original:**
```tsx
<button
                onClick={() => {
                  alert('Item deleted!');
                  setConfirmOpen(false);
                }}
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                  alert('Item deleted!');
                  setConfirmOpen(false);
                } style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }>
  {
                  alert('Item deleted!');
                  setConfirmOpen(false);
                }}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Delete
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:118
**Original:**
```tsx
<button
          onClick={() => setFormOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: '...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setFormOpen(true)} style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }>
  setFormOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Add New Item
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:137
**Original:**
```tsx
<button
                onClick={() => setFormOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setFormOpen(false)} style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }>
  setFormOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:150
**Original:**
```tsx
<button
                onClick={() => {
                  alert('Item added!');
                  setFormOpen(false);
                }}
            ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                  alert('Item added!');
                  setFormOpen(false);
                } style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }>
  {
                  alert('Item added!');
                  setFormOpen(false);
                }}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Save
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:214
**Original:**
```tsx
<button
          onClick={() => setLargeOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setLargeOpen(true)} style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }>
  setLargeOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Large Modal
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:251
**Original:**
```tsx
<button
          onClick={() => setScrollOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background:...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setScrollOpen(true)} style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }>
  setScrollOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Scrollable Modal
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:269
**Original:**
```tsx
<button
              onClick={() => setScrollOpen(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
          ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setScrollOpen(false)} style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }>
  setScrollOpen(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              I Agree
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:299
**Original:**
```tsx
<button
          onClick={() => setNoBackdropClose(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            backgr...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setNoBackdropClose(true)} style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-warning)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }>
  setNoBackdropClose(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-warning)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Important Modal
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/modal.example.tsx:318
**Original:**
```tsx
<button
              onClick={() => setNoBackdropClose(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setNoBackdropClose(false)} style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }>
  setNoBackdropClose(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Acknowledge
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/alert.tsx:219
**Original:**
```tsx
<button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          className="alert-dismiss-button"
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismiss} type="button" style={{
            flexShrink: 0,
            padding: 'var(--space-1)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
            transition: 'all var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          } aria-label="Dismiss alert">
  {
            e.currentTarget.style.background = 'var(--bg-glass-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/alert.example.tsx:116
**Original:**
```tsx
<button
              onClick={() => setShowDismissible(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowDismissible(true)} style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }>
  setShowDismissible(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Show Alert Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/alert.example.tsx:155
**Original:**
```tsx
<button
              onClick={() => setShowAutoDismiss(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowAutoDismiss(true)} style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-success)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }>
  setShowAutoDismiss(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-success)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Show Alert Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/ShopifyStyleOnboardingModal.tsx:64
**Original:**
```tsx
<button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100 focus-visible:outline-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} aria-label="Close modal">
  <svg 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  className="h-5 w-5 text-neutral-500"
                  aria-hidden
                >
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/ModuleCard.tsx:99
**Original:**
```tsx
<button
            type="button"
            onClick={() => emitAction('refresh')}
            className="rounded-md border border-gray-300 px-3 py-1...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => emitAction('refresh')} type="button">
  emitAction('refresh')}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Refresh
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/ModuleCard.tsx:106
**Original:**
```tsx
<button
            type="button"
            onClick={() => emitAction('open')}
            className="rounded-md bg-gray-900 px-3 py-1 text-xs font-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => emitAction('open')} type="button">
  emitAction('open')}
            className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow hover:bg-gray-800"
          >
            Open module
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ui/Modal.tsx:164
**Original:**
```tsx
<button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} type="button" aria-label="Close modal">
  <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/recovery/RecoveryDashboard.tsx:162
**Original:**
```tsx
<button
          onClick={fetchStatus}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
     ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={fetchStatus}>
  Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/recovery/RecoveryDashboard.tsx:192
**Original:**
```tsx
<button
            onClick={fetchStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            R...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={fetchStatus}>
  Refresh
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/recovery/RecoveryDashboard.tsx:237
**Original:**
```tsx
<button
            onClick={() => triggerAction('reset_circuit_breaker')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hov...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => triggerAction('reset_circuit_breaker')}>
  triggerAction('reset_circuit_breaker')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Reset All
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/recovery/RecoveryDashboard.tsx:258
**Original:**
```tsx
<button
                    onClick={() => triggerAction('reset_circuit_breaker', name)}
                    className="px-2 py-1 bg-blue-600 text-whi...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => triggerAction('reset_circuit_breaker', name)}>
  triggerAction('reset_circuit_breaker', name)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Reset
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/recovery/RecoveryDashboard.tsx:296
**Original:**
```tsx
<button
            onClick={() => triggerAction('trigger_healing')}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => triggerAction('trigger_healing')}>
  triggerAction('trigger_healing')}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Trigger Healing
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/recovery/RecoveryDashboard.tsx:313
**Original:**
```tsx
<button
                onClick={() => triggerAction('trigger_healing', name)}
                className="px-2 py-1 bg-blue-600 text-white rounded tex...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => triggerAction('trigger_healing', name)}>
  triggerAction('trigger_healing', name)}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Execute
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/RealTimeFeedback.tsx:262
**Original:**
```tsx
<button
                    onClick={() => handleFeedbackDismiss(feedback.id)}
                    className={`flex-shrink-0 ${colors.text} opacity-70...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleFeedbackDismiss(feedback.id)}>
  handleFeedbackDismiss(feedback.id)}
                    className={`flex-shrink-0 ${colors.text} opacity-70 hover:opacity-100 transition-opacity`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/ProgressiveAssistance.tsx:307
**Original:**
```tsx
<button
                                      onClick={(e) => {
                                        e.stopPropagation();
                         ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={(e) => {
                                        e.stopPropagation();
                                        handleTutorialStep('prev');
                                      } disabled={currentTutorialStep === 0}>
  {
                                        e.stopPropagation();
                                        handleTutorialStep('prev');
                                      }}
                                      disabled={currentTutorialStep === 0}
                                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                        currentTutorialStep === 0
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : `${colors.button} text-white`
                                      }`}
                                    >
                                      Previous
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/ProgressiveAssistance.tsx:323
**Original:**
```tsx
<button
                                        onClick={(e) => {
                                          e.stopPropagation();
                     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={(e) => {
                                          e.stopPropagation();
                                          handleTutorialStep('next');
                                        }>
  {
                                          e.stopPropagation();
                                          handleTutorialStep('next');
                                        }}
                                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                                      >
                                        Next
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/ProgressiveAssistance.tsx:333
**Original:**
```tsx
<button
                                        onClick={(e) => {
                                          e.stopPropagation();
                     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={(e) => {
                                          e.stopPropagation();
                                          handleLevelComplete(index);
                                        }>
  {
                                          e.stopPropagation();
                                          handleLevelComplete(index);
                                        }}
                                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                                      >
                                        {assistance.actionLabel || 'Complete'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/ProgressiveAssistance.tsx:349
**Original:**
```tsx
<button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={(e) => {
                                    e.stopPropagation();
                                    handleLevelComplete(index);
                                  }>
  {
                                    e.stopPropagation();
                                    handleLevelComplete(index);
                                  }}
                                  className={`w-full py-2 text-sm font-medium text-white rounded ${colors.button} transition-colors`}
                                >
                                  {assistance.actionLabel}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/ProgressiveAssistance.tsx:374
**Original:**
```tsx
<button
                onClick={onDismiss}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onDismiss}>
  Close
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/MotivationalElements.tsx:366
**Original:**
```tsx
<button
                onClick={handleMessageDismiss}
                className={`flex-shrink-0 ${colors.text} opacity-70 hover:opacity-100 transitio...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleMessageDismiss}>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:211
**Original:**
```tsx
<button
                onClick={handleDismiss}
                className={`${colors.icon} hover:opacity-70 transition-opacity`}
              >
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismiss}>
  <XMarkIcon className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:235
**Original:**
```tsx
<button
                        onClick={handleExpand}
                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.b...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleExpand}>
  Show me how
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:243
**Original:**
```tsx
<button
                        onClick={handleAction}
                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.b...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAction}>
  {content.actionLabel}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:290
**Original:**
```tsx
<button
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className={`px-3...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={prevStep} disabled={currentStep === 0}>
  Previous
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:303
**Original:**
```tsx
<button
                            onClick={nextStep}
                            className={`px-3 py-1 text-xs font-medium text-white rounded ${colo...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={nextStep}>
  Next
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:310
**Original:**
```tsx
<button
                            onClick={handleAction || handleDismiss}
                            className={`px-3 py-1 text-xs font-medium text...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAction || handleDismiss}>
  {content.actionLabel || 'Got it!'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/InterventionOverlay.tsx:323
**Original:**
```tsx
<button
                      onClick={handleAction}
                      className={`w-full py-2 text-sm font-medium text-white rounded ${colors.but...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAction}>
  {content.actionLabel}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/ContextualTooltip.tsx:285
**Original:**
```tsx
<button
                  onClick={handleDismiss}
                  className={`flex-shrink-0 ${colors.icon} hover:opacity-70 transition-opacity`}
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismiss}>
  <XMarkIcon className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/CelebrationModal.tsx:303
**Original:**
```tsx
<button
                      onClick={handleShare}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors bg-gra...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleShare}>
  Share Achievement
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/CelebrationModal.tsx:311
**Original:**
```tsx
<button
                    onClick={handleClose}
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hov...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleClose}>
  Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/AdaptiveContent.tsx:155
**Original:**
```tsx
<button
            key={index}
            onClick={() => {
              handleInteraction('action_clicked', { action: action.id });
              i...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
              handleInteraction('action_clicked', { action: action.id }>
  {
              handleInteraction('action_clicked', { action: action.id });
              if (action.completes) {
                handleComplete();
              }
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              action.primary
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {action.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/AdaptiveContent.tsx:228
**Original:**
```tsx
<button
          onClick={handleComplete}
          className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg font-medium hove...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleComplete}>
  <PlayIcon className="w-5 h-5 mr-2" />
          Continue Your Journey
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/AdaptiveContent.tsx:279
**Original:**
```tsx
<button
                  key={optionIndex}
                  onClick={() => handleInteraction('quiz_answer', { 
                    questionIndex: in...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => handleInteraction('quiz_answer', { 
                    questionIndex: index, 
                    answerIndex: optionIndex,
                    answer: option
                  }>
  handleInteraction('quiz_answer', { 
                    questionIndex: index, 
                    answerIndex: optionIndex,
                    answer: option
                  })}
                  className="block w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  {option}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/pricing/UpgradeModal.tsx:59
**Original:**
```tsx
<button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading}
                  className={`mt-3 w-full rounded-m...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleUpgrade(plan)} disabled={loading}>
  handleUpgrade(plan)}
                  disabled={loading}
                  className={`mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold text-white ${
                    plan === 'enterprise' ? 'bg-gray-900 hover:bg-black' : 'bg-violet-600 hover:bg-violet-700'
                  }`}
                >
                  {loading ? 'Redirecting…' : plan === 'enterprise' ? 'Contact Sales / Annual' : 'Upgrade'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/pricing/StarterUpgradeBanner.tsx:22
**Original:**
```tsx
<button
          onClick={() => setOpen(true)}
          className="ml-3 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setOpen(true)}>
  setOpen(true)}
          className="ml-3 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-black"
        >
          Upgrade now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/pricing/PricingFAQ.tsx:63
**Original:**
```tsx
<button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setOpenIndex(openIndex === index ? null : index)} aria-expanded={openIndex === index}>
  setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-medium text-gray-900 dark:text-white pr-8">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/performance/LazyComponent.tsx:73
**Original:**
```tsx
<button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        data-testid="retry-button"
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onRetry} data-testid="retry-button">
  Retry ({retryCount}/{maxRetries})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/pagination/Pagination.tsx:65
**Original:**
```tsx
<button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
  onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/pagination/Pagination.tsx:72
**Original:**
```tsx
<button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inl...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
  onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/pagination/Pagination.tsx:130
**Original:**
```tsx
<button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    className={`relative inlin...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => onPageChange(page as number)}>
  onPageChange(page as number)}
                    className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/platforms/TikTokDashboardWidget.tsx:258
**Original:**
```tsx
<button
          onClick={handleDisconnect}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 roun...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleDisconnect}>
  Disconnect
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onlyfans/SmartMessageInbox.tsx:147
**Original:**
```tsx
<button
                  onClick={() => toggleQuickReply(fan.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-w...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => toggleQuickReply(fan.id)}>
  toggleQuickReply(fan.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Réponse rapide</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onlyfans/SmartMessageInbox.tsx:176
**Original:**
```tsx
<button
                            key={idx}
                            onClick={() => setMessages({ ...messages, [fan.id]: suggestion })}
         ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setMessages({ ...messages, [fan.id]: suggestion }>
  setMessages({ ...messages, [fan.id]: suggestion })}
                            className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                          >
                            <p className="text-sm text-gray-900">{suggestion}</p>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onlyfans/SmartMessageInbox.tsx:202
**Original:**
```tsx
<button
                          onClick={() => sendQuickMessage(fan.id, messages[fan.id])}
                          disabled={!messages[fan.id]}
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => sendQuickMessage(fan.id, messages[fan.id])} disabled={!messages[fan.id]}>
  sendQuickMessage(fan.id, messages[fan.id])}
                          disabled={!messages[fan.id]}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onlyfans/AIMessageComposer.tsx:151
**Original:**
```tsx
<button
              onClick={loadSuggestions}
              disabled={loading}
              className="group relative flex items-center gap-2 px-4 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={loadSuggestions} disabled={loading}>
  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden sm:inline">Actualiser</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/WhatsNew.tsx:85
**Original:**
```tsx
<button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              aria-labe...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} aria-label="Close">
  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/WhatsNew.tsx:131
**Original:**
```tsx
<button
                      onClick={() => handleStartTour(feature.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-6...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleStartTour(feature.id)}>
  handleStartTour(feature.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Take a Tour
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/WhatsNew.tsx:147
**Original:**
```tsx
<button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-m...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={onClose}>
  Close
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/TourNotificationBadge.tsx:69
**Original:**
```tsx
<button
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-fu...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(true)} aria-label="New features available">
  setIsOpen(true)}
            className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-pulse"
            aria-label="New features available"
          >
            <Sparkles className="w-6 h-6" />
            {pendingTours.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {pendingTours.length}
              </span>
            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/TourNotificationBadge.tsx:91
**Original:**
```tsx
<button
                onClick={handleDismissNotification}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismissNotification} aria-label="Close">
  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/TourNotificationBadge.tsx:131
**Original:**
```tsx
<button
                    onClick={() => handleStartTour(tour)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-bl...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleStartTour(tour)}>
  handleStartTour(tour)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Start Tour ({tour.steps.length} steps)
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/TourNotificationBadge.tsx:143
**Original:**
```tsx
<button
                onClick={handleDismissNotification}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 da...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismissNotification}>
  Remind me later
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/StepShell.tsx:50
**Original:**
```tsx
<button className="btn btn-ghost" onClick={onBack} type="button">
            {C.common.back}
          </button>
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onBack} type="button">
  {C.common.back}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/StepShell.tsx:53
**Original:**
```tsx
<button className="btn" onClick={onSkip} type="button">
            {C.common.skip}
          </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onSkip} type="button">
  {C.common.skip}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/StepShell.tsx:57
**Original:**
```tsx
<button
            className="btn btn-primary"
            onClick={onContinue}
            disabled={continueDisabled}
            type="button"
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onContinue} disabled={continueDisabled} type="button">
  {C.common.continue}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/StepNavigation.tsx:64
**Original:**
```tsx
<button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onSkip} type="button" aria-label="Skip this optional step">
  <SkipForward className="w-4 h-4" />
            Skip
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:59
**Original:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Fixed:**
```tsx
<Button variant="outline">
  <div className="text-2xl mb-2">🔥</div>
              <div className="font-medium">OnlyFans</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:63
**Original:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Fixed:**
```tsx
<Button variant="outline">
  <div className="text-2xl mb-2">📸</div>
              <div className="font-medium">Instagram</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:67
**Original:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Fixed:**
```tsx
<Button variant="outline">
  <div className="text-2xl mb-2">🎵</div>
              <div className="font-medium">TikTok</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:71
**Original:**
```tsx
<button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="t...
```

**Fixed:**
```tsx
<Button variant="outline">
  <div className="text-2xl mb-2">▶️</div>
              <div className="font-medium">YouTube</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:236
**Original:**
```tsx
<button
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSkip}>
  <X className="w-4 h-4" />
                Skip for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/SimplifiedOnboardingWizard.tsx:247
**Original:**
```tsx
<button
              onClick={handleNext}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg tr...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext}>
  {currentStep < steps.length - 1 ? 'Continue' : 'Get Started'}
              <ChevronRight className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/PlatformConnection.tsx:137
**Original:**
```tsx
<button
                      onClick={() => handleConnect(platform.id)}
                      disabled={!platform.available || isConnecting}
        ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleConnect(platform.id)} disabled={!platform.available || isConnecting}>
  handleConnect(platform.id)}
                      disabled={!platform.available || isConnecting}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                        platform.available
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Connect
                        </>
                      )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/PlatformConnection.tsx:183
**Original:**
```tsx
<button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`w-full py-3 rounded-lg font-semibold transition ${
      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleContinue} disabled={!canContinue}>
  Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/OnboardingWizard.tsx:171
**Original:**
```tsx
<button
                onClick={() => handleStepComplete('welcome')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semi...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleStepComplete('welcome')}>
  handleStepComplete('welcome')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Get Started
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/OnboardingWizard.tsx:178
**Original:**
```tsx
<button
                  onClick={async () => {
                    try {
                      await fetch('/api/force-complete-onboarding');
      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={async () => {
                    try {
                      await fetch('/api/force-complete-onboarding');
                    }>
  {
                    try {
                      await fetch('/api/force-complete-onboarding');
                    } catch {}
                    onComplete?.();
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Skip onboarding for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/OnboardingWizard.tsx:228
**Original:**
```tsx
<button
                onClick={() => {
                  handleStepComplete('completion');
                  onComplete?.();
                }}
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                  handleStepComplete('completion');
                  onComplete?.();
                }>
  {
                  handleStepComplete('completion');
                  onComplete?.();
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Start Creating Content
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/OnboardingErrorBoundary.tsx:101
**Original:**
```tsx
<button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={this.handleRetry}>
  <RefreshCw className="w-5 h-5" />
                Try Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/OnboardingErrorBoundary.tsx:109
**Original:**
```tsx
<button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={this.handleGoHome}>
  <Home className="w-5 h-5" />
                Go to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/OnboardingErrorBoundary.tsx:117
**Original:**
```tsx
<button
                onClick={this.handleReset}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
           ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={this.handleReset}>
  Dismiss Error
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/LoadDemoButton.tsx:73
**Original:**
```tsx
<button className="btn btn-outline w-full" onClick={load} type="button">
      Load demo persona (Luxury)
    </button>
```

**Fixed:**
```tsx
<Button variant="outline" onClick={load} type="button">
  Load demo persona (Luxury)
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/GoalSelection.tsx:123
**Original:**
```tsx
<button
        onClick={handleContinue}
        disabled={selectedGoals.length === 0}
        className={`w-full py-3 rounded-lg font-semibold transi...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleContinue} disabled={selectedGoals.length === 0}>
  0
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureUnlockModal.tsx:77
**Original:**
```tsx
<button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg trans...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} aria-label="Close modal">
  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureUnlockModal.tsx:139
**Original:**
```tsx
<button
              onClick={onClose}
              className={`${feature.quickStartUrl ? 'flex-1' : 'w-full'} px-4 py-3 border-2 border-gray-300 te...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onClose}>
  {feature.quickStartUrl ? 'Later' : 'Got it!'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTourGuide.tsx:148
**Original:**
```tsx
<button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label=...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismiss} aria-label="Close tour">
  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTourGuide.tsx:182
**Original:**
```tsx
<button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-4 py-2 text-sm font-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handlePrevious} disabled={isFirstStep}>
  <ChevronLeft className="w-4 h-4" />
            Previous
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTourGuide.tsx:191
**Original:**
```tsx
<button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext}>
  {isLastStep ? (
              <>
                <Check className="w-4 h-4" />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTourGuide.tsx:211
**Original:**
```tsx
<button
            onClick={handleDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-3...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismiss}>
  Skip tour
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTour.tsx:123
**Original:**
```tsx
<button
              onClick={handleSkip}
              className="p-1 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSkip} aria-label="Close tour">
  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTour.tsx:155
**Original:**
```tsx
<button
              onClick={handleSkip}
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSkip}>
  Skip Tour
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTour.tsx:164
**Original:**
```tsx
<button
                  onClick={handleBack}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
               ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleBack} aria-label="Previous step">
  <ArrowLeft className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/FeatureTour.tsx:173
**Original:**
```tsx
<button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-mediu...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext}>
  {isLastStep ? (
                  <>
                    <Check className="w-4 h-4" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/DashboardPreview.tsx:152
**Original:**
```tsx
<button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
           ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveTab('overview')}>
  setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/DashboardPreview.tsx:162
**Original:**
```tsx
<button
          onClick={() => setActiveTab('engagement')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveTab('engagement')}>
  setActiveTab('engagement')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            activeTab === 'engagement'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Engagement
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/CreatorAssessment.tsx:113
**Original:**
```tsx
<button
          onClick={() => onComplete({ level: calculatedLevel, responses })}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg f...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => onComplete({ level: calculatedLevel, responses }>
  onComplete({ level: calculatedLevel, responses })}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/CreatorAssessment.tsx:142
**Original:**
```tsx
<button
                  key={option.value}
                  onClick={() => handleOptionSelect(question.id, option.value)}
                  classNa...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleOptionSelect(question.id, option.value)}>
  handleOptionSelect(question.id, option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    responses[question.id] === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-gray-900">{option.label}</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/CreatorAssessment.tsx:159
**Original:**
```tsx
<button
        onClick={calculateLevel}
        disabled={!isComplete}
        className={`w-full py-3 rounded-lg font-semibold transition ${
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={calculateLevel} disabled={!isComplete}>
  See My Level
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/CompletionCelebration.tsx:170
**Original:**
```tsx
<button
              onClick={handleStartCreating}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleStartCreating}>
  Start Creating Content
              <ArrowRight className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/CompletionCelebration.tsx:177
**Original:**
```tsx
<button
              onClick={handleExploreFeatures}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleExploreFeatures}>
  Explore Features
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AdditionalPlatforms.tsx:142
**Original:**
```tsx
<button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                    className="flex...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleConnect(platform.id)} disabled={isConnecting}>
  handleConnect(platform.id)}
                    disabled={isConnecting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Connect
                      </>
                    )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AdditionalPlatforms.tsx:176
**Original:**
```tsx
<button
          onClick={onSkip}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 t...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onSkip}>
  Skip for Now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AdditionalPlatforms.tsx:182
**Original:**
```tsx
<button
          onClick={handleContinue}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transiti...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleContinue}>
  {connectedPlatforms.length > 0 ? 'Continue' : 'Skip & Continue'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AIConfiguration.tsx:61
**Original:**
```tsx
<button
              key={option.value}
              onClick={() => handleConfigChange('verbosity', option.value)}
              className={`p-4 rou...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleConfigChange('verbosity', option.value)}>
  handleConfigChange('verbosity', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.verbosity === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AIConfiguration.tsx:89
**Original:**
```tsx
<button
              key={option.value}
              onClick={() => handleConfigChange('helpFrequency', option.value)}
              className={`p-4...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleConfigChange('helpFrequency', option.value)}>
  handleConfigChange('helpFrequency', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.helpFrequency === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AIConfiguration.tsx:117
**Original:**
```tsx
<button
              key={option.value}
              onClick={() => handleConfigChange('suggestionStyle', option.value)}
              className={`p...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleConfigChange('suggestionStyle', option.value)}>
  handleConfigChange('suggestionStyle', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.suggestionStyle === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/AIConfiguration.tsx:147
**Original:**
```tsx
<button
        onClick={() => onComplete(config)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 tr...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => onComplete(config)}>
  onComplete(config)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Save AI Preferences
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/monitoring/ThreeJsHealthDashboard.tsx:133
**Original:**
```tsx
<button
              onClick={fetchStats}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={fetchStats}>
  Refresh
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/monitoring/ThreeJsHealthDashboard.tsx:197
**Original:**
```tsx
<button
                onClick={clearErrors}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clea...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={clearErrors}>
  Clear All
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/monitoring/ThreeJsHealthDashboard.tsx:251
**Original:**
```tsx
<button
              onClick={() => window.open('/docs/THREE_JS_TROUBLESHOOTING_GUIDE.md', '_blank')}
              className="text-xs text-blue-600 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => window.open('/docs/THREE_JS_TROUBLESHOOTING_GUIDE.md', '_blank')}>
  window.open('/docs/THREE_JS_TROUBLESHOOTING_GUIDE.md', '_blank')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Troubleshooting Guide
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/monitoring/ThreeJsHealthDashboard.tsx:258
**Original:**
```tsx
<button
              onClick={() => window.open('/api/monitoring/three-js-errors', '_blank')}
              className="text-xs text-blue-600 hover:te...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => window.open('/api/monitoring/three-js-errors', '_blank')}>
  window.open('/api/monitoring/three-js-errors', '_blank')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Raw Data
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/monitoring/GoldenSignalsDashboard.tsx:173
**Original:**
```tsx
<button
            onClick={fetchData}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
       ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={fetchData}>
  Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/monitoring/GoldenSignalsDashboard.tsx:204
**Original:**
```tsx
<button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-7...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={fetchData}>
  <RefreshCw className="w-4 h-4" />
            Refresh
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/of/BridgeLauncher.tsx:123
**Original:**
```tsx
<button onClick={handleIos} disabled={!!busy} className="hz-button">
              {busy === 'ios' ? 'Opening…' : 'Open iOS bridge'}
            </but...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleIos} disabled={!!busy}>
  {busy === 'ios' ? 'Opening…' : 'Open iOS bridge'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/of/BridgeLauncher.tsx:126
**Original:**
```tsx
<button onClick={handleDesktop} disabled={!!busy} className="hz-button">
              {busy === 'desktop' ? 'Opening…' : 'Open desktop bridge'}
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDesktop} disabled={!!busy}>
  {busy === 'desktop' ? 'Opening…' : 'Open desktop bridge'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/of/BridgeLauncher.tsx:129
**Original:**
```tsx
<button onClick={handleNative} disabled={!!busy} className="hz-button primary">
              {busy === 'native' ? 'Opening…' : 'Open in app'}
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNative} disabled={!!busy}>
  {busy === 'native' ? 'Opening…' : 'Open in app'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/of/BridgeLauncher.tsx:143
**Original:**
```tsx
<button onClick={handleIos} disabled={!!busy} className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleIos} disabled={!!busy}>
  {busy === "ios" ? "Opening…" : "Open iOS bridge"}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/of/BridgeLauncher.tsx:146
**Original:**
```tsx
<button onClick={handleDesktop} disabled={!!busy} className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDesktop} disabled={!!busy}>
  {busy === "desktop" ? "Opening…" : "Open desktop bridge"}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/of/BridgeLauncher.tsx:149
**Original:**
```tsx
<button onClick={handleNative} disabled={!!busy} className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-whit...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNative} disabled={!!busy}>
  {busy === "native" ? "Opening…" : "Open in app"}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/UserMenu.tsx:84
**Original:**
```tsx
<button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setIsOpen(!isOpen)} type="button" aria-label="User menu" aria-expanded={isOpen}>
  setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <ChevronDownIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/UserMenu.tsx:126
**Original:**
```tsx
<button
                        type="button"
                        onClick={() => handleMenuItemClick(item)}
                        className="fle...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => handleMenuItemClick(item)} type="button">
  handleMenuItemClick(item)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/UserMenu.tsx:150
**Original:**
```tsx
<button
                  key={item.label}
                  type="button"
                  onClick={() => handleMenuItemClick(item)}
               ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => handleMenuItemClick(item)} type="button">
  handleMenuItemClick(item)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/SkeletonScreen.example.tsx:91
**Original:**
```tsx
<button 
              type="submit"
              className="h-10 px-4 bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] rounded-md"
...
```

**Fixed:**
```tsx
<Button variant="primary" type="submit">
  Submit
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/SkeletonScreen.example.tsx:337
**Original:**
```tsx
<button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-md transition-colors $...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveExample(key)}>
  setActiveExample(key)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeExample === key
                  ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]'
                  : 'bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/SafeAreaExamples.tsx:66
**Original:**
```tsx
<button className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs">{label}</span>
  ...
```

**Fixed:**
```tsx
<Button variant="primary">
  <span className="text-2xl">{icon}</span>
      <span className="text-xs">{label}</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/NotificationBell.tsx:33
**Original:**
```tsx
<button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-600 transition-colors ho...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setIsOpen(!isOpen)} type="button" aria-label="Notifications" aria-expanded={isOpen}>
  setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/NotificationBell.tsx:56
**Original:**
```tsx
<button
                type="button"
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
 ...
```

**Fixed:**
```tsx
<Button variant="primary" type="button">
  Mark all read
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/NotificationBell.tsx:93
**Original:**
```tsx
<button
              type="button"
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
  ...
```

**Fixed:**
```tsx
<Button variant="primary" type="button">
  View all notifications
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/CenteredContainer.example.tsx:111
**Original:**
```tsx
<button
            type="submit"
            className="h-10 px-6 bg-accent-primary text-white rounded-md hover:bg-accent-hover"
          >
        ...
```

**Fixed:**
```tsx
<Button variant="primary" type="submit">
  Save Changes
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/layout/CenteredContainer.example.tsx:117
**Original:**
```tsx
<button
            type="button"
            className="h-10 px-6 bg-surface border border-subtle text-primary rounded-md hover:bg-hover"
          >...
```

**Fixed:**
```tsx
<Button variant="primary" type="button">
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/IntegrationsSection.tsx:225
**Original:**
```tsx
<button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }>
  {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear filters
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/IntegrationCard.tsx:179
**Original:**
```tsx
<button
            onClick={handleConnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-center...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleConnect} disabled={isLoading} style={{
              background: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--button-radius)',
            }>
  !isLoading && (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Add app'
            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/IntegrationCard.tsx:207
**Original:**
```tsx
<button
                onClick={handleConnect}
                disabled={isLoading}
                className={cn(
                  'flex-1 inline-f...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleConnect} disabled={isLoading} style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--button-radius)',
                }>
  !isLoading && (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent-primary)')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add another'
                )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/IntegrationCard.tsx:231
**Original:**
```tsx
<button
              onClick={handleDisconnect}
              disabled={isLoading}
              className={cn(
                showAddAnother ? '' :...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDisconnect} disabled={isLoading} style={{
                border: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--button-radius)',
              }>
  !isLoading && (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Disconnect
                </>
              )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/IntegrationCard.tsx:263
**Original:**
```tsx
<button
            onClick={handleReconnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-cent...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleReconnect} disabled={isLoading} style={{
              background: 'var(--accent-warning)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--button-radius)',
            }>
  {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </>
            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/IntegrationCard.tsx:290
**Original:**
```tsx
<button
            onClick={handleReconnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-cent...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleReconnect} disabled={isLoading} style={{
              background: 'var(--accent-error)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--button-radius)',
            }>
  {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </>
            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/AccountSwitcher.tsx:61
**Original:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(!isOpen)} aria-label="Switch account" aria-expanded={isOpen}>
  setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm font-medium text-content-primary transition hover:border-border-strong hover:bg-surface-muted"
        aria-label="Switch account"
        aria-expanded={isOpen}
      >
        <IntegrationIcon provider={provider} size="sm" />
        <span className="flex-1 text-left">
          {selectedAccount ? getDisplayName(selectedAccount) : 'Select account'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-content-secondary transition-transform',
            isOpen && 'rotate-180'
          )}
        />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/integrations/AccountSwitcher.tsx:96
**Original:**
```tsx
<button
                    key={account.providerAccountId}
                    onClick={() => {
                      onAccountChange(account.provide...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                      onAccountChange(account.providerAccountId);
                      setIsOpen(false);
                    }>
  {
                      onAccountChange(account.providerAccountId);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-content-primary hover:bg-surface-muted'
                    )}
                  >
                    <IntegrationIcon provider={provider} size="sm" />
                    <span className="flex-1 truncate">{displayName}</span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/home/InteractiveDashboardDemo.tsx:81
**Original:**
```tsx
<button
          onClick={onClick}
          className="relative w-full max-w-[40px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg tran...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClick} style={{ height: `${height}>
  {isActive && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-purple-500/30">
              {value}
            </div>
          )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/landing/SimpleHeroSection.tsx:119
**Original:**
```tsx
<button className="group relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transi...
```

**Fixed:**
```tsx
<Button variant="primary">
  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all" />
                  <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" />
                  </div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/landing/SimpleFAQSection.tsx:40
**Original:**
```tsx
<button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => toggleFAQ(index)}>
  toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/landing/LandingHeader.tsx:67
**Original:**
```tsx
<button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-60...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu" aria-hidden="true" aria-hidden="true">
  setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-600"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/landing/HeroSection.tsx:207
**Original:**
```tsx
<button className="group relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transi...
```

**Fixed:**
```tsx
<Button variant="primary">
  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all" />
                  <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" />
                  </div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/landing/FAQSection.tsx:27
**Original:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between gap-4 text-left hover:text-blue-60...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(!isOpen)}>
  setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between gap-4 text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </motion.div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationRecoverySystem.tsx:278
**Original:**
```tsx
<button
                onClick={manualRecovery}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={manualRecovery}>
  Réessayer
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationNotificationSystem.tsx:153
**Original:**
```tsx
<button
                onClick={clearAllNotifications}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={clearAllNotifications}>
  Tout effacer
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationNotificationSystem.tsx:217
**Original:**
```tsx
<button
                    key={index}
                    onClick={() => {
                      action.action();
                      onClose();
 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                      action.action();
                      onClose();
                    }>
  {
                      action.action();
                      onClose();
                    }}
                    className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                      action.style === 'primary' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : action.style === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  >
                    {action.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationNotificationSystem.tsx:239
**Original:**
```tsx
<button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          <svg className="w-4 h-4" fill="cu...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationHealthDashboard.tsx:172
**Original:**
```tsx
<button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transi...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsExpanded(!isExpanded)}>
  setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-medium">Détails Techniques</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationHealthDashboard.tsx:318
**Original:**
```tsx
<button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsExpanded(!isExpanded)}>
  setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Masquer' : 'Détails'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationErrorBoundary.tsx:130
**Original:**
```tsx
<button
                    type="button"
                    onClick={this.handleRetry}
                    className="bg-yellow-50 text-yellow-800 r...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={this.handleRetry} type="button">
  Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationErrorBoundary.tsx:161
**Original:**
```tsx
<button
                  type="button"
                  onClick={this.handleRetry}
                  className="bg-red-50 text-red-800 rounded-md px...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={this.handleRetry} type="button">
  Try Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDiffViewer.tsx:126
**Original:**
```tsx
<button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  ×
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDiffViewer.tsx:142
**Original:**
```tsx
<button
                  onClick={() => {
                    hydrationDebugger.clearMismatches();
                    setMismatches([]);
           ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => {
                    hydrationDebugger.clearMismatches();
                    setMismatches([]);
                    setSelectedMismatch(null);
                  }>
  {
                    hydrationDebugger.clearMismatches();
                    setMismatches([]);
                    setSelectedMismatch(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDiffViewer.tsx:197
**Original:**
```tsx
<button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`py-2 px...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveTab(tab as any)}>
  setActiveTab(tab as any)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDebugPanel.tsx:24
**Original:**
```tsx
<button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-2 rounded-full text-white font-medium shadow-lg transition-colors $...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(!isOpen)}>
  setIsOpen(!isOpen)}
          className={`px-3 py-2 rounded-full text-white font-medium shadow-lg transition-colors ${
            errorCount > 0 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          🔧 Hydration {errorCount > 0 && `(${errorCount})`}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDebugPanel.tsx:46
**Original:**
```tsx
<button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(false)}>
  setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDebugPanel.tsx:92
**Original:**
```tsx
<button
                  onClick={() => setIsDiffViewerOpen(true)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md ho...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsDiffViewerOpen(true)}>
  setIsDiffViewerOpen(true)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Open Diff Viewer
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDebugPanel.tsx:98
**Original:**
```tsx
<button
                  onClick={clearErrors}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transi...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={clearErrors}>
  Clear All Errors
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/hydration/HydrationDebugPanel.tsx:160
**Original:**
```tsx
<button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setSelectedError(null)}>
  setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/engagement/OnboardingChecklist.tsx:108
**Original:**
```tsx
<button
          onClick={() => setIsCollapsed(true)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsCollapsed(true)} aria-label="Collapse onboarding checklist">
  setIsCollapsed(true)}
          className="text-muted hover:text-foreground transition-colors"
          aria-label="Collapse onboarding checklist"
        >
          <ChevronUp strokeWidth={1.5} size={20} />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/engagement/OnboardingChecklist.example.tsx:315
**Original:**
```tsx
<button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="Close"
          >
            ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} aria-label="Close">
  ✕
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/engagement/OnboardingChecklist.example.tsx:326
**Original:**
```tsx
<button
          onClick={onClose}
          className="mt-4 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  Get Started
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/engagement/ChangelogWidget.tsx:105
**Original:**
```tsx
<button className="relative flex items-center gap-2 p-2 hover:bg-surface rounded-lg transition-colors opacity-50">
        <Bell strokeWidth={1.5} siz...
```

**Fixed:**
```tsx
<Button variant="primary">
  <Bell strokeWidth={1.5} size={20} />
        <span className="text-sm">What's New</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/engagement/ChangelogWidget.tsx:114
**Original:**
```tsx
<button 
        onClick={handleOpen}
        className="relative flex items-center gap-2 p-2 hover:bg-surface rounded-lg transition-colors"
      >
 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleOpen} aria-label="New updates available">
  <Bell strokeWidth={1.5} size={20} />
        <span className="text-sm">What's New</span>
        {/* Requirement 7.2: Pulsing badge for new updates */}
        {hasNewUpdate && (
          <span 
            className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" 
            aria-label="New updates available"
          />
        )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/engagement/ChangelogWidget.tsx:144
**Original:**
```tsx
<button
                  onClick={handleClose}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                  aria...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleClose} aria-label="Close changelog">
  <X strokeWidth={1.5} size={20} />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/features/FeatureDetail.tsx:84
**Original:**
```tsx
<button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} aria-label="Close" data-testid="feature-detail-close">
  <X className="w-6 h-6" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/features/FeatureDetail.tsx:139
**Original:**
```tsx
<button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-sem...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  Got it
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/VideoEditor.tsx:122
**Original:**
```tsx
<button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
           ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSave} disabled={saving}>
  {saving ? 'Processing...' : 'Save Changes'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/VariationPerformance.tsx:236
**Original:**
```tsx
<button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={fetchStats}>
  Refresh Statistics
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/VariationManager.tsx:133
**Original:**
```tsx
<button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={variations.length >= 5 || getRemainingPercentage() === 0}
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)} disabled={variations.length >= 5 || getRemainingPercentage() === 0}>
  setShowCreateForm(!showCreateForm)}
          disabled={variations.length >= 5 || getRemainingPercentage() === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          + Add Variation
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/VariationManager.tsx:206
**Original:**
```tsx
<button
                onClick={createVariation}
                disabled={!variationName || !variationText}
                className="px-4 py-2 bg-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={createVariation} disabled={!variationName || !variationText}>
  Create Variation
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/VariationManager.tsx:213
**Original:**
```tsx
<button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gr...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowCreateForm(false)}>
  setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/VariationManager.tsx:278
**Original:**
```tsx
<button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVariation(variation.id);
  ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={(e) => {
                        e.stopPropagation();
                        deleteVariation(variation.id);
                      }>
  {
                        e.stopPropagation();
                        deleteVariation(variation.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/UrlImporter.tsx:86
**Original:**
```tsx
<button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="px-6 py-2 bg-blue-600 text-white round...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleImport} disabled={loading || !url.trim()}>
  {loading ? 'Importing...' : 'Import'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/UrlImporter.tsx:94
**Original:**
```tsx
<button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hove...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={onCancel} disabled={loading}>
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TemplateSelector.tsx:155
**Original:**
```tsx
<button onClick={() => setSelectedCategory('all')} className={`px-3 py-1 rounded text-sm ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setSelectedCategory('all')}>setSelectedCategory('all')} className={`px-3 py-1 rounded text-sm ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>All</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TemplateSelector.tsx:157
**Original:**
```tsx
<button key={category} onClick={() => setSelectedCategory(category)} className={`px-3 py-1 rounded text-sm capitalize ${selectedCategory === category ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setSelectedCategory(category)}>setSelectedCategory(category)} className={`px-3 py-1 rounded text-sm capitalize ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{category}</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TagInput.tsx:64
**Original:**
```tsx
<button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-900"
            >
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => removeTag(tag)} type="button">
  removeTag(tag)}
              className="hover:text-blue-900"
            >
              ×
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TagInput.tsx:97
**Original:**
```tsx
<button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full te...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => addTag(suggestion)} type="button">
  addTag(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
            >
              {suggestion}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TagAnalytics.tsx:59
**Original:**
```tsx
<button
            onClick={() => setView('frequency')}
            className={`px-3 py-1 text-sm rounded ${view === 'frequency' ? 'bg-blue-600 text-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setView('frequency')}>
  setView('frequency')}
            className={`px-3 py-1 text-sm rounded ${view === 'frequency' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Frequency
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TagAnalytics.tsx:65
**Original:**
```tsx
<button
            onClick={() => setView('combinations')}
            className={`px-3 py-1 text-sm rounded ${view === 'combinations' ? 'bg-blue-600...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setView('combinations')}>
  setView('combinations')}
            className={`px-3 py-1 text-sm rounded ${view === 'combinations' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Combinations
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/TagAnalytics.tsx:71
**Original:**
```tsx
<button
            onClick={() => setView('cloud')}
            className={`px-3 py-1 text-sm rounded ${view === 'cloud' ? 'bg-blue-600 text-white' :...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setView('cloud')}>
  setView('cloud')}
            className={`px-3 py-1 text-sm rounded ${view === 'cloud' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Tag Cloud
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/SchedulePicker.tsx:151
**Original:**
```tsx
<button
          type="button"
          onClick={() => setViewMode('input')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setViewMode('input')} disabled={disabled} type="button">
  setViewMode('input')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'input'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={disabled}
        >
          Quick Input
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/SchedulePicker.tsx:163
**Original:**
```tsx
<button
          type="button"
          onClick={() => setViewMode('calendar')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colo...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setViewMode('calendar')} disabled={disabled} type="button">
  setViewMode('calendar')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            viewMode === 'calendar'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          disabled={disabled}
        >
          Calendar View
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/SchedulePicker.tsx:217
**Original:**
```tsx
<button
                    key={suggestion.time}
                    type="button"
                    onClick={() => handleTimeSelect(suggestion.tim...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleTimeSelect(suggestion.time)} disabled={disabled} type="button">
  handleTimeSelect(suggestion.time)}
                    className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    disabled={disabled}
                  >
                    {suggestion.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/SchedulePicker.tsx:236
**Original:**
```tsx
<button
              type="button"
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handlePreviousMonth} disabled={disabled} type="button">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/SchedulePicker.tsx:249
**Original:**
```tsx
<button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 roun...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleNextMonth} disabled={disabled} type="button">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/SchedulePicker.tsx:276
**Original:**
```tsx
<button
                key={index}
                type="button"
                onClick={() => date && !isPast(date) && handleDateSelect(date)}
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => date && !isPast(date) && handleDateSelect(date)} disabled={!date || isPast(date) || disabled} type="button">
  date && !isPast(date) && handleDateSelect(date)}
                disabled={!date || isPast(date) || disabled}
                className={`
                  aspect-square p-2 text-sm rounded-lg transition-colors
                  ${!date ? 'invisible' : ''}
                  ${isPast(date!) ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : ''}
                  ${isSelected(date!) ? 'bg-purple-600 text-white font-semibold' : ''}
                  ${isToday(date!) && !isSelected(date!) ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : ''}
                  ${!isSelected(date!) && !isToday(date!) && !isPast(date!) ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white' : ''}
                `}
              >
                {date?.getDate()}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ProductivityDashboard.tsx:57
**Original:**
```tsx
<button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm ${
                per...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setPeriod(p)}>
  setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Last {p} days
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/PlatformPreview.tsx:188
**Original:**
```tsx
<button 
            onClick={() => setViewMode('mobile')} 
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'mob...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setViewMode('mobile')}>
  setViewMode('mobile')} 
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            📱 Mobile
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/PlatformPreview.tsx:194
**Original:**
```tsx
<button 
            onClick={() => setViewMode('desktop')} 
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'de...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setViewMode('desktop')}>
  setViewMode('desktop')} 
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            💻 Desktop
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/MediaUpload.tsx:278
**Original:**
```tsx
<button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-purple-600 hover:t...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading || uploadedFiles.length >= maxFiles} type="button">
  fileInputRef.current?.click()}
                className="text-purple-600 hover:text-purple-700 font-medium"
                disabled={uploading || uploadedFiles.length >= maxFiles}
              >
                browse files
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/MediaUpload.tsx:347
**Original:**
```tsx
<button
              onClick={() => setErrors([])}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
            >
  ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => setErrors([])}>
  setErrors([])}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/MediaPicker.tsx:90
**Original:**
```tsx
<button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  ✕
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/MediaPicker.tsx:169
**Original:**
```tsx
<button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
       ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onClose}>
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/MediaPicker.tsx:175
**Original:**
```tsx
<button
              onClick={handleConfirm}
              disabled={selectedMedia.size === 0}
              className="px-4 py-2 bg-blue-600 text-wh...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleConfirm} disabled={selectedMedia.size === 0}>
  Insert {selectedMedia.size > 0 && `(${selectedMedia.size})`}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ImageEditor.tsx:157
**Original:**
```tsx
<button
                  onClick={() => setRotate((prev) => prev - 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setRotate((prev) => prev - 90)}>
  setRotate((prev) => prev - 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  ↶ 90°
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ImageEditor.tsx:163
**Original:**
```tsx
<button
                  onClick={() => setRotate((prev) => prev + 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setRotate((prev) => prev + 90)}>
  setRotate((prev) => prev + 90)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
                >
                  ↷ 90°
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ImageEditor.tsx:208
**Original:**
```tsx
<button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={saving}
          >
   ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onCancel} disabled={saving}>
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ImageEditor.tsx:215
**Original:**
```tsx
<button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-7...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSave} disabled={saving}>
  {saving ? 'Saving...' : 'Save Changes'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/EmojiPicker.tsx:27
**Original:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 rounded hover:bg-gray-200"
        type="button"
      >
        😀
  ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setIsOpen(!isOpen)} type="button">
  setIsOpen(!isOpen)}
        className="px-3 py-1 rounded hover:bg-gray-200"
        type="button"
      >
        😀
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/EmojiPicker.tsx:45
**Original:**
```tsx
<button
                  key={category}
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
              ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)} type="button">
  setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                  className={`flex-1 px-2 py-2 text-xs ${
                    activeCategory === category
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  type="button"
                >
                  {category}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/EmojiPicker.tsx:63
**Original:**
```tsx
<button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-10...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => handleEmojiClick(emoji)} type="button">
  handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-1"
                  type="button"
                >
                  {emoji}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/CsvImporter.tsx:157
**Original:**
```tsx
<button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gr...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleDownloadTemplate}>
  Download Template
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/CsvImporter.tsx:288
**Original:**
```tsx
<button
              onClick={handleImport}
              disabled={loading || !mapping.title || !mapping.content}
              className="flex-1 px...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleImport} disabled={loading || !mapping.title || !mapping.content}>
  {loading ? 'Importing...' : 'Import Content'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/CsvImporter.tsx:295
**Original:**
```tsx
<button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg h...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleReset} disabled={loading}>
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/CsvImporter.tsx:330
**Original:**
```tsx
<button
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-c...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleReset}>
  Import Another File
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/CsvImporter.tsx:337
**Original:**
```tsx
<button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colo...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={onCancel}>
  Close
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentValidator.tsx:75
**Original:**
```tsx
<button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowDetails(!showDetails)}>
  setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            {showDetails ? '▼ Hide details' : '▶ Show details'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentModal.tsx:70
**Original:**
```tsx
<button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} disabled={isLoading}>
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentList.tsx:90
**Original:**
```tsx
<button
            onClick={() => {
              setSelectedItems(new Set());
              setSelectAll(false);
              onSelectionChange?.([...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
              setSelectedItems(new Set());
              setSelectAll(false);
              onSelectionChange?.([]);
            }>
  {
              setSelectedItems(new Set());
              setSelectAll(false);
              onSelectionChange?.([]);
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentList.tsx:179
**Original:**
```tsx
<button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick?.(item);
                  }}
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={(e) => {
                    e.stopPropagation();
                    onItemClick?.(item);
                  }>
  {
                    e.stopPropagation();
                    onItemClick?.(item);
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentForm.tsx:233
**Original:**
```tsx
<button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleAddTag} disabled={isLoading} type="button">
  Add
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentForm.tsx:250
**Original:**
```tsx
<button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-purple-900 dark...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleRemoveTag(tag)} disabled={isLoading} type="button">
  handleRemoveTag(tag)}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                  disabled={isLoading}
                >
                  ×
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentForm.tsx:308
**Original:**
```tsx
<button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onCancel} disabled={isLoading} type="button">
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentForm.tsx:316
**Original:**
```tsx
<button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opac...
```

**Fixed:**
```tsx
<Button variant="primary" disabled type="submit">
  {isLoading ? 'Saving...' : initialData?.id ? 'Update Content' : 'Create Content'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditorWithAutoSave.tsx:83
**Original:**
```tsx
<button
          onClick={saveNow}
          disabled={status.status === 'saving'}
          className="px-3 py-1 text-sm bg-blue-600 text-white roun...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={saveNow} disabled={status.status === 'saving'}>
  Save Now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:101
**Original:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            e...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => editor.chain().focus().toggleBold().run()} type="button">
  editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
          }`}
          type="button"
        >
          B
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:110
**Original:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
           ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => editor.chain().focus().toggleItalic().run()} type="button">
  editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300 italic' : ''
          }`}
          type="button"
        >
          I
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:119
**Original:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
           ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => editor.chain().focus().toggleStrike().run()} type="button">
  editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('strike') ? 'bg-gray-300 line-through' : ''
          }`}
          type="button"
        >
          S
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:131
**Original:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
       ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => editor.chain().focus().toggleBulletList().run()} type="button">
  editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          type="button"
        >
          • List
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:140
**Original:**
```tsx
<button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
      ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => editor.chain().focus().toggleOrderedList().run()} type="button">
  editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          type="button"
        >
          1. List
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:152
**Original:**
```tsx
<button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().se...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url } type="button">
  {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          }`}
          type="button"
        >
          Link
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentEditor.tsx:168
**Original:**
```tsx
<button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 text-red-600"
...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => editor.chain().focus().unsetLink().run()} type="button">
  editor.chain().focus().unsetLink().run()}
            className="px-3 py-1 rounded hover:bg-gray-200 text-red-600"
            type="button"
          >
            Unlink
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCreator.tsx:50
**Original:**
```tsx
<button
            onClick={() => setShowMediaPicker(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowMediaPicker(true)}>
  setShowMediaPicker(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + Add Media
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCreator.tsx:79
**Original:**
```tsx
<button
                    onClick={() => removeMedia(media.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => removeMedia(media.id)}>
  removeMedia(media.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCalendar.tsx:306
**Original:**
```tsx
<button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-color...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
  setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCalendar.tsx:315
**Original:**
```tsx
<button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-color...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
  setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCalendar.tsx:321
**Original:**
```tsx
<button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setCurrentDate(new Date())}>
  setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Today
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCalendar.tsx:330
**Original:**
```tsx
<button
            onClick={() => setView('month')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setView('month')}>
  setView('month')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Month
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCalendar.tsx:338
**Original:**
```tsx
<button
            onClick={() => setView('week')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === '...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setView('week')}>
  setView('week')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Week
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/ContentCalendar.tsx:346
**Original:**
```tsx
<button
            onClick={() => setView('day')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'd...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setView('day')}>
  setView('day')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Day
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:119
**Original:**
```tsx
<button
              onClick={handleSchedule}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-l...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSchedule} disabled={processing}>
  📅 Schedule
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:127
**Original:**
```tsx
<button
              onClick={handleDuplicate}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleDuplicate} disabled={processing}>
  📋 Duplicate
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:135
**Original:**
```tsx
<button
              onClick={handleTag}
              disabled={processing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg h...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleTag} disabled={processing}>
  🏷️ Tag
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:143
**Original:**
```tsx
<button
              onClick={handleDelete}
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg h...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={handleDelete} disabled={processing}>
  🗑️ Delete
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:202
**Original:**
```tsx
<button
                onClick={confirmSchedule}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-600 text-w...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={confirmSchedule} disabled={processing}>
  {processing ? 'Scheduling...' : 'Schedule'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:209
**Original:**
```tsx
<button
                onClick={() => setShowScheduleModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowScheduleModal(false)} disabled={processing}>
  setShowScheduleModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:245
**Original:**
```tsx
<button
                onClick={confirmTag}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-purple-600 text-whit...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={confirmTag} disabled={processing}>
  {processing ? 'Adding Tags...' : 'Add Tags'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:252
**Original:**
```tsx
<button
                onClick={() => setShowTagModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gr...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowTagModal(false)} disabled={processing}>
  setShowTagModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:280
**Original:**
```tsx
<button
                onClick={confirmOperation}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white round...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={confirmOperation} disabled={processing}>
  {processing ? 'Processing...' : 'Confirm'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/BatchOperationsToolbar.tsx:291
**Original:**
```tsx
<button
                onClick={() => setShowConfirmModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 b...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={processing}>
  setShowConfirmModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/content/AIAssistant.tsx:79
**Original:**
```tsx
<button onClick={generateSuggestions} disabled={loading} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded h...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={generateSuggestions} disabled={loading}>
  {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generating...</div> : 'Generate Suggestions'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/PerformanceMonitor.tsx:54
**Original:**
```tsx
<button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(false)}>
  setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/LoadingStates.tsx:287
**Original:**
```tsx
<button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-cen...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClick} disabled={disabled || loading}>
  {loading && (
        <Spinner size="sm" className="absolute left-4" />
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/LazyLoadErrorBoundary.tsx:41
**Original:**
```tsx
<button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transi...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => window.location.reload()}>
  window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Reload Page
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/GlobalSearch.tsx:138
**Original:**
```tsx
<button
                      key={result.id}
                      className={styles.resultItem}
                      onClick={() => handleResultCli...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleResultClick(result)} data-testid={`search-result-${result.id}>
  handleResultClick(result)}
                      data-testid={`search-result-${result.id}`}
                    >
                      <div className={styles.resultTitle}>{result.title}</div>
                      {result.subtitle && (
                        <div className={styles.resultSubtitle}>{result.subtitle}</div>
                      )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/GamifiedOnboarding.tsx:48
**Original:**
```tsx
<button
            className={styles.primaryButton}
            onClick={onConnectAccount}
            disabled={hasConnectedAccounts}
          >
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onConnectAccount} disabled={hasConnectedAccounts}>
  {hasConnectedAccounts ? 'Compte connecté ✓' : 'Connecter maintenant'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/GamifiedOnboarding.tsx:112
**Original:**
```tsx
<button
            className={styles.primaryButton}
            onClick={onCreateContent}
          >
            Commencer à créer
          </butto...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onCreateContent}>
  Commencer à créer
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/DashboardErrorBoundary.tsx:158
**Original:**
```tsx
<button
                  onClick={this.handleRetry}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[var(--c...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={this.handleRetry}>
  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/DashboardErrorBoundary.tsx:171
**Original:**
```tsx
<button
                onClick={() => (window.location.href = '/home')}
                className="flex-1 inline-flex items-center justify-center px-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => (window.location.href = '/home')}>
  (window.location.href = '/home')}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-[var(--color-text-main)] rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/DashboardErrorBoundary.tsx:237
**Original:**
```tsx
<button
          onClick={resetError}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try again
       ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={resetError}>
  Try again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/ContentPageErrorBoundary.tsx:179
**Original:**
```tsx
<button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={this.handleReset}>
  <RefreshCw className="w-4 h-4" />
                Try Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/ContentPageErrorBoundary.tsx:187
**Original:**
```tsx
<button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={this.handleReload}>
  <RefreshCw className="w-4 h-4" />
                Reload Page
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/ContentPageErrorBoundary.tsx:195
**Original:**
```tsx
<button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={this.handleGoHome}>
  <Home className="w-4 h-4" />
                Go to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/dashboard/AsyncOperationWrapper.tsx:138
**Original:**
```tsx
<button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={onRetry}>
  <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/chatbot/ChatbotWidget.tsx:92
**Original:**
```tsx
<button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 sh...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(true)} aria-label="Open chatbot">
  setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50"
        aria-label="Open chatbot"
      >
        <MessageCircle className="w-6 h-6" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/chatbot/ChatbotWidget.tsx:111
**Original:**
```tsx
<button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label="M...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsOpen(false)} aria-label="Minimize">
  setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/chatbot/ChatbotWidget.tsx:118
**Original:**
```tsx
<button
            onClick={() => {
              setIsOpen(false);
              setMessages([messages[0]]); // Reset to initial message
           ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
              setIsOpen(false);
              setMessages([messages[0]]); // Reset to initial message
            } aria-label="Close">
  {
              setIsOpen(false);
              setMessages([messages[0]]); // Reset to initial message
            }}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/chatbot/ChatbotWidget.tsx:181
**Original:**
```tsx
<button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabl...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSend} disabled={!input.trim() || isLoading} aria-label="Send message">
  <Send className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/animations/MobileOptimizations.tsx:120
**Original:**
```tsx
<button
      className={`
        min-h-[44px] min-w-[44px] 
        touch-manipulation select-none
        ${isPressed ? 'scale-95' : ''}
        ${...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClick} style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }>
  setIsPressed(true)}
      onTouchEnd={() => {
        setIsPressed(false);
        onClick?.();
      }}
      onClick={onClick}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {children}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/auth/SignupForm.tsx:113
**Original:**
```tsx
<button
          onClick={() => {
            setEmailSent(false);
            setSentEmail('');
          }}
          className="text-purple-600 ho...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
            setEmailSent(false);
            setSentEmail('');
          }>
  {
            setEmailSent(false);
            setSentEmail('');
          }}
          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          Try a different email address
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/auth/SignInForm.tsx:181
**Original:**
```tsx
<button
                    type="button"
                    onClick={handleRecovery}
                    className="mt-2 text-sm font-medium text-re...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={handleRecovery} type="button">
  {getRecoveryAction(authError).description}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/auth/RegisterForm.tsx:110
**Original:**
```tsx
<button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white...
```

**Fixed:**
```tsx
<Button variant="primary" disabled={loading} type="submit">
  {loading ? 'Creating account...' : 'Create Account'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/auth/LoginForm.tsx:85
**Original:**
```tsx
<button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white...
```

**Fixed:**
```tsx
<Button variant="primary" disabled={loading} type="submit">
  {loading ? 'Signing in...' : 'Sign In'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/auth/AuthInput.tsx:70
**Original:**
```tsx
<button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translat...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowPassword(!showPassword)} type="button">
  setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/auth/AuthButton.tsx:28
**Original:**
```tsx
<button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      classNa...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClick} disabled={isDisabled} aria-disabled={isDisabled} aria-busy={loading} aria-hidden="true">
  {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
      {children}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AIChatAssistant.tsx:88
**Original:**
```tsx
<button
          className="generate-button"
          onClick={handleGenerateResponse}
          disabled={loading || !message.trim()}
        >
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleGenerateResponse} disabled={loading || !message.trim()}>
  {loading ? (
            <>
              <span className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <span className="ai-icon">✨</span>
              Generate AI Response
            </>
          )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AIChatAssistant.tsx:151
**Original:**
```tsx
<button
              className="use-response-button"
              onClick={handleUseResponse}
            >
              Use This Response
        ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleUseResponse}>
  Use This Response
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AIChatAssistant.tsx:157
**Original:**
```tsx
<button
              className="regenerate-button"
              onClick={handleGenerateResponse}
              disabled={loading}
            >
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleGenerateResponse} disabled={loading}>
  Regenerate
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AICaptionGenerator.tsx:84
**Original:**
```tsx
<button
                key={p.value}
                className={`platform-button ${platform === p.value ? 'active' : ''}`}
                onClick={(...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setPlatform(p.value)} disabled={loading}>
  setPlatform(p.value)}
                disabled={loading}
              >
                <span className="platform-icon">{p.icon}</span>
                <span className="platform-label">{p.label}</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AICaptionGenerator.tsx:142
**Original:**
```tsx
<button
          className="generate-button"
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
        >
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleGenerate} disabled={loading || !description.trim()}>
  {loading ? (
            <>
              <span className="spinner" />
              Generating...
            </>
          ) : (
            <>
              <span className="ai-icon">🎨</span>
              Generate Caption
            </>
          )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AICaptionGenerator.tsx:208
**Original:**
```tsx
<button
              className="copy-button"
              onClick={handleCopyCaption}
            >
              📋 Copy Caption
            </butt...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleCopyCaption}>
  📋 Copy Caption
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AICaptionGenerator.tsx:214
**Original:**
```tsx
<button
              className="regenerate-button"
              onClick={handleGenerate}
              disabled={loading}
            >
            ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleGenerate} disabled={loading}>
  🔄 Regenerate
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AIAnalyticsDashboard.tsx:72
**Original:**
```tsx
<button
              key={tf.value}
              className={`timeframe-button ${timeframe === tf.value ? 'active' : ''}`}
              onClick={() ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setTimeframe(tf.value)} disabled={loading}>
  setTimeframe(tf.value)}
              disabled={loading}
            >
              {tf.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AIAnalyticsDashboard.tsx:95
**Original:**
```tsx
<button className="retry-button" onClick={handleAnalyze}>
            Try Again
          </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAnalyze}>
  Try Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/ai/AIAnalyticsDashboard.tsx:187
**Original:**
```tsx
<button
              className="refresh-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {l...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleAnalyze} disabled={loading}>
  {loading ? (
                <>
                  <span className="spinner" />
                  Refreshing...
                </>
              ) : (
                <>
                  <span className="refresh-icon">🔄</span>
                  Refresh Analysis
                </>
              )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/auth-client.tsx:273
**Original:**
```tsx
<button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all d...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsLogin(false)}>
  setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/auth-client.tsx:283
**Original:**
```tsx
<button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all du...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsLogin(true)}>
  setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/auth-client.tsx:385
**Original:**
```tsx
<button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowPassword(!showPassword)} type="button">
  setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/auth-client.tsx:486
**Original:**
```tsx
<button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsLogin(!isLogin)} type="button">
  setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {isLogin ? 'Create one' : 'Sign in'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/onboarding/progressive-onboarding.tsx:175
**Original:**
```tsx
<button
              onClick={() => completeOnboarding()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => completeOnboarding()}>
  completeOnboarding()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip and explore on my own →
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/inbox.tsx:51
**Original:**
```tsx
<button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize t...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setFilter(f)}>
  setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {f}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/create-campaign-modal.tsx:78
**Original:**
```tsx
<button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
  ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onClose}>
  <X className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/create-campaign-modal.tsx:127
**Original:**
```tsx
<button
                onClick={() => setAudienceType('all')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
          ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setAudienceType('all')}>
  setAudienceType('all')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  audienceType === 'all'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="block font-medium">All Subscribers</span>
                <span className="block text-sm text-gray-600 dark:text-gray-400">
                  Send to everyone
                </span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/create-campaign-modal.tsx:142
**Original:**
```tsx
<button
                onClick={() => setAudienceType('segment')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
      ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setAudienceType('segment')}>
  setAudienceType('segment')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  audienceType === 'segment'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Filter className="w-5 h-5 mx-auto mb-1" />
                <span className="block font-medium">Segments</span>
                <span className="block text-sm text-gray-600 dark:text-gray-400">
                  Target specific groups
                </span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/create-campaign-modal.tsx:210
**Original:**
```tsx
<button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 r...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onClose}>
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/create-campaign-modal.tsx:216
**Original:**
```tsx
<button
              onClick={handleCreate}
              disabled={!name.trim() || !content.trim() || creating || (audienceType === 'segment' && sel...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleCreate} disabled={!name.trim() || !content.trim() || creating || (audienceType === 'segment' && selectedSegments.length === 0)}>
  <Send className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Campaign'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/conversation-view.tsx:95
**Original:**
```tsx
<button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
         ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onBack}>
  <ArrowLeft className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/conversation-view.tsx:108
**Original:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5" />
        ...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <MoreVertical className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/conversation-view.tsx:150
**Original:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
         ...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <Paperclip className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/conversation-view.tsx:168
**Original:**
```tsx
<button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className={`p-2 rounded-lg transition-all ${
 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={sendMessage} disabled={!message.trim() || sending}>
  <Send className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/conversation-view.tsx:181
**Original:**
```tsx
<button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/ofm/ai/draft', ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={async () => {
              try {
                const res = await fetch('/api/ofm/ai/draft', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' } type="button">
  {
              try {
                const res = await fetch('/api/ofm/ai/draft', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fanMessage: messages?.[messages.length - 1]?.content?.text || '',
                    fanData: { name: 'Fan', rfmSegment: 'CASUAL', lastActive: new Date().toISOString(), totalSpent: 0, messageCount: messages?.length || 0 },
                    persona: { name: 'Default', style_guide: 'Friendly and concise', tone_keywords: ['friendly','warm'] },
                    conversationId,
                  }),
                });
                const data = await res.json();
                if (data?.draft_message) setMessage(data.draft_message);
              } catch {}
            }}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            AI draft
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/conversation-view.tsx:203
**Original:**
```tsx
<button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/ofm/ai/escalate', { method:...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={async () => {
              try {
                await fetch('/api/ofm/ai/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' } type="button">
  {
              try {
                await fetch('/api/ofm/ai/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId }) });
                alert('Conversation escalated');
              } catch {}
            }}
            className="inline-flex items-center rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            Escalate
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaigns.tsx:85
**Original:**
```tsx
<button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowCreateModal(true)}>
  setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaigns.tsx:106
**Original:**
```tsx
<button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowCreateModal(true)}>
  setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaigns.tsx:139
**Original:**
```tsx
<button
                        onClick={() => handleCampaignAction(campaign.id, 'launch')}
                        className="p-2 text-green-600 hove...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleCampaignAction(campaign.id, 'launch')}>
  handleCampaignAction(campaign.id, 'launch')}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Launch campaign"
                      >
                        <Play className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaigns.tsx:148
**Original:**
```tsx
<button
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        className="p-2 text-yellow-600 hove...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleCampaignAction(campaign.id, 'pause')}>
  handleCampaignAction(campaign.id, 'pause')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        title="Pause campaign"
                      >
                        <Pause className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaigns.tsx:157
**Original:**
```tsx
<button
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        className="p-2 text-green-600 hove...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleCampaignAction(campaign.id, 'resume')}>
  handleCampaignAction(campaign.id, 'resume')}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Resume campaign"
                      >
                        <Play className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaign-details.tsx:78
**Original:**
```tsx
<button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
           ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onBack}>
  <ArrowLeft className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaign-details.tsx:103
**Original:**
```tsx
<button
                onClick={() => handleAction('launch')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white ro...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleAction('launch')}>
  handleAction('launch')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Launch Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaign-details.tsx:112
**Original:**
```tsx
<button
                onClick={() => handleAction('pause')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white ro...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleAction('pause')}>
  handleAction('pause')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaign-details.tsx:121
**Original:**
```tsx
<button
                onClick={() => handleAction('resume')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white ro...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleAction('resume')}>
  handleAction('resume')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/of/campaign-details.tsx:130
**Original:**
```tsx
<button
                onClick={() => handleAction('cancel')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white roun...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => handleAction('cancel')}>
  handleAction('cancel')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/components/hznew/app-shell.tsx:20
**Original:**
```tsx
<button className="lg:hidden text-gray-300 hover:text-white" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setOpen(true)} aria-label="Open menu">
  setOpen(true)}>
            <Menu className="h-5 w-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/pricing/PricingCard.tsx:125
**Original:**
```tsx
<button
          onClick={handleApply}
          disabled={isApplying || loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleApply} disabled={isApplying || loading}>
  {isApplying ? 'Applying...' : `Apply $${recommendedPrice.toFixed(2)}`}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/pricing/PPVPricing.tsx:87
**Original:**
```tsx
<button
              onClick={() => handleApply(rec.contentId)}
              disabled={applying === rec.contentId}
              className="w-full p...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleApply(rec.contentId)} disabled={applying === rec.contentId}>
  handleApply(rec.contentId)}
              disabled={applying === rec.contentId}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {applying === rec.contentId ? 'Applying...' : 'Apply Price'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellOpportunity.tsx:89
**Original:**
```tsx
<button
          onClick={() => onDismiss(opportunity.id)}
          disabled={isSending}
          className="text-gray-400 hover:text-gray-600 tran...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => onDismiss(opportunity.id)} disabled={isSending} aria-label="Dismiss opportunity">
  onDismiss(opportunity.id)}
          disabled={isSending}
          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Dismiss opportunity"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellOpportunity.tsx:155
**Original:**
```tsx
<button
            onClick={() => setIsEditingMessage(!isEditingMessage)}
            className="text-xs text-blue-600 hover:text-blue-700 font-mediu...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsEditingMessage(!isEditingMessage)}>
  setIsEditingMessage(!isEditingMessage)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {isEditingMessage ? 'Cancel' : 'Edit'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellOpportunity.tsx:178
**Original:**
```tsx
<button
          onClick={() => onDismiss(opportunity.id)}
          disabled={isSending}
          className="flex-1 px-4 py-2 text-sm font-medium t...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => onDismiss(opportunity.id)} disabled={isSending}>
  onDismiss(opportunity.id)}
          disabled={isSending}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Dismiss
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:66
**Original:**
```tsx
<button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors fo...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleToggleEnabled} aria-checked={settings.enabled}>
  <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:120
**Original:**
```tsx
<button
              onClick={() => handleMaxDailyChange(Math.max(1, settings.maxDailyUpsells - 1))}
              disabled={!settings.enabled || set...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleMaxDailyChange(Math.max(1, settings.maxDailyUpsells - 1))} disabled={!settings.enabled || settings.maxDailyUpsells <= 1}>
  handleMaxDailyChange(Math.max(1, settings.maxDailyUpsells - 1))}
              disabled={!settings.enabled || settings.maxDailyUpsells <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:138
**Original:**
```tsx
<button
              onClick={() => handleMaxDailyChange(Math.min(100, settings.maxDailyUpsells + 1))}
              disabled={!settings.enabled || s...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleMaxDailyChange(Math.min(100, settings.maxDailyUpsells + 1))} disabled={!settings.enabled || settings.maxDailyUpsells >= 100}>
  handleMaxDailyChange(Math.min(100, settings.maxDailyUpsells + 1))}
              disabled={!settings.enabled || settings.maxDailyUpsells >= 100}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:167
**Original:**
```tsx
<button
                      onClick={() => {
                        setSettings({
                          ...settings,
                          ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                        setSettings({
                          ...settings,
                          excludedFans: settings.excludedFans.filter((id) => id !== fanId),
                        }>
  {
                        setSettings({
                          ...settings,
                          excludedFans: settings.excludedFans.filter((id) => id !== fanId),
                        });
                        setHasChanges(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:237
**Original:**
```tsx
<button
            onClick={handleReset}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleReset} disabled={isSaving}>
  Reset
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/shared/Toast.tsx:127
**Original:**
```tsx
<button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <svg className...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => onClose(toast.id)}>
  onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/shared/ErrorBoundary.tsx:103
**Original:**
```tsx
<button
              onClick={onReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium trans...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={onReset}>
  Try again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/shared/EmptyState.tsx:26
**Original:**
```tsx
<button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium tran...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={action.onClick}>
  {action.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/payout/PayoutTimeline.tsx:127
**Original:**
```tsx
<button
          onClick={() => setFilterPlatform('all')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filte...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setFilterPlatform('all')}>
  setFilterPlatform('all')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterPlatform === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Platforms ({payouts.length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/payout/PayoutTimeline.tsx:138
**Original:**
```tsx
<button
            key={platform}
            onClick={() => setFilterPlatform(platform)}
            className={`px-3 py-1.5 text-sm rounded-lg tran...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setFilterPlatform(platform)}>
  setFilterPlatform(platform)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
              filterPlatform === platform
                ? getPlatformColor(platform).replace('50', '200')
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getPlatformIcon(platform)}
            {platform.charAt(0).toUpperCase() + platform.slice(1)} (
            {payouts.filter((p) => p.platform === platform).length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/payout/PayoutSummary.tsx:111
**Original:**
```tsx
<button
                  onClick={() => setIsEditingTaxRate(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-me...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setIsEditingTaxRate(true)}>
  setIsEditingTaxRate(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Adjust Rate
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/payout/PayoutSummary.tsx:144
**Original:**
```tsx
<button
                  onClick={handleSaveTaxRate}
                  className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded hove...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSaveTaxRate}>
  Save
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/payout/PayoutSummary.tsx:150
**Original:**
```tsx
<button
                  onClick={handleCancelTaxRate}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border borde...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleCancelTaxRate}>
  Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskList.tsx:118
**Original:**
```tsx
<button
            onClick={() => setFilterRisk('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fil...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setFilterRisk('all')}>
  setFilterRisk('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({fans.length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskList.tsx:128
**Original:**
```tsx
<button
            onClick={() => setFilterRisk('high')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fi...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => setFilterRisk('high')}>
  setFilterRisk('high')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'high'
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            High ({fans.filter(f => f.riskLevel === 'high').length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskList.tsx:138
**Original:**
```tsx
<button
            onClick={() => setFilterRisk('medium')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setFilterRisk('medium')}>
  setFilterRisk('medium')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'medium'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Medium ({fans.filter(f => f.riskLevel === 'medium').length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskList.tsx:148
**Original:**
```tsx
<button
            onClick={() => setFilterRisk('low')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              fil...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setFilterRisk('low')}>
  setFilterRisk('low')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'low'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Low ({fans.filter(f => f.riskLevel === 'low').length})
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskList.tsx:238
**Original:**
```tsx
<button
                  onClick={() => onViewDetails(fan.id)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gr...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => onViewDetails(fan.id)}>
  onViewDetails(fan.id)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Details
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskDetail.tsx:93
**Original:**
```tsx
<button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose} aria-label="Close modal">
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskDetail.tsx:218
**Original:**
```tsx
<button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg ho...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={onClose}>
  Close
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/churn/ChurnRiskDetail.tsx:224
**Original:**
```tsx
<button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transit...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onClose}>
  Send Re-engagement Message
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/forecast/RevenueForecastChart.tsx:82
**Original:**
```tsx
<button
          onClick={() => setShowGoalInput(!showGoalInput)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowGoalInput(!showGoalInput)}>
  setShowGoalInput(!showGoalInput)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Set Goal
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/forecast/RevenueForecastChart.tsx:104
**Original:**
```tsx
<button
              onClick={handleSetGoal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-7...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSetGoal}>
  Set
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/revenue/forecast/RevenueForecastChart.tsx:110
**Original:**
```tsx
<button
              onClick={() => setShowGoalInput(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border bor...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setShowGoalInput(false)}>
  setShowGoalInput(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/SystemAlerts.tsx:299
**Original:**
```tsx
<button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-xs text-blue-600 hover...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleAcknowledge(alert.id)}>
  handleAcknowledge(alert.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Acknowledge
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/SystemAlerts.tsx:307
**Original:**
```tsx
<button
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs text-gray-600 hover:text-gr...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleResolve(alert.id)}>
  handleResolve(alert.id)}
                            className="text-xs text-gray-600 hover:text-gray-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/SystemAlerts.tsx:320
**Original:**
```tsx
<button
                              key={action.id}
                              onClick={() => handleAction(alert.id, action.action)}
            ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleAction(alert.id, action.action)}>
  handleAction(alert.id, action.action)}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                action.type === 'primary' 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : action.type === 'danger'
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {action.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/OnboardingAnalyticsDashboard.tsx:148
**Original:**
```tsx
<button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm rounded ${
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setSelectedTimeRange(range)}>
  setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm rounded ${
                selectedTimeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/MLModelMonitoring.tsx:204
**Original:**
```tsx
<button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveTab(tab)}>
  setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'abtests' ? 'A/B Tests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/MLModelMonitoring.tsx:287
**Original:**
```tsx
<button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetrain(model.id);
        ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={(e) => {
                        e.stopPropagation();
                        handleRetrain(model.id);
                      } disabled={model.status === 'training'}>
  {
                        e.stopPropagation();
                        handleRetrain(model.id);
                      }}
                      disabled={model.status === 'training'}
                      className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {model.status === 'training' ? 'Training...' : 'Retrain'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/MLModelMonitoring.tsx:519
**Original:**
```tsx
<button
                    onClick={() => setSelectedModel(null)}
                    className="text-gray-400 hover:text-gray-600"
                 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setSelectedModel(null)}>
  setSelectedModel(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/smart-onboarding/analytics/InterventionEffectivenessReporting.tsx:213
**Original:**
```tsx
<button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setActiveTab(tab)}>
  setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'roi' ? 'ROI Analysis' : tab.charAt(0).toUpperCase() + tab.slice(1)}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/StepItem.tsx:117
**Original:**
```tsx
<button
                onClick={() => handleUpdate('skipped')}
                disabled={loading}
                className="text-sm font-medium text...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleUpdate('skipped')} disabled={loading}>
  handleUpdate('skipped')}
                disabled={loading}
                className="text-sm font-medium text-neutral-700 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-md px-1 disabled:opacity-50"
                aria-label={`Skip ${step.title} for now`}
              >
                Skip for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SimpleOnboarding.tsx:178
**Original:**
```tsx
<button
            onClick={onSkip}
            className="text-sm font-medium text-violet-400 hover:text-violet-300 focus-visible:outline-none focus...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onSkip}>
  Skip customized setup →
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SimpleOnboarding.tsx:184
**Original:**
```tsx
<button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white shadow-lg shadow-violet...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext}>
  Next
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M7 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:94
**Original:**
```tsx
<button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setStep(2)}>
  setStep(2)}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 font-medium transition-all"
              >
                Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:100
**Original:**
```tsx
<button
                onClick={onSkip}
                className="px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-600 transition...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onSkip}>
  Skip for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:128
**Original:**
```tsx
<button
                  key={platform.id}
                  onClick={() => handlePlatformSelect(platform.id as Platform)}
                  classNam...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handlePlatformSelect(platform.id as Platform)}>
  handlePlatformSelect(platform.id as Platform)}
                  className="p-4 rounded-xl border border-neutral-700 hover:border-violet-500 hover:bg-neutral-800/50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">{platform.icon}</div>
                  <div className="font-medium">{platform.label}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:174
**Original:**
```tsx
<button
                  key={goal.id}
                  onClick={() => handleGoalSelect(goal.id as Goal)}
                  className="w-full p-4 ro...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleGoalSelect(goal.id as Goal)}>
  handleGoalSelect(goal.id as Goal)}
                  className="w-full p-4 rounded-xl border border-neutral-700 hover:border-violet-500 hover:bg-neutral-800/50 transition-all text-left"
                >
                  <div className="font-medium mb-1">{goal.label}</div>
                  <div className="text-sm text-neutral-400">{goal.desc}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:220
**Original:**
```tsx
<button
                  key={tone.id}
                  onClick={() => handleToneSelect(tone.id as Tone)}
                  className="w-full p-4 ro...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleToneSelect(tone.id as Tone)}>
  handleToneSelect(tone.id as Tone)}
                  className="w-full p-4 rounded-xl border border-neutral-700 hover:border-violet-500 hover:bg-neutral-800/50 transition-all text-left"
                >
                  <div className="font-medium mb-1">{tone.label}</div>
                  <div className="text-sm text-neutral-400">{tone.desc}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizardSimple.tsx:231
**Original:**
```tsx
<button
              onClick={handleSkipTone}
              className="w-full px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-600...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSkipTone}>
  Skip (defaults to Professional)
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:226
**Original:**
```tsx
<button
                onClick={onSkip}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
   ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onSkip}>
  Skip for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:232
**Original:**
```tsx
<button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-white shadow-lg sha...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext}>
  Continue
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:300
**Original:**
```tsx
<button
                onClick={() => setStep(0)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-c...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setStep(0)}>
  setStep(0)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                ← Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:306
**Original:**
```tsx
<button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 rounde...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
  Next
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:375
**Original:**
```tsx
<button
                onClick={() => setStep(1)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-c...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setStep(1)}>
  setStep(1)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                ← Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:381
**Original:**
```tsx
<button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 rounde...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
  Next
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:450
**Original:**
```tsx
<button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-c...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setStep(2)}>
  setStep(2)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                ← Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:457
**Original:**
```tsx
<button
                  onClick={handleSkipTone}
                  className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-c...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSkipTone}>
  Skip (use Professional)
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:463
**Original:**
```tsx
<button
                  onClick={handleComplete}
                  className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-white shado...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleComplete}>
  Complete Setup
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/SetupGuideContainer.tsx:95
**Original:**
```tsx
<button
              onClick={retry}
              className="text-sm font-medium text-primary hover:text-primary-hover underline"
            >
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={retry}>
  Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### components/onboarding/huntaze-onboarding/CompletionNudge.tsx:103
**Original:**
```tsx
<button
          onClick={handleDismiss}
          className="p-1.5 text-content-secondary hover:text-content-primary hover:bg-surface-muted rounded-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleDismiss} aria-label="Close" aria-hidden="true">
  <X className="w-5 h-5" aria-hidden="true" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/register/page.tsx:167
**Original:**
```tsx
<button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowPassword(!showPassword)} type="button">
  setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/register/page.tsx:204
**Original:**
```tsx
<button
            type="submit"
            className="btn-primary btn-full"
            disabled={submitting}
            aria-busy={submitting}
  ...
```

**Fixed:**
```tsx
<Button variant="primary" disabled={submitting} type="submit" aria-busy={submitting}>
  {buttonLabel}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/verify-pending/page.tsx:70
**Original:**
```tsx
<button
              onClick={() => window.location.reload()}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => window.location.reload()}>
  window.location.reload()}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              request a new one
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/login/page.tsx:128
**Original:**
```tsx
<button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowPassword(!showPassword)} type="button">
  setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/auth/login/page.tsx:157
**Original:**
```tsx
<button
            type="submit"
            className="btn-primary btn-full"
            disabled={isLoading}
            aria-busy={isLoading}
    ...
```

**Fixed:**
```tsx
<Button variant="primary" disabled={isLoading} type="submit" aria-busy={isLoading}>
  {isLoading ? 'Signing in...' : 'Sign In'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/skip-onboarding/page.tsx:61
**Original:**
```tsx
<button
            onClick={skipOnboarding}
            disabled={isLoading}
            className="px-6 py-3 bg-[var(--color-indigo)] text-white rou...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={skipOnboarding} disabled={isLoading}>
  Skip Onboarding & Go to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/schedule/page.tsx:137
**Original:**
```tsx
<button 
              onClick={create} 
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium tran...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={create}>
  Add scheduled post
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/schedule/page.tsx:170
**Original:**
```tsx
<button 
                    onClick={() => del(p.id)} 
                    className="ml-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400 ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => del(p.id)}>
  del(p.id)} 
                    className="ml-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  >
                    Delete
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans-assisted/page.tsx:57
**Original:**
```tsx
<button className="hz-button" aria-label="Notifications"><Bell className="hz-icon"/></button>
```

**Fixed:**
```tsx
<Button variant="primary" aria-label="Notifications"><Bell className="hz-icon"/></Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/mobile-setup.tsx:167
**Original:**
```tsx
<button 
              onClick={() => router.push('/dashboard')}
              className="p-2"
            >
              <X className="w-5 h-5 text-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => router.push('/dashboard')}>
  router.push('/dashboard')}
              className="p-2"
            >
              <X className="w-5 h-5 text-gray-600" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/mobile-setup.tsx:183
**Original:**
```tsx
<button 
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600"
            >
              Skip
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => router.push('/dashboard')}>
  router.push('/dashboard')}
              className="text-sm text-gray-600"
            >
              Skip
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/mobile-setup.tsx:209
**Original:**
```tsx
<button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-3 min-h-[44px] rounded-xl font-medium transi...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
  {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:192
**Original:**
```tsx
<button
                onClick={() => router.push('/home')}
                className="text-[var(--text-secondary)] hover:text-white transition-color...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => router.push('/home')}>
  router.push('/home')}
                className="text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Skip for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:198
**Original:**
```tsx
<button
                onClick={handleStep1Next}
                className="px-6 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleStep1Next}>
  Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:291
**Original:**
```tsx
<button
          onClick={onBack}
          className="text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          ← Back
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onBack}>
  ← Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:298
**Original:**
```tsx
<button
            onClick={onSkip}
            className="text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            S...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onSkip}>
  Skip for now
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:304
**Original:**
```tsx
<button
            onClick={handleSubmit}
            disabled={!username || !password}
            className="px-6 py-2 bg-gradient-to-r from-[var(-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSubmit} disabled={!username || !password}>
  Connect
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:403
**Original:**
```tsx
<button
          onClick={onBack}
          className="text-[var(--text-secondary)] hover:text-white transition-colors"
          disabled={isLoading...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={onBack} disabled={isLoading}>
  ← Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/beta-onboarding-client.tsx:410
**Original:**
```tsx
<button
          onClick={handleSubmit}
          disabled={!selectedGoal || isLoading}
          className="px-6 py-2 bg-gradient-to-r from-[var(--a...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSubmit} disabled={!selectedGoal || isLoading}>
  {isLoading ? 'Completing...' : 'Complete Setup'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/of-analytics/page.tsx:79
**Original:**
```tsx
<button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium tran...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setPeriod(p)}>
  setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/menu/page.tsx:189
**Original:**
```tsx
<button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transit...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setDarkMode(!darkMode)}>
  setDarkMode(!darkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/menu/page.tsx:207
**Original:**
```tsx
<button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={handleLogout}>
  <div className="p-2 bg-red-50 rounded-xl">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Log Out</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/manage-business/page.tsx:256
**Original:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Fixed:**
```tsx
<Button variant="primary" style={{ backgroundColor: 'var(--bg-glass)' }>
  📊 Generate Monthly Report
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/manage-business/page.tsx:259
**Original:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Fixed:**
```tsx
<Button variant="primary" style={{ backgroundColor: 'var(--bg-glass)' }>
  💸 Review Pending Payouts
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/manage-business/page.tsx:262
**Original:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Fixed:**
```tsx
<Button variant="primary" style={{ backgroundColor: 'var(--bg-glass)' }>
  📧 Send Bulk Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/manage-business/page.tsx:265
**Original:**
```tsx
<button className="w-full px-4 py-3 text-white rounded-lg transition-colors text-left hover:opacity-80" style={{ backgroundColor: 'var(--bg-glass)' }}...
```

**Fixed:**
```tsx
<Button variant="primary" style={{ backgroundColor: 'var(--bg-glass)' }>
  🔧 Adjust AI Settings
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/of-connect/DebugLogin.tsx:49
**Original:**
```tsx
<button onClick={startLogin} disabled={busy} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={startLogin} disabled={busy}>
  {busy ? 'Connecting…' : 'Connect now'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/integrations/integrations-client.tsx:90
**Original:**
```tsx
<button
              onClick={() => window.location.reload()}
              className="integrations-error-retry"
            >
              Retry
  ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => window.location.reload()}>
  window.location.reload()}
              className="integrations-error-retry"
            >
              Retry
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/home/RecentActivity.tsx:219
**Original:**
```tsx
<button
          onClick={() => setShowAll(!showAll)}
          className="load-more-button"
        >
          {showAll ? 'Show less' : `Show ${act...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowAll(!showAll)}>
  setShowAll(!showAll)}
          className="load-more-button"
        >
          {showAll ? 'Show less' : `Show ${activities.length - 5} more`}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/diagnostics/page.tsx:111
**Original:**
```tsx
<button
            onClick={startDiagnostic}
            disabled={isRunning || loading}
            className="px-4 py-2 bg-blue-600 text-white roun...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={startDiagnostic} disabled={isRunning || loading}>
  {loading ? 'Loading...' : 'Start Diagnostic'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/diagnostics/page.tsx:118
**Original:**
```tsx
<button
            onClick={stopDiagnostic}
            disabled={!isRunning || loading}
            className="px-4 py-2 bg-green-600 text-white rou...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={stopDiagnostic} disabled={!isRunning || loading}>
  Stop & Generate Report
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/diagnostics/page.tsx:125
**Original:**
```tsx
<button
            onClick={resetDiagnostic}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={resetDiagnostic} disabled={loading}>
  Reset
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:101
**Original:**
```tsx
<button 
            className="p-2 text-gray-400 hover:text-[var(--color-text-main)] transition-colors"
            title="View"
          >
        ...
```

**Fixed:**
```tsx
<Button variant="primary">
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:110
**Original:**
```tsx
<button 
            className="p-2 text-gray-400 hover:text-[var(--color-text-main)] transition-colors"
            onClick={() => onEdit(item)}
    ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => onEdit(item)}>
  onEdit(item)}
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:119
**Original:**
```tsx
<button 
            className="p-2 text-red-400 hover:text-red-600 transition-colors"
            onClick={() => onDelete(item.id)}
            disab...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => onDelete(item.id)} disabled={isDeleting}>
  onDelete(item.id)}
            disabled={isDeleting}
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:278
**Original:**
```tsx
<button 
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleCreate}>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Content
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:406
**Original:**
```tsx
<button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setSearchQuery('')}>
  setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:424
**Original:**
```tsx
<button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setDisplayCount(20); // Rese...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => {
                  setActiveTab(tab);
                  setDisplayCount(20); // Reset display count on tab change
                }>
  {
                  setActiveTab(tab);
                  setDisplayCount(20); // Reset display count on tab change
                }}
                className={[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab
                    ? 'border-[var(--color-indigo)] text-[var(--color-indigo)]'
                    : 'border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text-main)] hover:border-gray-300',
                ].join(' ')}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:473
**Original:**
```tsx
<button 
                  onClick={handleCreate}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-indigo)] ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleCreate}>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Content
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/content/page.tsx:500
**Original:**
```tsx
<button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-[var(--c...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleLoadMore}>
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More ({filteredContent.length - displayCount} remaining)
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/complete-onboarding/page.tsx:43
**Original:**
```tsx
<button
          onClick={completeOnboarding}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
     ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={completeOnboarding}>
  Complete Onboarding & Go to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/configure/page.tsx:184
**Original:**
```tsx
<button
              type="submit"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focu...
```

**Fixed:**
```tsx
<Button variant="primary" type="submit">
  <Save className="w-5 h-5" />
              Save Configuration
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/campaigns/page.tsx:382
**Original:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <Filter className="w-4 h-4" />
                Templates
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/campaigns/page.tsx:386
**Original:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <BarChart3 className="w-4 h-4" />
                Analytics
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/campaigns/page.tsx:390
**Original:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                <Plus...
```

**Fixed:**
```tsx
<Button variant="primary">
  <Plus className="w-4 h-4" />
                New Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/campaigns/page.tsx:545
**Original:**
```tsx
<button 
                onClick={() => {
                  try {
                    localStorage.setItem('first_campaign_started', '1');
           ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                  try {
                    localStorage.setItem('first_campaign_started', '1');
                    trackEvent('campaign_launch_click');
                  }>
  {
                  try {
                    localStorage.setItem('first_campaign_started', '1');
                    trackEvent('campaign_launch_click');
                  } catch {}
                  router.push('/campaigns/new');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl hover:bg-white/30 transition-colors font-medium"
              >
                <Rocket className="w-5 h-5" />
                Launch Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/billing/page.tsx:148
**Original:**
```tsx
<button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setBillingPeriod('monthly')}>
  setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly billing
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/billing/page.tsx:158
**Original:**
```tsx
<button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
        ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setBillingPeriod('yearly')}>
  setBillingPeriod('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly billing
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Save 20%</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/billing/page.tsx:259
**Original:**
```tsx
<button
            onClick={() => {/* handle checkout */}}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {/* handle checkout */} disabled={loading}>
  {/* handle checkout */}}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-xl"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
            <ArrowRight className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/chatbot/page.tsx:113
**Original:**
```tsx
<button
            onClick={startNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex it...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={startNewConversation}>
  <Plus className="w-4 h-4" />
            New Chat
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/chatbot/page.tsx:131
**Original:**
```tsx
<button
                key={conv.id}
                onClick={() => setCurrentConversation(conv.id)}
                className={`w-full text-left p-3...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setCurrentConversation(conv.id)}>
  setCurrentConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  currentConversation === conv.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-sm truncate">{conv.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {conv.lastMessage.toLocaleDateString()}
                </p>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/chatbot/page.tsx:256
**Original:**
```tsx
<button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSend} disabled={!input.trim() || isLoading} aria-label="Send message">
  <Send className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/analytics/page.tsx:218
**Original:**
```tsx
<button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`time-range-button ${
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setTimeRange(range)}>
  setTimeRange(range)}
                  className={`time-range-button ${
                    timeRange === range
                      ? 'time-range-button-active'
                      : 'time-range-button-inactive'
                  }`}
                >
                  {range === 'all' ? 'All' : range.toUpperCase()}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/blog/page.tsx:123
**Original:**
```tsx
<button
                key={index}
                className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all ${
               ...
```

**Fixed:**
```tsx
<Button variant="primary">
  {category}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/blog/page.tsx:271
**Original:**
```tsx
<button
              type="submit"
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-co...
```

**Fixed:**
```tsx
<Button variant="ghost" type="submit">
  Subscribe
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### src/app/(auth)/register/page.tsx:224
**Original:**
```tsx
<button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent round...
```

**Fixed:**
```tsx
<Button variant="primary" disabled={loading} type="submit">
  {loading ? 'Creating account...' : 'Get early access'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/smart-onboarding/analytics/page.tsx:58
**Original:**
```tsx
<button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setActiveTab(tab.id as any)}>
  setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/ppv/page.tsx:135
**Original:**
```tsx
<button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-l...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowCreateModal(true)}>
  setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create PPV
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/ppv/page.tsx:240
**Original:**
```tsx
<button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setActiveTab(tab)}>
  setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
                    {count}
                  </span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/ppv/page.tsx:373
**Original:**
```tsx
<button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowCreateModal(true)}>
  setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create PPV Campaign
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/ppv/page.tsx:467
**Original:**
```tsx
<button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rou...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setShowCreateModal(false)}>
  setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/page.tsx:285
**Original:**
```tsx
<button
                      onClick={disconnectOnlyFans}
                      className="flex items-center gap-2 px-4 py-2 border border-red-300 da...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={disconnectOnlyFans}>
  <Unlink className="w-4 h-4" />
                      Disconnect
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/page.tsx:307
**Original:**
```tsx
<button
                    onClick={connectOnlyFans}
                    disabled={connecting}
                    className="flex items-center gap-2...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={connectOnlyFans} disabled={connecting}>
  {connecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LinkIcon className="w-5 h-5" />
                    )}
                    Connect OnlyFans Account
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/page.tsx:518
**Original:**
```tsx
<button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--colo...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={saveSettings} disabled={saving}>
  {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Settings
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/messages/page.tsx:393
**Original:**
```tsx
<button
                        onClick={getAISuggestions}
                        disabled={loadingAI}
                        className="flex items-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={getAISuggestions} disabled={loadingAI}>
  {loadingAI ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        AI Suggestions
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/messages/page.tsx:416
**Original:**
```tsx
<button
                            key={suggestion.id}
                            onClick={() => useSuggestion(suggestion)}
                        ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => useSuggestion(suggestion)}>
  useSuggestion(suggestion)}
                            className="w-full text-left p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-glass-hover)] hover:border-[var(--accent-primary)] transition-all"
                          >
                            <p className="text-sm text-[var(--text-primary)]">{suggestion.content}</p>
                            <p className="text-xs text-[var(--accent-primary)] mt-1">
                              Tone: {suggestion.tone}
                            </p>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/messages/page.tsx:483
**Original:**
```tsx
<button
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sendingMessage}
                      ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={sendMessage} disabled={!messageInput.trim() || sendingMessage}>
  {sendingMessage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/fans/page.tsx:90
**Original:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <Filter className="w-4 h-4" />
          Filters
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/wizard/page.tsx:92
**Original:**
```tsx
<button
                  onClick={handleContinueAnyway}
                  className="flex-1 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleContinueAnyway}>
  Continue to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/wizard/page.tsx:98
**Original:**
```tsx
<button
                  onClick={() => setError(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neut...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setError(null)}>
  setError(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-700 hover:border-neutral-600 text-neutral-400 text-sm transition-all"
                >
                  Try Again
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/dashboard/page.tsx:148
**Original:**
```tsx
<button
                onClick={handleContinueOnboarding}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleContinueOnboarding}>
  Continue Setup
                <ArrowRight className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/dashboard/page.tsx:177
**Original:**
```tsx
<button
                    onClick={handleContinueOnboarding}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleContinueOnboarding}>
  Start Now →
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/optimize/page.tsx:220
**Original:**
```tsx
<button
              onClick={handleStartTests}
              disabled={selectedTests.length === 0}
              className="px-6 py-2 bg-blue-600 te...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleStartTests} disabled={selectedTests.length === 0}>
  Start {selectedTests.length || ''} {selectedTests.length === 1 ? 'Test' : 'Tests'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:247
**Original:**
```tsx
<button
                      key={lang.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, lang...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setFormData({ ...formData, language: lang.code } type="button">
  setFormData({ ...formData, language: lang.code })}
                      className={`language-option ${formData.language === lang.code ? 'active' : ''}`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:370
**Original:**
```tsx
<button
                      key={niche.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, niche...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setFormData({ ...formData, niche: niche.id } type="button">
  setFormData({ ...formData, niche: niche.id })}
                      className={`niche-card ${formData.niche === niche.id ? 'active' : ''} niche-${niche.color}`}
                    >
                      <div className="niche-icon">{niche.icon}</div>
                      <div className="niche-name">{niche.name}</div>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:451
**Original:**
```tsx
<button
                        key={type.id}
                        type="button"
                        onClick={() => toggleContentType(type.id)}...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => toggleContentType(type.id)} type="button">
  toggleContentType(type.id)}
                        className={`content-type-chip ${isSelected ? 'active' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{type.name}</span>
                        {isSelected && <Check className="w-4 h-4" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:558
**Original:**
```tsx
<button 
                            onClick={() => togglePlatform(platform.id)}
                            className="btn-sm btn-primary"
          ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => togglePlatform(platform.id)}>
  togglePlatform(platform.id)}
                            className="btn-sm btn-primary"
                          >
                            Connect
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:762
**Original:**
```tsx
<button
              onClick={handleComplete}
              className="btn-primary btn-lg mt-8"
            >
              <span>Go to Dashboard</sp...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleComplete}>
  <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:828
**Original:**
```tsx
<button
                  onClick={handlePrevious}
                  disabled={loading}
                  className="btn-secondary"
                >
...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handlePrevious} disabled={loading}>
  <ArrowLeft className="w-5 h-5" />
                  <span>Previous</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:936
**Original:**
```tsx
<button
          onClick={() => setBillingCycle('monthly')}
          className={billingCycle === 'monthly' ? 'active' : ''}
        >
          Mont...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setBillingCycle('monthly')}>
  setBillingCycle('monthly')}
          className={billingCycle === 'monthly' ? 'active' : ''}
        >
          Monthly
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:942
**Original:**
```tsx
<button
          onClick={() => setBillingCycle('yearly')}
          className={billingCycle === 'yearly' ? 'active' : ''}
        >
          Yearly...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setBillingCycle('yearly')}>
  setBillingCycle('yearly')}
          className={billingCycle === 'yearly' ? 'active' : ''}
        >
          Yearly
          <span className="save-badge">Save 20%</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/setup/page-new.tsx:990
**Original:**
```tsx
<button 
              className={`plan-cta ${plan.id === 'starter' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={(e) => {
             ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={(e) => {
                e.stopPropagation();
                if (plan.id === 'starter') {
                  onSkip();
                }>
  {
                e.stopPropagation();
                if (plan.id === 'starter') {
                  onSkip();
                }
              }}
            >
              {plan.cta}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onboarding/huntaze/page.tsx:151
**Original:**
```tsx
<button
                  onClick={simulateGatedAction}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primar...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={simulateGatedAction}>
  Test Guard-Rail Modal
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/calendar/page.tsx:73
**Original:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900">
          ...
```

**Fixed:**
```tsx
<Button variant="secondary">
  <Plus className="w-5 h-5" />
            Schedule Content
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/calendar/page.tsx:87
**Original:**
```tsx
<button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
        ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={previousMonth}>
  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/calendar/page.tsx:93
**Original:**
```tsx
<button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-60...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setCurrentDate(new Date())}>
  setCurrentDate(new Date())}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Today
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/calendar/page.tsx:99
**Original:**
```tsx
<button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
            ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={nextMonth}>
  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/of-connect/cookies/page.tsx:46
**Original:**
```tsx
<button type="submit" disabled={loading}>
            {loading ? 'Envoi…' : 'Déposer'}
          </button>
```

**Fixed:**
```tsx
<Button variant="primary" disabled={loading} type="submit">
  {loading ? 'Envoi…' : 'Déposer'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/billing/packs/MessagePacksClient.tsx:73
**Original:**
```tsx
<button
              onClick={() => handleCheckout(p.key as any)}
              className="mt-4 w-full rounded-md bg-[var(--color-indigo)] px-4 py-2 ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleCheckout(p.key as any)} disabled>
  handleCheckout(p.key as any)}
              className="mt-4 w-full rounded-md bg-[var(--color-indigo)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading === p.key}
            >
              {loading === p.key ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Buy pack'
              )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/analytics/pricing/page.tsx:211
**Original:**
```tsx
<button
                  onClick={() => setShowToast(false)}
                  className="text-white hover:text-gray-200"
                >
         ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowToast(false)}>
  setShowToast(false)}
                  className="text-white hover:text-gray-200"
                >
                  ×
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/analytics/upsells/page.tsx:80
**Original:**
```tsx
<button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowSettings(!showSettings)}>
  setShowSettings(!showSettings)}
              className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              {showSettings ? 'Hide' : 'Show'} Settings
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/analytics/churn/page.tsx:114
**Original:**
```tsx
<button
                key={level}
                onClick={() => setSelectedRiskLevel(level)}
                className={`px-4 py-2 rounded-lg text-...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setSelectedRiskLevel(level)}>
  setSelectedRiskLevel(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRiskLevel === level
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)} {level !== 'all' && 'Risk'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/analytics/churn/page.tsx:128
**Original:**
```tsx
<button
              onClick={handleBulkReEngage}
              disabled={isReEngaging}
              className="px-4 py-2 bg-purple-600 text-white r...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleBulkReEngage} disabled={isReEngaging}>
  {isReEngaging ? 'Sending...' : `Re-engage ${selectedFans.length} Selected`}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/page.tsx:82
**Original:**
```tsx
<button
            disabled
            className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
      ...
```

**Fixed:**
```tsx
<Button variant="secondary" disabled>
  Connect via Instagram first
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/page.tsx:104
**Original:**
```tsx
<button onClick={joinOFWaitlist} disabled={loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opa...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={joinOFWaitlist} disabled={loading}>
  {loading ? 'Joining…' : 'Join OF API Waitlist'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/onlyfans-placeholder.tsx:56
**Original:**
```tsx
<button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm fo...
```

**Fixed:**
```tsx
<Button variant="primary" type="submit">
  Notify Me
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/creator/messages/page.tsx:32
**Original:**
```tsx
<button
              className="mt-3 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
       ...
```

**Fixed:**
```tsx
<Button variant="primary">
  <Send className="w-4 h-4" />
              Send
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:109
**Original:**
```tsx
<button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justif...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setActiveTab(tab.id as any)}>
  setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:139
**Original:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 ...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:142
**Original:**
```tsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 ...
```

**Fixed:**
```tsx
<Button variant="ghost">
  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:185
**Original:**
```tsx
<button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full flex items-center justify-center gap-2 py...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setShowScheduleModal(true)}>
  setShowScheduleModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Schedule New Content
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:358
**Original:**
```tsx
<button
                  onClick={() => setAiSuggestions(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-p...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setAiSuggestions(true)}>
  setAiSuggestions(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate AI Schedule
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:400
**Original:**
```tsx
<button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                            <Check className="w-4 h-4 text-green-600 dark:te...
```

**Fixed:**
```tsx
<Button variant="secondary">
  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:481
**Original:**
```tsx
<button
                        key={platform}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bor...
```

**Fixed:**
```tsx
<Button variant="secondary">
  <PlatformIcon platform={platform} className="w-5 h-5" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/features/content-scheduler/page.tsx:502
**Original:**
```tsx
<button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => setShowScheduleModal(false)}>
  setShowScheduleModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/ai/assistant/AssistantClient.tsx:309
**Original:**
```tsx
<button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSend} disabled={!input.trim() || isLoading}>
  {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/api/onboarding/complete/example-usage.tsx:180
**Original:**
```tsx
<button onClick={handleComplete} disabled={loading}>
            {loading ? 'Completing...' : 'Complete'}
          </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleComplete} disabled={loading}>
  {loading ? 'Completing...' : 'Complete'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/api/onboarding/complete/example-usage.tsx:238
**Original:**
```tsx
<button onClick={handleComplete} disabled={loading}>
        {loading ? 'Loading...' : 'Complete Onboarding'}
      </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleComplete} disabled={loading}>
  {loading ? 'Loading...' : 'Complete Onboarding'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/api/onboarding/complete/example-usage.tsx:298
**Original:**
```tsx
<button onClick={handleComplete} disabled={loading}>
        Complete Onboarding
      </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleComplete} disabled={loading}>
  Complete Onboarding
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/api/onboarding/complete/example-usage.tsx:344
**Original:**
```tsx
<button onClick={handleSubmit} disabled={loading}>
        {loading ? `Completing... (Attempt ${retryCount + 1})` : 'Complete'}
      </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleSubmit} disabled={loading}>
  {loading ? `Completing... (Attempt ${retryCount + 1})` : 'Complete'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/api/onboarding/complete/example-usage.tsx:395
**Original:**
```tsx
<button onClick={() => handleSubmit({ contentTypes: ['photos'] })} disabled={loading}>
        Submit
      </button>
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleSubmit({ contentTypes: ['photos'] } disabled={loading}>
  handleSubmit({ contentTypes: ['photos'] })} disabled={loading}>
        Submit
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/api/monitoring/metrics/example-component.tsx:88
**Original:**
```tsx
<button
            onClick={refresh}
            disabled={isRefreshing}
            className="btn-refresh"
          >
            <RefreshCw class...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={refresh} disabled={isRefreshing}>
  <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:135
**Original:**
```tsx
<button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-l...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowCreateModal(true)}>
  setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Template
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:201
**Original:**
```tsx
<button
            onClick={() => setAutomationEnabled(!automationEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounde...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setAutomationEnabled(!automationEnabled)}>
  setAutomationEnabled(!automationEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              automationEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                automationEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:284
**Original:**
```tsx
<button
                        onClick={() => handleToggleTemplate(template.id)}
                        className={`p-2 rounded-lg transition-colors...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleToggleTemplate(template.id)}>
  handleToggleTemplate(template.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          template.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                        title={template.isActive ? 'Pause' : 'Activate'}
                      >
                        {template.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:295
**Original:**
```tsx
<button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModa...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }>
  {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:305
**Original:**
```tsx
<button
                        onClick={() => handleTestSend(template)}
                        className="p-2 bg-purple-100 text-purple-700 rounded-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => handleTestSend(template)}>
  handleTestSend(template)}
                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition-colors"
                        title="Test Send"
                      >
                        <Send className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:312
**Original:**
```tsx
<button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowCreateModal(...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => {
                          setEditingTemplate(template);
                          setShowCreateModal(true);
                        }>
  {
                          setEditingTemplate(template);
                          setShowCreateModal(true);
                        }}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:322
**Original:**
```tsx
<button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-2 bg-gray-100 text-gray-700 rou...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleDuplicateTemplate(template)}>
  handleDuplicateTemplate(template)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:329
**Original:**
```tsx
<button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 bg-red-100 text-red-700 round...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => handleDeleteTemplate(template.id)}>
  handleDeleteTemplate(template.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:352
**Original:**
```tsx
<button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setShowCreateModal(true)}>
  setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Template
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:440
**Original:**
```tsx
<button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }}
 ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }>
  {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:478
**Original:**
```tsx
<button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedTemplate(null);
                }}...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedTemplate(null);
                }>
  {
                  setShowPreviewModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/settings/welcome/page.tsx:487
**Original:**
```tsx
<button
                onClick={() => handleTestSend(selectedTemplate)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => handleTestSend(selectedTemplate)}>
  handleTestSend(selectedTemplate)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors"
              >
                Send Test
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/social/tiktok/upload/page.tsx:122
**Original:**
```tsx
<button
                    onClick={() => setVideoFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
               ...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={() => setVideoFile(null)}>
  setVideoFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/fans/[id]/page.tsx:61
**Original:**
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <MessageSquare className="w-4 h...
```

**Fixed:**
```tsx
<Button variant="primary">
  <MessageSquare className="w-4 h-4" />
            Send Message
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/messages/mass/page.tsx:232
**Original:**
```tsx
<button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setActiveTab(tab)}>
  setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'scheduled' && scheduledMessages.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {scheduledMessages.length}
                  </span>
                )}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/messages/mass/page.tsx:419
**Original:**
```tsx
<button
                      onClick={() => {
                        setMessageText('');
                        setScheduleDate('');
              ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={() => {
                        setMessageText('');
                        setScheduleDate('');
                        setScheduleTime('');
                        setIsRecurring(false);
                      }>
  {
                        setMessageText('');
                        setScheduleDate('');
                        setScheduleTime('');
                        setIsRecurring(false);
                      }}
                      className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/onlyfans/messages/mass/page.tsx:430
**Original:**
```tsx
<button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || !selectedAudience}
                  ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleSendMessage} disabled={!messageText.trim() || !selectedAudience}>
  <Send className="w-5 h-5" />
                      {scheduleDate && scheduleTime ? 'Schedule Message' : 'Send Now'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/campaigns/new/page.tsx:274
**Original:**
```tsx
<button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isCreating}
            className="flex ite...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={(e) => handleSubmit(e, true)} disabled={isCreating} type="button">
  handleSubmit(e, true)}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save as Draft
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/campaigns/new/page.tsx:283
**Original:**
```tsx
<button
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white ro...
```

**Fixed:**
```tsx
<Button variant="secondary" disabled={isCreating} type="submit">
  <Send className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Create Campaign'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/campaigns/[id]/page.tsx:153
**Original:**
```tsx
<button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="flex items-center gap-2 px-4 py-2 bg-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={handleLaunch} disabled={isLaunching}>
  <Play className="w-4 h-4" />
                {isLaunching ? 'Launching...' : 'Launch'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/campaigns/[id]/page.tsx:162
**Original:**
```tsx
<button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={handleDuplicate}>
  <Copy className="w-4 h-4" />
              Duplicate
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(app)/marketing/campaigns/[id]/page.tsx:169
**Original:**
```tsx
<button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 border bor...
```

**Fixed:**
```tsx
<Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
  <Trash2 className="w-4 h-4" />
              Delete
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/onlyfans/analytics/page.tsx:179
**Original:**
```tsx
<button 
              onClick={exportData}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center ga...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={exportData}>
  <Download className="w-4 h-4" />
              Exporter CSV
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/onlyfans/analytics/page.tsx:243
**Original:**
```tsx
<button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveTab('overview')}>
  setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Vue d'ensemble
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/onlyfans/analytics/page.tsx:249
**Original:**
```tsx
<button
              onClick={() => setActiveTab('fans')}
              className={`px-4 py-2 font-medium ${activeTab === 'fans' ? 'border-b-2 border...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => setActiveTab('fans')}>
  setActiveTab('fans')}
              className={`px-4 py-2 font-medium ${activeTab === 'fans' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Top Fans
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/import/onlyfans/page.tsx:118
**Original:**
```tsx
<button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium"
         ...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setStep(2)}>
  setStep(2)}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-medium"
                >
                  Continue
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/import/onlyfans/page.tsx:154
**Original:**
```tsx
<button
                onClick={doImport}
                disabled={importing}
                className="w-full py-3 bg-purple-600 text-white rounde...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={doImport} disabled={importing}>
  {importing ? 'Importing…' : 'Start Import'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/reddit/page.tsx:88
**Original:**
```tsx
<button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => router.push('/dashboard')}>
  router.push('/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
                >
                  Go to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/reddit/page.tsx:94
**Original:**
```tsx
<button
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:b...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleDisconnect}>
  Disconnect
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/tiktok/page.tsx:107
**Original:**
```tsx
<button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibol...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => router.push('/dashboard')}>
  router.push('/dashboard')}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Go to Dashboard
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/tiktok/page.tsx:113
**Original:**
```tsx
<button
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:b...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={handleDisconnect}>
  Disconnect
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/connect/onlyfans/page.tsx:116
**Original:**
```tsx
<button
                disabled={waitlistLoading}
                onClick={async () => {
                  try {
                    setNotice('');
 ...
```

**Fixed:**
```tsx
<Button variant="ghost" onClick={async () => {
                  try {
                    setNotice('');
                    setError('');
                    setWaitlistLoading(true);
                    await fetch('/api/waitlist/onlyfans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' } disabled={waitlistLoading}>
  {
                  try {
                    setNotice('');
                    setError('');
                    setWaitlistLoading(true);
                    await fetch('/api/waitlist/onlyfans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    });
                    setNotice('Added to OnlyFans API waitlist. We will contact you.');
                  } catch (e: any) {
                    setError(e?.message || 'Failed to join waitlist.');
                  } finally {
                    setWaitlistLoading(false);
                  }
                }}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {waitlistLoading ? 'Joining…' : 'Join API Waitlist'}
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/tiktok/upload/page.tsx:258
**Original:**
```tsx
<button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center justify-center px-4...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setMode('url')} type="button">
  setMode('url')}
                className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg transition-colors ${
                  mode === 'url'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">From URL</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/tiktok/upload/page.tsx:270
**Original:**
```tsx
<button
                type="button"
                onClick={() => setMode('file')}
                className={`flex items-center justify-center px-...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => setMode('file')} type="button">
  setMode('file')}
                className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg transition-colors ${
                  mode === 'file'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                <span className="font-medium">Upload File</span>
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/reddit/publish/page.tsx:93
**Original:**
```tsx
<button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
       ...
```

**Fixed:**
```tsx
<Button variant="primary" onClick={() => router.back()}>
  router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
</Button>
```

⚠️ **Please review** - Medium confidence migration

---

### app/(marketing)/platforms/reddit/publish/page.tsx:308
**Original:**
```tsx
<button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-l...
```

**Fixed:**
```tsx
<Button variant="secondary" onClick={() => router.back()} type="button">
  router.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
</Button>
```

⚠️ **Please review** - Medium confidence migration

---


## Manual Review Required (52)

### hooks/useAccessibilityValidation.ts:125
**Current Code:**
```tsx
<button ref={ref}>Click me</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/theme-toggle.tsx:20
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
     ...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/theme-toggle.tsx:111
**Current Code:**
```tsx
<button
      onClick={toggleTheme}
      className="relative w-14 h-7 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-colors"
      aria-lab...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/theme-toggle-enhanced.tsx:35
**Current Code:**
```tsx
<button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:ho...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/faq-section.tsx:76
**Current Code:**
```tsx
<button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:b...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/app-sidebar.tsx:204
**Current Code:**
```tsx
<button
            onClick={() => toggleExpanded(item.label)}
            className={`nav-item w-full text-left ${depth > 0 ? 'pl-8' : ''}`}
        ...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/ui/export-all.tsx:47
**Current Code:**
```tsx
<button className={`px-4 py-2 rounded-md ${variantClasses} ${className}`} {...props}>{children}</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/ui/export-all.tsx:56
**Current Code:**
```tsx
<button className="border rounded px-2 py-1 w-full text-left" {...props}>{children}</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/ui/export-all.tsx:63
**Current Code:**
```tsx
<button className={`px-4 py-2 ${className}`} {...props}>{children}</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/onboarding/GoalSelection.tsx:84
**Current Code:**
```tsx
<button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-6 rounded-lg border-2 text-left transition...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/content/PlatformPreview.tsx:211
**Current Code:**
```tsx
<button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-4 py-2 rounded-lg text-s...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/ui/export-all.tsx:26
**Current Code:**
```tsx
<button className={`px-4 py-2 rounded-md ${variantClasses} ${className}`} {...props}>{children}</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/ui/export-all.tsx:35
**Current Code:**
```tsx
<button className="border rounded px-2 py-1 w-full text-left" {...props}>{children}</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/ui/export-all.tsx:42
**Current Code:**
```tsx
<button className={`px-4 py-2 ${className}`} {...props}>{children}</button>
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### src/components/of/inbox.tsx:75
**Current Code:**
```tsx
<button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className="w-full p-4...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/revenue/upsell/UpsellOpportunity.tsx:185
**Current Code:**
```tsx
<button
          onClick={handleSend}
          disabled={isSending || loading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white ...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/revenue/upsell/UpsellAutomationSettings.tsx:244
**Current Code:**
```tsx
<button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blu...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/revenue/payout/PayoutTimeline.tsx:101
**Current Code:**
```tsx
<button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 ro...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/revenue/churn/ChurnRiskList.tsx:244
**Current Code:**
```tsx
<button
                  onClick={() => handleReEngage(fan.id)}
                  disabled={engagingFans.has(fan.id)}
                  className="fl...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/revenue/forecast/GoalAchievement.tsx:115
**Current Code:**
```tsx
<button
                  onClick={() => setExpandedRec(expandedRec === index ? null : index)}
                  className="w-full px-4 py-3 flex item...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:262
**Current Code:**
```tsx
<button
                      type="button"
                      onClick={() => handleSelect('platform', platform.id)}
                      classNam...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/onboarding/huntaze-onboarding/SetupWizard.tsx:337
**Current Code:**
```tsx
<button
                      type="button"
                      onClick={() => handleSelect('primary_goal', goal.id)}
                      classNam...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### components/onboarding/huntaze-onboarding/GuardRailModal.tsx:157
**Current Code:**
```tsx
<button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 text-content-secondary hover:text-content-prim...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/why-huntaze/page.tsx:102
**Current Code:**
```tsx
<button
                key={index}
                onClick={() => setActiveWidget(index)}
                className={`w-full text-left p-6 rounded-xl...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(app)/onlyfans/messages/page.tsx:321
**Current Code:**
```tsx
<button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 b...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(app)/onlyfans/fans/page.tsx:59
**Current Code:**
```tsx
<button
              key={segment.value}
              onClick={() => setSelectedSegment(segment.value as FanSegment)}
              className={`p-4 ...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

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

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(app)/onboarding/setup/page-new.tsx:641
**Current Code:**
```tsx
<button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, respo...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(app)/onboarding/setup/page-new.tsx:838
**Current Code:**
```tsx
<button
                onClick={handleNext}
                disabled={loading || (currentStep === 'profile' && !formData.gdprConsent)}
              ...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/features/content-scheduler/page.tsx:165
**Current Code:**
```tsx
<button
                        key={i}
                        className={`aspect-square p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:b...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/ai/assistant/AssistantClient.tsx:240
**Current Code:**
```tsx
<button
                    key={idx}
                    onClick={() => executeQuickAction(action.agentKey, action.action, action.params)}
          ...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(app)/onlyfans/messages/mass/page.tsx:260
**Current Code:**
```tsx
<button
                      key={audience.id}
                      onClick={() => setSelectedAudience(audience.id)}
                      className...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(app)/onlyfans/messages/mass/page.tsx:286
**Current Code:**
```tsx
<button
                      key={template.id}
                      onClick={() => setMessageText(template.text)}
                      className="p...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/platforms/connect/reddit/page.tsx:154
**Current Code:**
```tsx
<button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/platforms/connect/tiktok/page.tsx:173
**Current Code:**
```tsx
<button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 bg-black text-white rou...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/platforms/reddit/publish/page.tsx:144
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setKind('link')}
                className={`p-4 border-2 rounded-lg transition-a...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/platforms/reddit/publish/page.tsx:161
**Current Code:**
```tsx
<button
                type="button"
                onClick={() => setKind('self')}
                className={`p-4 border-2 rounded-lg transition-a...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---

### app/(marketing)/platforms/reddit/publish/page.tsx:291
**Current Code:**
```tsx
<button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-6...
```

**Reason:** Complex pattern - requires manual review

**Migration Instructions:**
1. Import Button: `import { Button } from "@/components/ui/button"`
2. Replace `<button>` with `<Button>`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---


## Next Steps

1. Review medium confidence migrations
2. Manually migrate low confidence cases
3. Run tests: `npm run test -- tests/unit/properties/button-component-usage.property.test.ts --run`
4. Check for visual regressions
