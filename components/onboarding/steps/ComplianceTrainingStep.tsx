"use client";

import { useState } from "react";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, BookOpen, Shield, Ban } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

const QUIZ_QUESTIONS: Question[] = [
  {
    id: "q1",
    question: "Which platform fully forbids automated direct messages (DMs)?",
    options: ["Instagram", "TikTok", "Reddit", "OnlyFans"],
    correctAnswer: 1,
    explanation: "TikTok strictly forbids any automated DMs via API."
  },
  {
    id: "q2",
    question: "What is the recommended limit of posts per day on Instagram?",
    options: ["3 posts", "5 posts", "10 posts", "Unlimited"],
    correctAnswer: 1,
    explanation: "Posting up to 5 per day stays within Instagram best practices."
  },
  {
    id: "q3",
    question: "What does the GDPR 'data minimization' principle mean?",
    options: [
      "Delete all data",
      "Collect only data that is necessary",
      "Share the minimum data",
      "Reduce file sizes"
    ],
    correctAnswer: 1,
    explanation: "GDPR requires collecting only what’s strictly necessary for your activity."
  },
  {
    id: "q4",
    question: "When can a user request deletion of their data?",
    options: ["30 days", "90 days", "1 year", "Any time"],
    correctAnswer: 3,
    explanation: "GDPR grants the right to erasure at any time."
  },
  {
    id: "q5",
    question: "What triggers mandatory human supervision?",
    options: [
      "Any automated message",
      "Messages with price > $100 or > 50 recipients",
      "Only public posts",
      "Nothing, everything is automated"
    ],
    correctAnswer: 1,
    explanation: "Supervision thresholds ensure human control over sensitive actions."
  }
];

export function ComplianceTrainingStep() {
  const { setComplianceQuizScore } = useOnboarding();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleAnswer = () => {
    if (selectedAnswer) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: parseInt(selectedAnswer)
      });

      if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer("");
      } else {
        calculateScore();
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    
    const score = (correct / QUIZ_QUESTIONS.length) * 100;
    setComplianceQuizScore(score);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer("");
    setShowResults(false);
  };

  if (!showResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h3 className="text-xl font-semibold">Compliance Training</h3>
        </div>

        <Alert className="border-purple-200 bg-purple-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This training is required to ensure compliant usage. 
            You must score at least 80% to continue.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}</span>
              <span>{Math.round(((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          <h4 className="font-medium text-lg mb-4">{currentQuestion.question}</h4>

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button 
            onClick={handleAnswer} 
            disabled={!selectedAnswer}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
          >
            {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? "Next" : "Finish quiz"}
          </Button>
        </Card>
      </div>
    );
  }

  const score = useOnboarding.getState().complianceQuizScore || 0;
  const passed = score >= 80;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        {passed ? (
          <>
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">Congrats!</h3>
            <p className="text-gray-600">
              You passed the quiz with a score of {score}%
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Ban className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-red-600">Insufficient score</h3>
            <p className="text-gray-600">
              You got {score}%. A minimum of 80% is required.
            </p>
          </>
        )}
      </div>

      <Card className="p-6 bg-gray-50">
        <h4 className="font-semibold mb-4">Detailed results:</h4>
        {QUIZ_QUESTIONS.map((q, index) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;
          
          return (
            <div key={q.id} className="mb-4 pb-4 border-b last:border-0">
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                  isCorrect ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {isCorrect ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your answer: {q.options[userAnswer]} 
                    {!isCorrect && ` (Correct: ${q.options[q.correctAnswer]})`}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {!passed && (
        <Button 
          onClick={resetQuiz} 
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Restart quiz
        </Button>
      )}
    </div>
  );
}
