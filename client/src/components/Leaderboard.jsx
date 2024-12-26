'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Search, ArrowUp, ArrowDown, BookOpen } from 'lucide-react'
import axios from 'axios'

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'average_score', direction: 'desc' })

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.get('/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const processedData = response.data.map(user => ({
        ...user,
        total_quizzes: parseInt(user.total_quizzes) || 0,
        total_score: parseInt(user.total_score) || 0,
        average_score: parseFloat(user.average_score) || 0,
        best_topic: user.best_topic || 'N/A'
      }))

      setLeaderboardData(processedData)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const sortedData = [...leaderboardData].sort((a, b) => {
    const multiplier = sortConfig.direction === 'asc' ? 1 : -1
    return multiplier * (a[sortConfig.key] - b[sortConfig.key])
  })

  const filteredData = sortedData.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200 relative overflow-hidden pt-16 px-4">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Global Leaderboard
          </h1>
          <p className="mt-2 text-gray-600">Compete with other quiz masters!</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {leaderboardData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leaderboard Data Yet</h3>
            <p className="text-gray-500">Be the first to take a quiz and appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer" 
                        onClick={() => handleSort('total_quizzes')}>
                      <div className="flex items-center gap-2">
                        Total Quizzes
                        {sortConfig.key === 'total_quizzes' && (
                          sortConfig.direction === 'desc' ? 
                            <ArrowDown className="w-4 h-4" /> : 
                            <ArrowUp className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                        onClick={() => handleSort('average_score')}>
                      <div className="flex items-center gap-2">
                        Average Score
                        {sortConfig.key === 'average_score' && (
                          sortConfig.direction === 'desc' ? 
                            <ArrowDown className="w-4 h-4" /> : 
                            <ArrowUp className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Best Topic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        index < 3 ? 'bg-gradient-to-r from-gray-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRankIcon(index)}
                          <span className={`font-semibold ${
                            index < 3 ? 'text-lg' : ''
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.total_quizzes}</div>
                        <div className="text-sm text-gray-500">quizzes taken</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">
                          {user.average_score.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${user.average_score}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {user.best_topic}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}