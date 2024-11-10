'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen } from 'lucide-react'
import axios from 'axios'

export default function Quiz({ questions, topic, difficulty }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    setCurrentQuestion(0)
    setScore(0)
    setSelectedOption(null)
    setShowResult(false)
    setQuizCompleted(false)
    setAnswers([])
  }, [questions])

  if (!questions || questions.length === 0) {
    return <div className="text-center text-gray-800 animate-fade-in">No questions available. Please generate a quiz first.</div>
  }

  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex)
    setShowResult(true)
    if (optionIndex === questions[currentQuestion].correctOptionIndex) {
      setScore(score + 1)
    }
    setAnswers([...answers, {
      question: questions[currentQuestion].question,
      selectedOption: questions[currentQuestion].options[optionIndex],
      isCorrect: optionIndex === questions[currentQuestion].correctOptionIndex
    }])
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedOption(null)
      setShowResult(false)
    } else {
      handleQuizComplete()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedOption(null)
      setShowResult(false)
    }
  }

  const handleQuizComplete = async () => {
    setQuizCompleted(true)
    
    try {
      const token = localStorage.getItem('authToken')
      await axios.post('/api/quiz/save-attempt', {
        topic,
        difficulty,
        score,
        totalQuestions: questions.length,
        answers
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Error saving quiz attempt:', error)
    }
  }

  const getDifficultyBadge = () => {
    const colors = {
      easy: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hard: 'bg-red-100 text-red-800 border-red-200'
    }

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[difficulty.toLowerCase()]}`}>
        {difficulty}
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md mt-8 text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
        <p className="text-xl mb-4">Topic: <span className="font-semibold">{topic}</span></p>
        <p className="text-4xl font-bold mb-4 animate-pulse">Your Score: {score} / {questions.length}</p>
        <p className="text-lg mb-6">
          {score === questions.length
            ? "Perfect score! You're a coding master!"
            : score >= questions.length * 0.8
            ? "Great job! You have a solid grasp of this concept."
            : score >= questions.length * 0.6
            ? "Good effort! Keep practicing to improve your skills."
            : "Keep coding and learning. You'll get there!"}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${(score / questions.length) * 100}%` }}
          ></div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Start a New Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md mt-8 animate-fade-in">
      {/* Topic and Difficulty Badges */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <BookOpen className="w-4 h-4 mr-2" />
          <span className="font-medium">{topic}</span>
        </div>
        {getDifficultyBadge()}
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Coding Quiz</h2>
        <div className="flex items-center space-x-6">
          <p className="text-sm font-medium text-gray-600">
            Question {currentQuestion + 1}/{questions.length}
          </p>
          <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-blue-700">
              Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Question Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {questions[currentQuestion].question}
        </h3>
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              className={`w-full px-6 py-3 text-left rounded-lg transition-all duration-300 ease-in-out 
                ${
                  selectedOption === index
                    ? showResult
                      ? index === questions[currentQuestion].correctOptionIndex
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-800 hover:shadow-md'
                } 
                ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'} 
                flex items-center justify-between group`}
              disabled={showResult}
            >
              <span className="flex-1">{option}</span>
              {showResult && (
                index === questions[currentQuestion].correctOptionIndex ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : selectedOption === index ? (
                  <XCircle className="w-5 h-5 text-white" />
                ) : null
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Section */}
      {showResult && (
        <div className="mb-8 transform transition-all duration-300 ease-in-out animate-fade-in">
          <div className={`p-4 rounded-lg ${
            selectedOption === questions[currentQuestion].correctOptionIndex
              ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
              : 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
          }`}>
            <p className="font-bold mb-2">Explanation:</p>
            <p>{questions[currentQuestion].explanation}</p>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 ease-in-out"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </button>
        <button
          onClick={handleNextQuestion}
          disabled={!showResult}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 ease-in-out"
        >
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  )
}