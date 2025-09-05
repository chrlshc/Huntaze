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
    question: "Quelle plateforme interdit totalement l'automatisation des messages directs (DMs)?",
    options: ["Instagram", "TikTok", "Reddit", "OnlyFans"],
    correctAnswer: 1,
    explanation: "TikTok interdit strictement toute automatisation de messages directs via API."
  },
  {
    id: "q2",
    question: "Quelle est la limite recommandée de posts par jour sur Instagram?",
    options: ["3 posts", "5 posts", "10 posts", "Illimité"],
    correctAnswer: 1,
    explanation: "La limite de 5 posts par jour permet de rester dans les bonnes pratiques d'Instagram."
  },
  {
    id: "q3",
    question: "Que signifie le principe de 'minimisation des données' du RGPD?",
    options: [
      "Supprimer toutes les données",
      "Collecter uniquement les données nécessaires",
      "Partager le minimum de données",
      "Réduire la taille des fichiers"
    ],
    correctAnswer: 1,
    explanation: "Le RGPD exige de ne collecter que les données strictement nécessaires à votre activité."
  },
  {
    id: "q4",
    question: "Combien de temps un utilisateur peut-il demander la suppression de ses données?",
    options: ["30 jours", "90 jours", "1 an", "À tout moment"],
    correctAnswer: 3,
    explanation: "Le RGPD donne le droit à l'effacement des données à tout moment."
  },
  {
    id: "q5",
    question: "Qu'est-ce qui déclenche une supervision humaine obligatoire?",
    options: [
      "Tout message automatique",
      "Messages avec prix > 100$ ou > 50 destinataires",
      "Uniquement les posts publics",
      "Rien, tout est automatisé"
    ],
    correctAnswer: 1,
    explanation: "Les seuils de supervision garantissent un contrôle humain sur les actions sensibles."
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
          <h3 className="text-xl font-semibold">Formation à la conformité</h3>
        </div>

        <Alert className="border-purple-200 bg-purple-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cette formation est obligatoire pour garantir une utilisation conforme de la plateforme.
            Vous devez obtenir au moins 80% pour continuer.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} sur {QUIZ_QUESTIONS.length}</span>
              <span>{Math.round(((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100)}% complété</span>
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
            {currentQuestionIndex < QUIZ_QUESTIONS.length - 1 ? "Suivant" : "Terminer le quiz"}
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
            <h3 className="text-2xl font-bold text-green-600">Félicitations!</h3>
            <p className="text-gray-600">
              Vous avez réussi le quiz avec un score de {score}%
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Ban className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-red-600">Score insuffisant</h3>
            <p className="text-gray-600">
              Vous avez obtenu {score}%. Un minimum de 80% est requis.
            </p>
          </>
        )}
      </div>

      <Card className="p-6 bg-gray-50">
        <h4 className="font-semibold mb-4">Résultats détaillés:</h4>
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
                    Votre réponse: {q.options[userAnswer]} 
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
          Recommencer le quiz
        </Button>
      )}
    </div>
  );
}