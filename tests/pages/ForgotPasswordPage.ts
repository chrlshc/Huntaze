import { Page, Locator } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  
  // Email step elements
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly backToLoginLink: Locator;
  
  // Code step elements
  readonly codeInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordButton: Locator;
  readonly resendCodeButton: Locator;
  readonly backToEmailButton: Locator;
  
  // Common elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Email step
    this.emailInput = page.getByLabel('Email Address');
    this.sendCodeButton = page.getByRole('button', { name: /send reset code/i });
    this.backToLoginLink = page.getByRole('link', { name: /back to login/i });
    
    // Code step
    this.codeInput = page.getByLabel('Verification Code');
    this.newPasswordInput = page.getByLabel('New Password');
    this.confirmPasswordInput = page.getByLabel('Confirm New Password');
    this.resetPasswordButton = page.getByRole('button', { name: /reset password/i });
    this.resendCodeButton = page.getByRole('button', { name: /resend code/i });
    this.backToEmailButton = page.getByRole('button', { name: /back to email/i });
    
    // Messages
    this.errorMessage = page.locator('.text-red-500, .text-red-700, .text-red-400');
    this.successMessage = page.locator('.text-green-500, .text-green-700, .text-green-400');
  }
  
  async goto() {
    await this.page.goto('/auth/forgot-password');
  }
  
  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email);
    await this.sendCodeButton.click();
  }
  
  async submitResetCode(code: string, newPassword: string) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.resetPasswordButton.click();
  }
  
  async resendCode() {
    await this.resendCodeButton.click();
  }
  
  async goBackToEmail() {
    await this.backToEmailButton.click();
  }
  
  async expectError(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    const errorText = await this.errorMessage.textContent();
    return errorText?.includes(message);
  }
  
  async expectSuccess(message: string) {
    await this.successMessage.waitFor({ state: 'visible' });
    const successText = await this.successMessage.textContent();
    return successText?.includes(message);
  }
}