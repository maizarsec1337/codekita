/**
 * CodeKita - Quiz Component
 * Interactive quiz for assessments and knowledge testing
 */

import { Quiz, QuizQuestion, QuizResult } from './types';

interface QuizProps {
  quiz: Quiz;
  onAnswer: (questionId: string, answer: string | number) => void;
  onComplete: (result: QuizResult) => void;
}

interface QuizState {
  currentQuestion: number;
  answers: Record<string, string | number>;
  completed: boolean;
  score: number;
}

export const Quiz: React.FC<QuizProps> = ({ quiz, onAnswer, onComplete }) => {
  const [state, setState] = React.useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    completed: false,
    score: 0,
  });

  const totalQuestions = quiz.questions.length;

  const handleAnswer = (questionId: string, answer: string | number) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));
    onAnswer(questionId, answer);
  };

  const nextQuestion = () => {
    setState((prev) => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1,
    }));
  };

  const completeQuiz = () => {
    let correct = 0;
    
    quiz.questions.forEach((question) => {
      const userAnswer = state.answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    const result: QuizResult = {
      id: `${quiz.id}-${Date.now()}`,
      userId: '', // will be filled by parent
      quizId: quiz.id,
      score,
      total: totalQuestions,
      completedAt: new Date(),
      passed,
    };

    onComplete(result);
  };

  if (state.currentQuestion >= totalQuestions) {
    return completeQuiz();
  }

  const currentQuestion = quiz.questions[state.currentQuestion];

  return (
    <div className="quiz-container max-w-2xl mx-auto p-6">
      <div className="quiz-header mb-6">
        <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
        <p className="text-gray-400">{currentQuestion.question}</p>
      </div>

      {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.length > 0 ? (
        <div className="quiz-options space-y-2">
          {currentQuestion.options!.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left padding-2 text-sm rounded ${state.answers[currentQuestion.id] === option 
                ? 'bg-primary-100 text-primary-600' 
                : 'text-gray-600 hover:bg-gray-100 transition-colors'}`}
              onClick={() => handleAnswer(currentQuestion.id, option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="quiz-true-false space-y-4">
          <button
            className={`w-full padding-2 text-sm rounded ${state.answers[currentQuestion.id] === 'true' 
              ? 'bg-green-100 text-green-600' 
              : 'text-gray-600 hover:bg-gray-100 transition-colors'}`}
            onClick={() => handleAnswer(currentQuestion.id, 'true')}
          >
            True
          </button>
          <button
            className={`w-full padding-2 text-sm rounded ${state.answers[currentQuestion.id] === 'false' 
              ? 'bg-red-100 text-red-600' 
              : 'text-gray-600 hover:bg-gray-100 transition-colors'}`}
            onClick={() => handleAnswer(currentQuestion.id, 'false')}
          >
            False
          </button>
        </div>
      )}

      {state.currentQuestion < totalQuestions - 1 ? (
        <button
          className="mt-4 w-full btn-primary"
          onClick={() => nextQuestion()}
        >
          Next Question
        </button>
      ) : (
        <button
          className="mt-4 w-full btn-primary"
          onClick={() => completeQuiz()}
        >
          Submit Quiz
        </button>
      )}

      {state.currentQuestion < totalQuestions - 1 && (
        <p className="mt-2 text-sm text-gray-400">
          Question {state.currentQuestion + 1} of {totalQuestions}
        </p>
      )}
    </div>
  );
};