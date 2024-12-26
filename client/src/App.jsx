'use client'

import React, { useState, useEffect } from 'react'
import { Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Quiz from './components/Quiz'
import AuthForm from './components/AuthForm'
import Sidebar from './components/Sidebar'
import Statistics from './components/Statistics'
import Leaderboard from './components/Leaderboard'
import FlashcardMode from './components/FlashCardMode'
import { Sparkles } from 'lucide-react'
import { CODING_CONCEPTS } from './codingConcepts.js'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          await axios.get(`${API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Auth verification error:', error)
          localStorage.removeItem('authToken')
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userPrompt, setUserPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [quizParams, setQuizParams] = useState({
    topic: '',
    difficulty: 'easy',
    questionCount: 5
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Reset form when navigating to home page
    if (location.pathname === '/') {
      setUserPrompt('')
      setQuizParams({
        topic: '',
        difficulty: 'easy',
        questionCount: 5
      })
    }

    // Check for user data in localStorage
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [location])

  const getRandomConcept = () => {
    const randomIndex = Math.floor(Math.random() * CODING_CONCEPTS.length)
    setUserPrompt(CODING_CONCEPTS[randomIndex])
  }

  const formSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const promptText = `Generate ${quizParams.questionCount} ${quizParams.difficulty}-difficulty multiple-choice questions about the following topic: ${userPrompt}. Focus on concepts related to this topic, such as its purpose, usage, and best practices. Do not ask questions about specific code implementation. Provide the questions in JSON format with this structure:

      [
        {
          "question": "Your question here",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctOptionIndex": 0,
          "explanation": "Brief explanation of the correct answer"
        },
        ...
      ]

      Please respond only with the JSON data and nothing else.`

    try {
      const token = localStorage.getItem('authToken')
      const result = await axios.post(`${API_URL}/generate`, { prompt: promptText }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      let jsonResponse
      try {
        // Remove any non-JSON content before parsing
        const jsonString = result.data.response.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, '$1')
        jsonResponse = JSON.parse(jsonString)
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
        throw new Error('Invalid response format')
      }

      if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
        navigate('/quiz', { state: { questions: jsonResponse, topic: userPrompt, difficulty: quizParams.difficulty } })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error sending prompt:', error)
      setError('An error occurred while generating questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-100/30 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-gradient-to-br from-pink-100/20 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden relative pt-16">
        <Routes>
          <Route path="/login" element={<AuthForm mode="login" setUser={setUser} />} />
          <Route path="/register" element={<AuthForm mode="register" setUser={setUser} />} />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <FlashcardMode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4 pb-4">
                        Quiz Master
                      </h1>
                      <p className="text-gray-600 text-lg">Quick Quizzes to Cement Your Coding Knowledge!</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                      <form onSubmit={formSubmit} className="space-y-6">
                        <div className="space-y-4">
                          <label htmlFor="topic" className="block text-lg font-medium text-gray-700">
                            Enter a coding topic or concept:
                          </label>
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              autoComplete='off'
                              type="text"
                              id="topic"
                              value={userPrompt}
                              onChange={(e) => setUserPrompt(e.target.value)}
                              className="flex-grow px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="e.g. JavaScript Promises"
                            />
                            <button
                              type="button"
                              onClick={getRandomConcept}
                              className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-xl"
                            >
                              <Sparkles className="h-5 w-5" />
                              Random
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label htmlFor="difficulty" className="block text-lg font-medium text-gray-700">
                              Difficulty:
                            </label>
                            <select
                              id="difficulty"
                              value={quizParams.difficulty}
                              onChange={(e) => setQuizParams({...quizParams, difficulty: e.target.value})}
                              className="cursor-pointer w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="questionCount" className="block text-lg font-medium text-gray-700">
                              Number of Questions:
                            </label>
                            <input
                              type="number"
                              id="questionCount"
                              value={quizParams.questionCount}
                              onChange={(e) => setQuizParams({...quizParams, questionCount: parseInt(e.target.value)})}
                              min="1"
                              max="10"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !userPrompt.trim()}
                          className={`cursor-pointer w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                              Generating Quiz...
                            </div>
                          ) : (
                            'Generate Quiz'
                          )}
                        </button>
                      </form>
                    </div>

                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8" role="alert">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  )
}