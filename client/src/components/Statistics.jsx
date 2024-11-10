'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Trophy, Target, Clock } from 'lucide-react'

export default function Statistics() {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    bestTopic: '',
    recentActivity: []
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/quiz/history', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await response.json()
        
        // Calculate statistics
        const totalQuizzes = data.length
        const averageScore = data.reduce((acc, quiz) => 
          acc + (quiz.score / quiz.total_questions) * 100, 0) / totalQuizzes

        // Find best topic
        const topicScores = {}
        data.forEach(quiz => {
          if (!topicScores[quiz.topic]) {
            topicScores[quiz.topic] = {
              totalScore: 0,
              count: 0
            }
          }
          topicScores[quiz.topic].totalScore += (quiz.score / quiz.total_questions) * 100
          topicScores[quiz.topic].count++
        })

        let bestTopic = ''
        let bestScore = 0
        Object.entries(topicScores).forEach(([topic, stats]) => {
          const avgScore = stats.totalScore / stats.count
          if (avgScore > bestScore) {
            bestScore = avgScore
            bestTopic = topic
          }
        })

        setStats({
          totalQuizzes,
          averageScore,
          bestTopic,
          recentActivity: data.slice(0, 5)
        })
      } catch (error) {
        console.error('Error fetching statistics:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Statistics</h1>
      
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">Total Quizzes</h2>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">Average Score</h2>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">Best Topic</h2>
            <Trophy className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold">{stats.bestTopic}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-gray-400" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {stats.recentActivity.map((quiz, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{quiz.topic}</p>
                <p className="text-sm text-gray-600">
                  Score: {quiz.score}/{quiz.total_questions} • {quiz.difficulty}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(quiz.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}