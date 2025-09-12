// Application state
let currentSection = 'application';
let currentOnboardingStep = 1;
let selectedProfile = null;
let selectedGoals = [];
let isYearlyPricing = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializePricing();
    initializeOnboarding();
    initializeDashboard();
    addSmoothTransitions();
});

// Navigation between sections
function initializeNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const flowSections = document.querySelectorAll('.flow-section');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            switchSection(targetSection);
        });
    });
}

function switchSection(sectionName) {
    const navTabs = document.querySelectorAll('.nav-tab');
    const flowSections = document.querySelectorAll('.flow-section');
    
    // Update nav tabs
    navTabs.forEach(tab => tab.classList.remove('active'));
    const targetTab = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Update sections
    flowSections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // Reset onboarding if switching away
    if (sectionName !== 'onboarding') {
        resetOnboarding();
    }
}

// Pricing functionality
function initializePricing() {
    const yearlyToggle = document.getElementById('yearlyToggle');
    if (yearlyToggle) {
        yearlyToggle.addEventListener('change', function() {
            isYearlyPricing = this.checked;
            updatePricingDisplay();
        });
    }
    
    // Add pricing plan button handlers
    const pricingButtons = document.querySelectorAll('.pricing-card .btn');
    pricingButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const planName = this.closest('.pricing-card').querySelector('.plan-header h3').textContent;
            const originalText = this.textContent;
            
            // Simulate plan selection
            this.textContent = `✓ ${planName} sélectionné`;
            this.classList.remove('btn--primary', 'btn--outline');
            this.classList.add('btn--secondary');
            
            setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('btn--secondary');
                if (originalText.includes('Commencer')) {
                    this.classList.add('btn--primary');
                } else {
                    this.classList.add('btn--outline');
                }
            }, 2000);
        });
    });
}

function updatePricingDisplay() {
    const monthlyPrices = document.querySelectorAll('.price-amount.monthly');
    const yearlyPrices = document.querySelectorAll('.price-amount.yearly');
    
    if (isYearlyPricing) {
        monthlyPrices.forEach(price => price.classList.add('hidden'));
        yearlyPrices.forEach(price => price.classList.remove('hidden'));
    } else {
        monthlyPrices.forEach(price => price.classList.remove('hidden'));
        yearlyPrices.forEach(price => price.classList.add('hidden'));
    }
}

// Onboarding functionality
function initializeOnboarding() {
    const profileOptions = document.querySelectorAll('.profile-option');
    const goalOptions = document.querySelectorAll('.goal-option');
    const navBackBtn = document.querySelector('.nav-back');
    const navNextBtn = document.querySelector('.nav-next');
    
    // Profile selection
    profileOptions.forEach(option => {
        option.addEventListener('click', function() {
            profileOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedProfile = this.dataset.profile;
            showContinueButton(2);
        });
    });
    
    // Goal selection
    goalOptions.forEach(option => {
        option.addEventListener('click', function() {
            const goal = this.dataset.goal;
            
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                selectedGoals = selectedGoals.filter(g => g !== goal);
            } else {
                this.classList.add('selected');
                selectedGoals.push(goal);
            }
            
            if (selectedGoals.length > 0) {
                showContinueButton(4);
            } else {
                hideContinueButton(4);
            }
        });
    });
    
    // Integration buttons
    const integrationButtons = document.querySelectorAll('.integration-item .btn');
    integrationButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.textContent === 'Connecter') {
                this.textContent = 'Connecté';
                this.classList.remove('btn--primary', 'btn--outline');
                this.classList.add('btn--secondary');
                
                // Show continue button if OnlyFans is connected
                const integrationItem = this.closest('.integration-item');
                if (integrationItem.classList.contains('required')) {
                    showContinueButton(3);
                }
            }
        });
    });
    
    // Step navigation
    const continueButtons = document.querySelectorAll('.continue-btn');
    continueButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            nextOnboardingStep();
        });
    });
    
    // Welcome step button
    const welcomeBtn = document.querySelector('[data-step="1"] .btn--primary');
    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', function() {
            nextOnboardingStep();
        });
    }
    
    // Final step button
    const finalBtn = document.querySelector('[data-step="5"] .btn--primary');
    if (finalBtn) {
        finalBtn.addEventListener('click', function() {
            switchSection('application');
        });
    }
    
    // Navigation buttons
    if (navBackBtn) {
        navBackBtn.addEventListener('click', function() {
            previousOnboardingStep();
        });
    }
    
    if (navNextBtn) {
        navNextBtn.addEventListener('click', function() {
            nextOnboardingStep();
        });
    }
}

function showContinueButton(step) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (stepElement) {
        const continueBtn = stepElement.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.classList.remove('hidden');
            continueBtn.style.display = 'inline-flex';
        }
    }
}

function hideContinueButton(step) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (stepElement) {
        const continueBtn = stepElement.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.classList.add('hidden');
            continueBtn.style.display = 'none';
        }
    }
}

function nextOnboardingStep() {
    if (currentOnboardingStep < 5) {
        currentOnboardingStep++;
        updateOnboardingStep();
    }
}

function previousOnboardingStep() {
    if (currentOnboardingStep > 1) {
        currentOnboardingStep--;
        updateOnboardingStep();
    }
}

function updateOnboardingStep() {
    const onboardingSteps = document.querySelectorAll('.onboarding-step');
    const progressFill = document.querySelector('.progress-fill');
    const progressSteps = document.querySelectorAll('.progress-steps .step');
    const navBackBtn = document.querySelector('.nav-back');
    const navNextBtn = document.querySelector('.nav-next');
    
    // Update step display
    onboardingSteps.forEach((step, index) => {
        if (index + 1 === currentOnboardingStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Update progress bar
    const progressPercentage = (currentOnboardingStep / 5) * 100;
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Update progress steps
    progressSteps.forEach((step, index) => {
        if (index + 1 <= currentOnboardingStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Update navigation buttons
    if (navBackBtn) {
        if (currentOnboardingStep === 1) {
            navBackBtn.classList.add('hidden');
        } else {
            navBackBtn.classList.remove('hidden');
        }
    }
    
    if (navNextBtn) {
        if (currentOnboardingStep === 5) {
            navNextBtn.classList.add('hidden');
        } else {
            navNextBtn.classList.remove('hidden');
        }
    }
    
    // Hide continue buttons by default for steps that need selection
    if (currentOnboardingStep === 2) {
        hideContinueButton(2);
    }
    if (currentOnboardingStep === 3) {
        hideContinueButton(3);
    }
    if (currentOnboardingStep === 4) {
        hideContinueButton(4);
    }
}

function resetOnboarding() {
    currentOnboardingStep = 1;
    selectedProfile = null;
    selectedGoals = [];
    
    // Reset UI
    updateOnboardingStep();
    
    const profileOptions = document.querySelectorAll('.profile-option');
    const goalOptions = document.querySelectorAll('.goal-option');
    
    profileOptions.forEach(opt => opt.classList.remove('selected'));
    goalOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Reset integration buttons
    const integrationButtons = document.querySelectorAll('.integration-item .btn');
    integrationButtons.forEach(btn => {
        if (btn.textContent === 'Connecté') {
            btn.textContent = 'Connecter';
            btn.classList.remove('btn--secondary');
            
            const integrationItem = btn.closest('.integration-item');
            if (integrationItem && integrationItem.classList.contains('required')) {
                btn.classList.add('btn--primary');
            } else {
                btn.classList.add('btn--outline');
            }
        }
    });
}

// Dashboard functionality
function initializeDashboard() {
    // Add hover effects to metric cards
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add click handlers to feature cards
    const featureButtons = document.querySelectorAll('.feature-card .btn');
    featureButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Simple feedback animation
            const originalText = this.textContent;
            this.textContent = '✓ Ouvert';
            this.classList.remove('btn--primary');
            this.classList.add('btn--secondary');
            
            setTimeout(() => {
                this.textContent = originalText;
                this.classList.remove('btn--secondary');
                this.classList.add('btn--primary');
            }, 1500);
        });
    });
    
    // Add click handlers to sidebar nav items
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
    sidebarNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            sidebarNavItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Notification button
    const notificationBtn = document.querySelector('.header-actions .btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Simple notification feedback
            const icon = this.querySelector('span');
            if (icon) {
                icon.textContent = '🔴';
                setTimeout(() => {
                    icon.textContent = '🔔';
                }, 1000);
            }
        });
    }
}

// Smooth scrolling and animations
function addSmoothTransitions() {
    // Add transition classes to elements that need smooth animations
    const animatedElements = document.querySelectorAll('.card, .pricing-card, .feature-card, .metric-card');
    
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Navigate between main sections with Alt + Number keys
    if (e.altKey) {
        switch(e.key) {
            case '1':
                switchSection('application');
                break;
            case '2':
                switchSection('pricing');
                break;
            case '3':
                switchSection('onboarding');
                break;
        }
    }
    
    // Navigate onboarding with arrow keys
    if (currentSection === 'onboarding') {
        if (e.key === 'ArrowRight' && currentOnboardingStep < 5) {
            nextOnboardingStep();
        } else if (e.key === 'ArrowLeft' && currentOnboardingStep > 1) {
            previousOnboardingStep();
        }
    }
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;
    
    if (currentSection === 'onboarding') {
        if (swipeDistance > swipeThreshold && currentOnboardingStep > 1) {
            previousOnboardingStep();
        } else if (swipeDistance < -swipeThreshold && currentOnboardingStep < 5) {
            nextOnboardingStep();
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for potential external use
window.HuntazeApp = {
    switchSection,
    nextOnboardingStep,
    previousOnboardingStep,
    resetOnboarding
};