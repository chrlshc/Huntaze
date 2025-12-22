/**
 * Button ARIA Labels
 * 
 * Standardized ARIA labels for icon buttons and actions across dashboard views.
 * Ensures consistent, descriptive labels for screen readers.
 */

export const BUTTON_ARIA_LABELS = {
  // Search and filter actions
  searchFans: 'Search fans',
  filterFans: 'Filter fans',
  clearFilters: 'Clear all filters',
  searchMessages: 'Search messages',
  searchContent: 'Search content',
  
  // Create actions
  createNewRule: 'Create new smart rule',
  createNewMessage: 'Create new message',
  createNewPPV: 'Create new PPV content',
  createNewCampaign: 'Create new campaign',
  
  // Edit and delete actions
  editItem: 'Edit item',
  deleteItem: 'Delete item',
  duplicateItem: 'Duplicate item',
  
  // Navigation actions
  viewDetails: 'View details',
  goBack: 'Go back',
  closeModal: 'Close modal',
  openMenu: 'Open menu',
  
  // Refresh and sync actions
  refreshData: 'Refresh data',
  syncData: 'Sync data',
  
  // Settings actions
  openSettings: 'Open settings',
  saveSettings: 'Save settings',
  
  // AI actions
  getAISuggestion: 'Get AI suggestion',
  generateWithAI: 'Generate with AI',
  aiPriceSuggestion: 'Get AI price suggestion',
  aiSegmentation: 'AI fan segmentation',
  
  // Message actions
  sendMessage: 'Send message',
  replyToMessage: 'Reply to message',
  
  // Fan actions
  messageFan: 'Message fan',
  viewFanProfile: 'View fan profile',
  
  // Content actions
  previewContent: 'Preview content',
  publishContent: 'Publish content',
  scheduleContent: 'Schedule content',
} as const;

/**
 * Get ARIA label for icon-only button
 */
export function getButtonAriaLabel(action: keyof typeof BUTTON_ARIA_LABELS): string {
  return BUTTON_ARIA_LABELS[action];
}

/**
 * Button accessibility props helper
 */
export function getButtonA11yProps(
  action: keyof typeof BUTTON_ARIA_LABELS,
  additionalProps?: {
    disabled?: boolean;
    pressed?: boolean;
    expanded?: boolean;
  }
) {
  return {
    'aria-label': BUTTON_ARIA_LABELS[action],
    ...(additionalProps?.disabled && { 'aria-disabled': true }),
    ...(additionalProps?.pressed !== undefined && { 'aria-pressed': additionalProps.pressed }),
    ...(additionalProps?.expanded !== undefined && { 'aria-expanded': additionalProps.expanded }),
  };
}

/**
 * Form input accessibility props helper
 */
export function getInputA11yProps(
  id: string,
  label: string,
  options?: {
    required?: boolean;
    invalid?: boolean;
    errorId?: string;
    describedBy?: string;
  }
) {
  return {
    id,
    'aria-label': label,
    ...(options?.required && { 'aria-required': true }),
    ...(options?.invalid && { 'aria-invalid': true }),
    ...(options?.errorId && { 'aria-describedby': options.errorId }),
    ...(options?.describedBy && { 'aria-describedby': options.describedBy }),
  };
}
