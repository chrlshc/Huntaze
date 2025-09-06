import PlanDetails from '@/components/pricing/plan-details';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PricingDetailsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 pt-20">
        <Link 
          href="/pricing" 
          className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux plans
        </Link>
        
        <PlanDetails />
      </div>
    </div>
  );
}