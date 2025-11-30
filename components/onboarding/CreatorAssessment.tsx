'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; score: number }[];
}

const questions: Question[] = [
  {
    id: 'experience',
    question: 'How would you describe your content creation experience?',
    options: [
      { value: 'beginner', label: 'Just starting out', score: 1 },
      { value: 'intermediate', label: 'Some experience', score: 2 },
      { value: 'advanced', label: 'Experienced creator', score: 3 },
      { value: 'expert', label: 'Professional/Agency', score: 4 }
    ]
  },
  {
    id: 'platforms',
    question: 'How many social platforms do you currently manage?',
    options: [
      { value: '0-1', label: '0-1 platforms', score: 1 },
      { value: '2-3', label: '2-3 platforms', score: 2 },
      { value: '4-5', label: '4-5 platforms', score: 3 },
      { value: '6+', label: '6+ platforms', score: 4 }
    ]
  },
  {
    id: 'tools',
    question: 'How comfortable are you with content creation tools?',
    options: [
      { value: 'learning', label: 'Still learning', score: 1 },
      { value: 'comfortable', label: 'Comfortable with basics', score: 2 },
      { value: 'proficient', label: 'Very proficient', score: 3 },
      { value: 'expert', label: 'Expert level', score: 4 }
    ]
  }
];

interface CreatorAssessmentProps {
  onComplete: (data: { level: string; responses: Record<string, string> }) => void;
}

export function CreatorAssessment({ onComplete }: CreatorAssessmentProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [calculatedLevel, setCalculatedLevel] = useState('');

  const handleOptionSelect = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateLevel = () => {
    let totalScore = 0;
    questions.forEach(q => {
      const response = responses[q.id];
      const option = q.options.find(opt => opt.value === response);
      if (option) totalScore += option.score;
    });

    const avgScore = totalScore / questions.length;
    let level = 'beginner';
    
    if (avgScore >= 3.5) level = 'expert';
    else if (avgScore >= 2.5) level = 'advanced';
    else if (avgScore >= 1.5) level = 'intermediate';

    setCalculatedLevel(level);
    setShowResult(true);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'beginner': return <Sparkles className="w-12 h-12 text-blue-600" />;
      case 'intermediate': return <TrendingUp className="w-12 h-12 text-green-600" />;
      case 'advanced': return <Users className="w-12 h-12 text-purple-600" />;
      case 'expert': return <Zap className="w-12 h-12 text-yellow-600" />;
      default: return null;
    }
  };

  const getLevelDescription = (level: string) => {
    const descriptions = {
      beginner: 'Perfect! We\'ll guide you through everything step by step.',
      intermediate: 'Great! We\'ll help you level up your content game.',
      advanced: 'Awesome! We\'ll unlock advanced features for you.',
      expert: 'Excellent! You\'ll have access to all pro features.'
    };
    return descriptions[level as keyof typeof descriptions];
  };

  const isComplete = Object.keys(responses).length === questions.length;

  if (showResult) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          {getLevelIcon(calculatedLevel)}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            You're a {calculatedLevel.charAt(0).toUpperCase() + calculatedLevel.slice(1)} Creator!
          </h2>
          <p className="text-gray-600">
            {getLevelDescription(calculatedLevel)}
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => onComplete({ level: calculatedLevel, responses })}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your experience
        </h2>
        <p className="text-gray-600">
          This helps us personalize your experience
        </p>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              {index + 1}. {question.question}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map(option => (
                <Button 
                  key={option.value}
                  variant="secondary" 
                  onClick={() => handleOptionSelect(question.id, option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    responses[question.id] === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-gray-900">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" onClick={calculateLevel} disabled={!isComplete}>
        See My Level
      </Button>
    </div>
  );
}
