'use client';

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
}

const CATEGORIES = [
  { value: 'promotional', label: 'Promotional', icon: '📢', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'educational', label: 'Educational', icon: '📚', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'engagement', label: 'Engagement', icon: '💬', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'announcement', label: 'Announcement', icon: '📣', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'behind-the-scenes', label: 'Behind the Scenes', icon: '🎥', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'user-generated', label: 'User Generated', icon: '👥', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { value: 'seasonal', label: 'Seasonal', icon: '🎄', color: 'bg-orange-100 text-orange-800 border-orange-300' }
];

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Content Category</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`p-3 border-2 rounded-lg text-left transition-all ${
              value === category.value
                ? category.color + ' border-current shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm font-medium">{category.label}</span>
            </div>
          </button>
        ))}
      </div>
      
      {value && (
        <div className="mt-2 text-xs text-gray-600">
          Selected: {CATEGORIES.find(c => c.value === value)?.label}
        </div>
      )}
    </div>
  );
}

export { CATEGORIES };
