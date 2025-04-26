"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/aptitude";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [explanationVisibility, setExplanationVisibility] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(600);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      setSubmittedAnswers(new Array(quizData.length).fill(false));
      setExplanationVisibility(new Array(quizData.length).fill(false));
      const timer = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            finishQuiz();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizData]);

  const handleAnswer = (answer) => {
    if (submittedAnswers[currentQuestion]) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const newSubmitted = [...submittedAnswers];
    newSubmitted[currentQuestion] = true;
    setSubmittedAnswers(newSubmitted);

    const newVisibility = [...explanationVisibility];
    newVisibility[currentQuestion] = false;
    setExplanationVisibility(newVisibility);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const handleSkip = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSubmittedAnswers([]);
    setExplanationVisibility([]);
    setTimeRemaining(600);
    generateQuizFn();
    setResultData(null);
  };

  if (generatingQuiz) {
    return <BarLoader className="mt-4" width="100%" color="gray" />;
  }

  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Card className="mx-2">
      <CardHeader className="flex justify-between items-center">
        <div className="flex w-full justify-between">
          <CardTitle>
            Question {currentQuestion + 1} of {quizData.length}
          </CardTitle>
          <p className="text-sm">
            Time Remaining: {formatTime(timeRemaining)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option}
                id={`option-${index}`}
                disabled={submittedAnswers[currentQuestion]}
              />
              <Label htmlFor={`option-${index}`}>{option}</Label>
            </div>
          ))}
        </RadioGroup>

        {submittedAnswers[currentQuestion] && explanationVisibility[currentQuestion] && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        {!submittedAnswers[currentQuestion] ? (
          <>
            <Button
              onClick={handleSubmit}
              disabled={!answers[currentQuestion]}
            >
              Submit Answer
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="bg-red-500 text-white"
            >
              Skip Question
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                const newVisibility = [...explanationVisibility];
                newVisibility[currentQuestion] = !newVisibility[currentQuestion];
                setExplanationVisibility(newVisibility);
              }}
              variant="outline"
            >
              {explanationVisibility[currentQuestion]
                ? "Hide Explanation"
                : "Show Explanation"}
            </Button>
            <Button
              onClick={handleNext}
              disabled={savingResult}
            >
              {savingResult && (
                <BarLoader className="mt-4" width="100%" color="gray" />
              )}
              {currentQuestion < quizData.length - 1
                ? "Next Question"
                : "Finish Quiz"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}