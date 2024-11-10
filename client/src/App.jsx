'use client'

import React, { useState, useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import axios from 'axios'
import Quiz from './components/Quiz'
import AuthForm from './components/AuthForm'
import Sidebar from './components/Sidebar'
import Statistics from './components/Statistics'
import { Sparkles } from 'lucide-react'
import { CODING_CONCEPTS } from './codingConcepts.js'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          await axios.get('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          })
          setIsAuthenticated(true)
        } catch (error) {
          localStorage.removeItem('authToken')
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  const [userPrompt, setUserPrompt] = useState('')
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [quizTopic, setQuizTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(10)

  const BASE_URL = 'http://localhost:3000'

  const getRandomConcept = () => {
    const randomIndex = Math.floor(Math.random() * CODING_CONCEPTS.length)
    setUserPrompt(CODING_CONCEPTS[randomIndex])
  }

  const formSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      prompt: `Generate ${questionCount} ${difficulty}-difficulty multiple-choice questions about the following topic: ${userPrompt}. Focus on concepts related to this topic, such as its purpose, usage, and best practices. Do not ask questions about specific code implementation. Provide the questions in JSON format with this structure:

[\n  {\n    "question": "Your question here",\n    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],\n    "correctOptionIndex": 0,\n    "explanation": "Brief explanation of the correct answer"\n  },\n  ...\n]\n\nPlease respond only with the JSON data and nothing else.`
    }

    try {
      const token = localStorage.getItem('authToken')
      const result = await axios.post(`${BASE_URL}/generate`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const jsonResponse = JSON.parse(result.data.response)
      if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
        setQuestions(jsonResponse)
        setQuizTopic(userPrompt)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.log('Error sending prompt', error)
      setError('An error occurred while generating questions. Please try again.')
      setQuestions(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/register" element={<AuthForm mode="register" />} />
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <Sidebar />
            <Statistics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Sidebar />
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
              <div className="w-full max-w-2xl">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8 animate-fade-in-down">
                  Coding Quiz Generator
                </h1>
                <form onSubmit={formSubmit} className="space-y-4 mb-8">
                  <div className="flex space-x-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter a code snippet or topic"
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out"
                    />
                    <button
                      type="button"
                      onClick={getRandomConcept}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, parseInt(e.target.value))))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out"
                    />
                    <button
                      type="submit"
                      disabled={loading || !userPrompt.trim()}
                      className="flex-grow px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                      {loading ? 'Generating...' : 'Generate Quiz'}
                    </button>
                  </div>
                </form>
                {error && <p className="text-red-500 mt-4 text-center animate-bounce">{error}</p>}
              </div>
              {questions && <Quiz questions={questions} topic={quizTopic} difficulty={difficulty} />}
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}