/**
 * Rankings Leaderboard Component
 * Displays talent rankings by views and tier
 */

import React, { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Loader2 } from 'lucide-react'
import { phase4API } from '../../lib/phase4API'

interface RankingTalent {
  rank: number
  talent_id: string
  name: string
  category: string
  profile_picture_url: string
  views_7d: number
  views_30d: number
  views_all_time: number
  rank_tier: string
  score: number
}

interface RankingsProps {
  category?: string
  period?: '7d' | '30d' | 'alltime'
  limit?: number
}

export const RankingsLeaderboard: React.FC<RankingsProps> = ({
  category,
  period = '7d',
  limit = 50,
}) => {
  const [rankings, setRankings] = useState<RankingTalent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(category || '')
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'alltime'>(period)

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await phase4API.getRankings({
          period: selectedPeriod,
          category: selectedCategory || undefined,
          limit,
        })
        if (response.status === 'success' && response.data) {
          setRankings(response.data.rankings as RankingTalent[])
        }
      } catch (err) {
        setError(phase4API.parseError(err))
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [selectedPeriod, selectedCategory, limit])

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-500'
    if (rank === 2) return 'bg-gray-100 border-gray-400'
    if (rank === 3) return 'bg-orange-100 border-orange-400'
    return 'bg-white border-gray-200'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      top_1: 'text-yellow-600 bg-yellow-50',
      top_5: 'text-blue-600 bg-blue-50',
      top_10: 'text-purple-600 bg-purple-50',
      top_25: 'text-pink-600 bg-pink-50',
      mid: 'text-green-600 bg-green-50',
      emerging: 'text-orange-600 bg-orange-50',
    }
    return colors[tier] || 'text-gray-600 bg-gray-50'
  }

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      top_1: '🏆 Top 1%',
      top_5: '⭐ Top 5%',
      top_10: '✨ Top 10%',
      top_25: '🌟 Top 25%',
      mid: '📈 Mid',
      emerging: '🚀 Emerging',
    }
    return labels[tier] || 'Unknown'
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h2 className="text-2xl font-bold text-gray-900">Talent Rankings</h2>
        </div>
        <p className="text-gray-600">Top performing talents by profile views</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">Time Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | 'alltime')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="alltime">All Time</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">Category</label>
          <input
            type="text"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            placeholder="All categories"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
          />
        </div>

        {/* View Stats */}
        <div className="flex items-end">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-5 h-5" />
            <span>Showing top {limit} talents</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="w-full p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-yellow-600" />
            <p className="text-gray-600">Loading rankings...</p>
          </div>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No rankings available</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Talent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                    Views
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((talent) => (
                  <tr
                    key={talent.talent_id}
                    className={`border-b transition hover:bg-gray-50 ${getRankColor(talent.rank)}`}
                  >
                    {/* Rank */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{getRankIcon(talent.rank)}</span>
                        {talent.rank <= 3 && (
                          <span className="text-xs font-semibold text-yellow-600">
                            {talent.rank === 1 ? '1st' : talent.rank === 2 ? '2nd' : '3rd'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Talent Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {talent.profile_picture_url && (
                          <img
                            src={talent.profile_picture_url}
                            alt={talent.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{talent.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-sm text-gray-600">{talent.category}</td>

                    {/* Views */}
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-gray-900">{talent.views_7d}</div>
                      <p className="text-xs text-gray-500">
                        {selectedPeriod === '7d'
                          ? `${talent.views_30d} (30d)`
                          : `${talent.views_all_time} (all)`}
                      </p>
                    </td>

                    {/* Tier */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(
                          talent.rank_tier
                        )}`}
                      >
                        {getTierLabel(talent.rank_tier)}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-gray-900">{talent.score.toFixed(1)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default RankingsLeaderboard
