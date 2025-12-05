"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tag, 
  Percent, 
  DollarSign, 
  Gift,
  Calendar,
  Users,
  Save,
  X
} from 'lucide-react';
import type { 
  Offer, 
  CreateOfferInput, 
  UpdateOfferInput, 
  DiscountType, 
  OfferStatus 
} from '@/lib/offers/types';

interface OfferFormProps {
  offer?: Offer;
  onSubmit: (data: CreateOfferInput | UpdateOfferInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const discountTypes: { value: DiscountType; label: string; icon: typeof Percent }[] = [
  { value: 'percentage', label: 'Percentage Off', icon: Percent },
  { value: 'fixed', label: 'Fixed Amount Off', icon: DollarSign },
  { value: 'bogo', label: 'Buy One Get One', icon: Gift },
];

const statusOptions: { value: OfferStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
];

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function OfferForm({ offer, onSubmit, onCancel, isLoading = false }: OfferFormProps) {
  const [formData, setFormData] = useState({
    name: offer?.name || '',
    description: offer?.description || '',
    discountType: offer?.discountType || 'percentage' as DiscountType,
    discountValue: offer?.discountValue || 10,
    originalPrice: offer?.originalPrice || undefined,
    validFrom: offer?.validFrom ? formatDateForInput(offer.validFrom) : formatDateForInput(new Date()),
    validUntil: offer?.validUntil ? formatDateForInput(offer.validUntil) : '',
    status: offer?.status || 'draft' as OfferStatus,
    targetAudience: offer?.targetAudience || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0';
    }
    
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100%';
    }
    
    if (!formData.validUntil) {
      newErrors.validUntil = 'End date is required';
    }
    
    if (formData.validFrom && formData.validUntil && 
        new Date(formData.validFrom) > new Date(formData.validUntil)) {
      newErrors.validUntil = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const submitData: CreateOfferInput = {
      name: formData.name,
      description: formData.description || undefined,
      discountType: formData.discountType,
      discountValue: formData.discountValue,
      originalPrice: formData.originalPrice,
      validFrom: new Date(formData.validFrom),
      validUntil: new Date(formData.validUntil),
      status: formData.status,
      targetAudience: formData.targetAudience || undefined,
    };
    
    await onSubmit(submitData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Basic Information
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Offer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Summer Sale 20% Off"
              className={`w-full px-3 py-2 rounded-lg border bg-background ${
                errors.name ? 'border-red-500' : 'border-border'
              } focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your offer..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Discount Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5" />
          Discount Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {discountTypes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange('discountType', value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.discountType === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    formData.discountType === value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => handleChange('discountValue', parseFloat(e.target.value) || 0)}
                  min="0"
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  className={`w-full px-3 py-2 rounded-lg border bg-background ${
                    errors.discountValue ? 'border-red-500' : 'border-border'
                  } focus:outline-none focus:ring-2 focus:ring-primary/50`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {formData.discountType === 'percentage' ? '%' : '$'}
                </span>
              </div>
              {errors.discountValue && (
                <p className="text-sm text-red-500 mt-1">{errors.discountValue}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Original Price (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={(e) => handleChange('originalPrice', parseFloat(e.target.value) || undefined)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Schedule */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => handleChange('validFrom', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleChange('validUntil', e.target.value)}
              min={formData.validFrom}
              className={`w-full px-3 py-2 rounded-lg border bg-background ${
                errors.validUntil ? 'border-red-500' : 'border-border'
              } focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.validUntil && (
              <p className="text-sm text-red-500 mt-1">{errors.validUntil}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Targeting */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Targeting
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Target Audience
            </label>
            <select
              value={formData.targetAudience}
              onChange={(e) => handleChange('targetAudience', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All fans</option>
              <option value="New subscribers">New subscribers</option>
              <option value="VIP fans">VIP fans</option>
              <option value="Inactive fans">Inactive fans</option>
              <option value="High spenders">High spenders</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as OfferStatus)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
        </Button>
      </div>
    </form>
  );
}
