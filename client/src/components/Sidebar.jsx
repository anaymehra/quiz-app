'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart, Book, LogOut, ChevronLeft, User, Brain, Clock, Trophy, BookOpen, FlaskConical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const [quizHistory, setQuizHistory] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const sidebarRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('authToken')

        if (!token) {
          console.log('No auth token found, skipping data fetch')
          setLoading(false)
          return
        }

        // Fetch quiz history
        const historyResponse = await fetch('/api/quiz/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!historyResponse.ok) {
          throw new Error(`HTTP error! status: ${historyResponse.status}`)
        }
        
        const historyText = await historyResponse.text()
        let historyData
        try {
          historyData = JSON.parse(historyText)
        } catch (e) {
          console.error('Failed to parse quiz history:', historyText)
          throw new Error('Invalid quiz history data')
        }

        // Fetch user data
        const userResponse = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!userResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`)
        }
        
        const userText = await userResponse.text()
        let userData
        try {
          userData = JSON.parse(userText)
        } catch (e) {
          console.error('Failed to parse user data:', userText)
          throw new Error('Invalid user data')
        }

        setQuizHistory(historyData.slice(0, 5))
        setUser(userData.user)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling for quiz history updates
    const pollInterval = setInterval(fetchData, 30000) // Poll every 30 seconds

    return () => clearInterval(pollInterval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigation = (path) => {
    navigate(path)
    setOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
    setOpen(false)
  }

  const handleRetakeQuiz = (quiz) => {
    navigate('/', {
      state: {
        retakeQuiz: {
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          totalQuestions: quiz.total_questions
        }
      }
    })
    setOpen(false)
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center space-x-2 text-gray-800 hover:text-blue-600 transition-colors duration-200"
            onClick={() => setOpen(true)}
          >
            <Brain className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">QuizMaster</span>
          </button>
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.username || 'User'}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 flex items-center justify-between border-b">
                <div className="flex items-center space-x-2">
                  <Brain className="w-8 h-8 text-blue-500" />
                  <h2 className="text-xl font-bold text-gray-800">QuizMaster</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {user && (
                <div className="p-4 flex items-center space-x-3 border-b bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.username || 'User'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => handleNavigation('/')}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-600 transition-colors duration-100"
                    >
                      <Book className="w-5 h-5" />
                      <span>Quick Quiz</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/flashcards')}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-yellow-50 text-gray-700 hover:text-yellow-600 transition-colors duration-100"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Quick Flashcards</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/statistics')}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors duration-100"
                    >
                      <BarChart className="w-5 h-5" />
                      <span>Statistics</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/leaderboard')}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors duration-100"
                    >
                      <Trophy className="w-5 h-5" />
                      <span>Leaderboard</span>
                    </button>
                  </li>
                </ul>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recent Quizzes</h3>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-100 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : quizHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No quizzes taken yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {quizHistory.map((quiz, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800 truncate">{quiz.topic}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                quiz.difficulty === 'easy'
                                  ? 'bg-green-100 text-green-800'
                                  : quiz.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {quiz.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Score:</span>
                              <span
                                className={`font-medium ${
                                  quiz.score / quiz.total_questions >= 0.7
                                    ? 'text-green-600'
                                    : quiz.score / quiz.total_questions >= 0.4
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {quiz.score}/{quiz.total_questions}
                              </span>
                            </div>
                            <span className="text-gray-400">{formatTimeAgo(quiz.created_at)}</span>
                          </div>
                          <button
                            onClick={() => handleRetakeQuiz(quiz)}
                            className="mt-2 w-full text-sm bg-blue-500 text-white rounded-md py-1.5 hover:bg-blue-600 transition-colors duration-200"
                          >
                            Retake Quiz
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              </nav>

              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}