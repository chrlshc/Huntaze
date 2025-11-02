'use client';

import { useState } from 'react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '@/components/forms/FormInput';
import { TouchTarget } from '@/components/ui/TouchTarget';

export default function MobileFormsDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    amount: '',
    message: '',
    country: '',
    newsletter: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    alert('Form submitted successfully!');
    setErrors({});
  };

  const countryOptions = [
    { value: '', label: 'Select a country' },
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mobile-Optimized Forms
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Forms with proper inputMode, autoComplete, and touch-friendly sizing
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Contact Information
          </h2>

          <FormInput
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="name"
            error={errors.name}
            required
          />

          <FormInput
            label="Email Address"
            type="email"
            inputMode="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            autoComplete="email"
            error={errors.email}
            helperText="We'll never share your email"
            required
          />

          <FormInput
            label="Phone Number"
            type="tel"
            inputMode="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            autoComplete="tel"
            error={errors.phone}
            required
          />

          <FormInput
            label="Website"
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            autoComplete="url"
            helperText="Optional: Your personal or business website"
          />

          <FormInput
            label="Amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            helperText="Enter a numeric value"
          />

          <FormSelect
            label="Country"
            options={countryOptions}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            autoComplete="country"
          />

          <FormTextarea
            label="Message"
            rows={4}
            placeholder="Tell us more about your inquiry..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            helperText="Maximum 500 characters"
          />

          <FormCheckbox
            label="Subscribe to newsletter"
            checked={formData.newsletter}
            onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
            helperText="Receive updates and special offers"
          />

          <div className="flex gap-3 mt-6">
            <TouchTarget
              type="submit"
              variant="primary"
              fullWidth
            >
              Submit Form
            </TouchTarget>
            <TouchTarget
              type="button"
              variant="ghost"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  website: '',
                  amount: '',
                  message: '',
                  country: '',
                  newsletter: false,
                });
                setErrors({});
              }}
            >
              Reset
            </TouchTarget>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Input Mode
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Optimized keyboards for email, phone, URL, and numeric inputs
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              AutoComplete
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browser autofill support for faster form completion
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Touch Targets
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              48px minimum height for all inputs and buttons
            </p>
          </div>

          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Spacing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              16px spacing between fields for better readability
            </p>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Mobile Form Optimization
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>inputMode Attributes:</strong> Triggers appropriate mobile keyboards
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>email: Email keyboard with @ symbol</li>
              <li>tel: Numeric keypad for phone numbers</li>
              <li>url: URL keyboard with .com shortcut</li>
              <li>numeric/decimal: Number pad for amounts</li>
            </ul>
            <p className="mt-3">
              <strong>autoComplete Attributes:</strong> Enables browser autofill
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>name, email, tel, url, country, etc.</li>
            </ul>
            <p className="mt-3">
              <strong>Touch-Friendly Sizing:</strong> 48px minimum height for inputs
            </p>
            <p>
              <strong>Field Spacing:</strong> 16px (1rem) between form fields
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
