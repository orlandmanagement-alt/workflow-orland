/**
 * Analytics Chart Component
 * Displays talent analytics with charts
 */

import React, { useEffect } from 'react'
import { TrendingUp, Eye, Award } from 'lucide-react'
import { useMyAnalytics } from '../../hooks/usePhase4'

export const AnalyticsChart: React.FC = () => {
  const { dashboard, loading, error, refresh } = useMyAnalytics()

  const overview = dashboard?.overview
  const dailyBreakdown = dashboard?.dailyBreakdown || []
  const stats = dashboard?.stats

  const getRankBadge = (tier: string) => {
    const tiers: Record<string, { label: string; color: string; bg: string }> = {
      top_1: { label: '🏆 Top 1%', color: 'text-yellow-700', bg: 'bg-yellow-50' },
      top_5: { label: '⭐ Top 5%', color: 'text-blue-700', bg: 'bg-blue-50' },
      top_10: { label: '✨ Top 10%', color: 'text-purple-700', bg: 'bg-purple-50' },
      top_25: { label: '🌟 Top 25%', color: 'text-pink-700', bg: 'bg-pink-50' },
      mid: { label: '📈 Mid Tier', color: 'text-green-700', bg: 'bg-green-50' },
      emerging: { label: '🚀 Emerging', color: 'text-orange-700', bg: 'bg-orange-50' },
    }
    return tiers[tier] || { label: 'Unknown', color: 'text-gray-700', bg: 'bg-gray-50' }
  }

  if (loading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-900">{error}</p>
        <button onClick={refresh} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
          Retry
        </button>
      </div>
    )
  }

  const rank = getRankBadge(overview?.rank_tier || 'emerging')

  // Calculate max for chart scaling
  const maxDailyViews = Math.max(...dailyBreakdown.map((d) => d.views), 1)

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Analytics</h2>
        <p className="text-gray-600 mt-1">{dashboard?.talentName}'s profile performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Views This Week */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Views (7 days)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.views_7d || 0}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Avg: {stats?.avgViewsPerDay || 0}/day
          </p>
        </div>

        {/* Views This Month */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Views (30 days)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.views_30d || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Growth: {stats?.growthRate || '0%'}
          </p>
        </div>

        {/* All Time Views */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">All-Time Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {overview?.views_all_time || 0}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* Rank Tier */}
        <div className={`bg-white p-6 rounded-lg shadow border-l-4 border-yellow-600 ${rank.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rank Tier</p>
              <p className={`text-xl font-bold mt-1 ${rank.color}`}>{rank.label}</p>
            </div>
            <Award className="w-8 h-8 text-yellow-600" />
          </div>
          {overview?.percentile && (
            <p className="text-xs text-gray-500 mt-3">
              Top {100 - overview.percentile}% of talents
            </p>
          )}
        </div>
      </div>

      {/* Daily Breakdown Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold text-gray-900 mb-4">Views Over Time</h3>

        {dailyBreakdown.length > 0 ? (
          <div className="space-y-3">
            {dailyBreakdown.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <p className="text-sm text-gray-600 w-20">{day.date}</p>
                <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-center text-white text-xs font-semibold transition-all"
                    style={{
                      width: `${(day.views / maxDailyViews) * 100}%`,
                      minWidth: day.views > 0 ? '40px' : '0',
                    }}
                  >
                    {day.views > 3 && day.views}
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 w-10 text-right">
                  {day.views}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No view data yet</p>
        )}
      </div>

      {/* Score Details */}
      {overview?.score !== undefined && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">Profile Score</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold text-lg text-blue-600">{overview.score.toFixed(1)}</span>
              {' / 1000 points'}
            </p>
            <p className="text-gray-600">
              Your score is calculated from your 7-day, 30-day, and all-time profile views. 
              Higher scores unlock better ranking tiers!
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Tip:</span> Increase your profile views by 
          making your profile complete, adding quality photos, and maintaining an active social presence.
        </p>
      </div>
    </div>
  )
}

export default AnalyticsChart
