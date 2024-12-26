'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Target, Clock, ArrowLeft, Brain, Star, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Statistics() {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestTopic: '',
    quizHistory: [],
    streakCount: 0
  })
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
  const [filterConfig, setFilterConfig] = useState({ difficulty: 'all', topic: 'all' })
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/quiz/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      // Calculate statistics
      const totalQuizzes = data.length
      const averageScore = totalQuizzes > 0
        ? data.reduce((acc, quiz) => acc + (quiz.score / quiz.total_questions) * 100, 0) / totalQuizzes
        : 0

      // Find best topic
      let bestTopic = ''
      if (totalQuizzes > 0) {
        const topicScores = {}
        data.forEach(quiz => {
          if (!topicScores[quiz.topic]) {
            topicScores[quiz.topic] = { totalScore: 0, count: 0 }
          }
          topicScores[quiz.topic].totalScore += (quiz.score / quiz.total_questions) * 100
          topicScores[quiz.topic].count++
        })
        
        let highestAverage = 0
        Object.entries(topicScores).forEach(([topic, { totalScore, count }]) => {
          const average = totalScore / count
          if (average > highestAverage) {
            highestAverage = average
            bestTopic = topic
          }
        })
      }

      // Calculate streak count
      const streakCount = calculateStreak(data)

      setStats({
        totalQuizzes,
        averageScore,
        bestTopic,
        quizHistory: data,
        streakCount
      })
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const calculateStreak = (quizData) => {
    if (quizData.length === 0) return 0

    const sortedDates = quizData
      .map(quiz => new Date(quiz.created_at).toDateString())
      .sort((a, b) => new Date(b) - new Date(a))

    let streak = 1
    let currentDate = new Date(sortedDates[0])

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i])
      const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        streak++
        currentDate = prevDate
      } else if (diffDays > 1) {
        break
      }
    }

    return streak
  }

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleFilter = (type, value) => {
    setFilterConfig(prevConfig => ({
      ...prevConfig,
      [type]: value
    }))
  }

  const sortedAndFilteredQuizzes = stats.quizHistory
    .filter(quiz => 
      (filterConfig.difficulty === 'all' || quiz.difficulty === filterConfig.difficulty) &&
      (filterConfig.topic === 'all' || quiz.topic === filterConfig.topic)
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200 relative overflow-hidden pt-16 px-4">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Statistics
              </h1>
              <p className="text-gray-600 mt-2">Track your learning journey</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 sm:mt-0 flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Quiz
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { 
              title: 'Total Quizzes',
              value: stats.totalQuizzes,
              icon: Brain,
              gradient: 'from-blue-500 to-blue-600'
            },
            { 
              title: 'Average Score',
              value: `${stats.averageScore.toFixed(1)}%`,
              icon: Target,
              gradient: 'from-green-500 to-emerald-600'
            },
            { 
              title: 'Best Topic',
              value: stats.bestTopic || 'N/A',
              icon: Trophy,
              gradient: 'from-yellow-500 to-orange-600'
            },
            { 
              title: 'Current Streak',
              value: `${stats.streakCount} days`,
              icon: Star,
              gradient: 'from-purple-500 to-pink-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10 pointer-events-none`} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-700">{stat.title}</h2>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quiz History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8"
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Quiz History</h2>
            </div>
            {stats.quizHistory.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => handleFilter('difficulty', e.target.value)}
                  className="p-2 border rounded-md text-sm"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  onChange={(e) => handleFilter('topic', e.target.value)}
                  className="p-2 border rounded-md text-sm"
                >
                  <option value="all">All Topics</option>
                  {Array.from(new Set(stats.quizHistory.map(quiz => quiz.topic))).map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {stats.quizHistory.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quizzes Taken Yet</h3>
              <p className="text-gray-500 mb-4">Start your learning journey by taking your first quiz!</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
              >
                Take a Quiz
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('topic')} className="flex items-center">
                        Topic
                        <Filter className="w-4 h-4 ml-1" />
                      </button>
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('difficulty')} className="flex items-center">
                        Difficulty
                        <Filter className="w-4 h-4 ml-1" />
                      </button>
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('score')} className="flex items-center">
                        Score
                        <Filter className="w-4 h-4 ml-1" />
                      </button>
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button onClick={() => handleSort('created_at')} className="flex items-center">
                        Date
                        <Filter className="w-4 h-4 ml-1" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredQuizzes.map((quiz, index) => (
                    <tr key={index}>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{quiz.topic}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          quiz.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800'
                            : quiz.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.score}/{quiz.total_questions}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{new Date(quiz.created_at).toLocaleDateString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}