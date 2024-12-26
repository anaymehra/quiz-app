'use client'

import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, BookOpen, Award } from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

export default function Quiz() {
  const location = useLocation()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [topic, setTopic] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [answers, setAnswers] = useState([])
  const [difficulty, setDifficulty] = useState('')

  useEffect(() => {
    if (location.state?.questions && location.state?.topic && location.state?.difficulty) {
      setQuestions(location.state.questions)
      setTopic(location.state.topic)
      setDifficulty(location.state.difficulty)
    } else {
      navigate('/')
    }
  }, [location.state, navigate])

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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <div className="text-center text-gray-800 animate-pulse">
          <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-semibold">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-xl text-center"
        >
          <Award className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
          <p className="text-xl mb-4">Topic: <span className="font-semibold">{topic}</span></p>
          <p className="text-xl mb-2">Difficulty: <span className="font-semibold capitalize">{difficulty}</span></p>
          <motion.p 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            Your Score: {score} / {questions.length}
          </motion.p>
          <p className="text-lg mb-8">
            {score === questions.length
              ? "Perfect score! You're a coding master!"
              : score >= questions.length * 0.8
              ? "Great job! You have a solid grasp of this concept."
              : score >= questions.length * 0.6
              ? "Good effort! Keep practicing to improve your skills."
              : "Keep coding and learning. You'll get there!"}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(score / questions.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full"
            ></motion.div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Topic and Difficulty Badges */}
        <div className="flex justify-center gap-4 mb-6 pt-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="font-medium">{topic}</span>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            difficulty === 'easy' ? 'bg-green-50 text-green-700 border border-green-200' :
            difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span className="font-medium capitalize">{difficulty}</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b pb-4 px-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Coding Quiz</h2>
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
        <div className="mb-8 px-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {questions[currentQuestion].question}
          </h3>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleOptionSelect(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full px-6 py-4 text-left rounded-lg transition-all duration-300 ease-in-out 
                  ${
                    showResult
                      ? index === questions[currentQuestion].correctOptionIndex
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : selectedOption === index
                        ? 'bg-red-100 text-red-800 border-2 border-red-500'
                        : 'bg-gray-50 text-gray-800'
                      : selectedOption === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                  } 
                  ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'} 
                  flex items-center justify-between group relative`}
                disabled={showResult}
              >
                <span className="flex-1">{option}</span>
                {showResult && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      {index === questions[currentQuestion].correctOptionIndex ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : selectedOption === index ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Explanation Section */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8 px-6"
            >
              <div className={`p-4 rounded-lg ${
                selectedOption === questions[currentQuestion].correctOptionIndex
                  ? 'bg-green-50 border-l-4 border-green-500 text-green-700'
                  : 'bg-red-50 border-l-4 border-red-500 text-red-700'
              }`}>
                <p className="font-bold mb-2">Explanation:</p>
                <p>{questions[currentQuestion].explanation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Section */}
        <div className="flex justify-between pt-4 border-t px-6 pb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 ease-in-out"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextQuestion}
            disabled={!showResult}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 ease-in-out"
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="ml-2 h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}