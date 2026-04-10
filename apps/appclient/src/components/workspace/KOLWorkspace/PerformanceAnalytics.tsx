// File: apps/appclient/src/components/workspace/KOLWorkspace/PerformanceAnalytics.tsx
// Component untuk menampilkan performance metrics dari KOL content

import React from 'react'
import { BarChart3, TrendingUp, Focus, Zap } from 'lucide-react'
import { useKOLWorkspaceStore } from '../../../store/useKOLWorkspaceStore'

export interface PerformanceAnalyticsProps {
  brief?: any
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ brief }) => {
  const { kanbanBoard, performanceMetrics, getCardMetrics } = useKOLWorkspaceStore()

  // Group approved content by talent for comparison
  const talentPerformance = kanbanBoard.approved.reduce(
    (acc, card) => {
      const metrics = getCardMetrics(card.id)
      if (!metrics) return acc

      const existing = acc.find((t) => t.talent_name === card.talent_name)
      if (existing) {
        existing.cards.push({ ...card, metrics })
        existing.total_clicks += metrics.total_clicks
        existing.total_conversions += metrics.conversion_count
        existing.average_engagement = (
          (existing.average_engagement * (existing.cards.length - 1) +
            metrics.unique_visitors) /
          existing.cards.length
        ).toFixed(0)
      } else {
        acc.push({
          talent_name: card.talent_name,
          talent_id: card.talent_id,
          cards: [{ ...card, metrics }],
          total_clicks: metrics.total_clicks,
          total_conversions: metrics.conversion_count,
          average_engagement: metrics.unique_visitors.toString(),
        })
      }
      return acc
    },
    [] as Array<any>
  )

  const sortedByClicks = [...talentPerformance].sort((a, b) => b.total_clicks - a.total_clicks)

  // Overall stats
  const totalClicks = kanbanBoard.approved.reduce(
    (sum, card) => sum + (getCardMetrics(card.id)?.total_clicks || 0),
    0
  )
  const totalConversions = kanbanBoard.approved.reduce(
    (sum, card) => sum + (getCardMetrics(card.id)?.conversion_count || 0),
    0
  )
  const avgBounceRate =
    kanbanBoard.approved.length > 0
      ? (
          kanbanBoard.approved.reduce(
            (sum, card) => sum + (getCardMetrics(card.id)?.bounce_rate || 0),
            0
          ) / kanbanBoard.approved.length
        ).toFixed(1)
      : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-600/30 to-blue-900/30 border border-blue-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-300 font-semibold">Total Clicks</p>
              <p className="text-2xl font-bold text-white mt-1">{totalClicks.toLocaleString()}</p>
            </div>
            <Focus size={32} className="text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/30 to-green-900/30 border border-green-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-300 font-semibold">Conversions</p>
              <p className="text-2xl font-bold text-white mt-1">{totalConversions.toLocaleString()}</p>
            </div>
            <TrendingUp size={32} className="text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/30 to-purple-900/30 border border-purple-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-300 font-semibold">Approved Content</p>
              <p className="text-2xl font-bold text-white mt-1">{kanbanBoard.approved.length}</p>
            </div>
            <BarChart3 size={32} className="text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-600/30 to-amber-900/30 border border-amber-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-300 font-semibold">Avg Bounce Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{avgBounceRate}%</p>
            </div>
            <Zap size={32} className="text-amber-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>

        <div className="space-y-3">
          {sortedByClicks.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No approved content yet</p>
          ) : (
            sortedByClicks.map((talent, idx) => (
              <div key={talent.talent_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{talent.talent_name}</p>
                      <p className="text-xs text-slate-400">{talent.cards.length} content pieces</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-400">{talent.total_clicks}</p>
                    <p className="text-xs text-slate-400">total clicks</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                    style={{
                      width: `${(talent.total_clicks / (sortedByClicks[0]?.total_clicks || 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-700/50 rounded px-2 py-1">
                    <p className="text-slate-400">Conversions</p>
                    <p className="text-white font-semibold">{talent.total_conversions}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded px-2 py-1">
                    <p className="text-slate-400">Avg Engagement</p>
                    <p className="text-white font-semibold">{talent.average_engagement}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded px-2 py-1">
                    <p className="text-slate-400">CTR</p>
                    <p className="text-white font-semibold">
                      {(
                        (talent.total_clicks /
                          (talent.total_clicks + talent.cards.reduce((sum: number) => sum + 1000, 0))) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Geographic Breakdown */}
      {kanbanBoard.approved.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kanbanBoard.approved.slice(0, 2).map((card) => {
              const metrics = getCardMetrics(card.id)
              if (!metrics) return null

              return (
                <div key={card.id} className="space-y-2">
                  <p className="text-sm font-semibold text-white">{card.talent_name}</p>

                  <div className="space-y-1">
                    {metrics.top_countries?.map((country, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 w-12">{country.country}</div>
                        <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-emerald-600"
                            style={{
                              width: `${(country.clicks / Math.max(...metrics.top_countries.map((c) => c.clicks))) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-white font-semibold w-12 text-right">
                          {country.clicks}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Device Breakdown */}
      {kanbanBoard.approved.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kanbanBoard.approved.slice(0, 2).map((card) => {
              const metrics = getCardMetrics(card.id)
              if (!metrics) return null

              const devices = Object.entries(metrics.device_breakdown || {})
              const total = devices.reduce((sum, [, count]) => sum + (count as number), 0)

              return (
                <div key={card.id} className="space-y-3">
                  <p className="text-sm font-semibold text-white">{card.talent_name}</p>

                  <div className="flex gap-3">
                    {devices.map(([device, count], idx) => {
                      const percentage = ((count as number) / (total || 1)) * 100
                      return (
                        <div key={idx} className="flex-1">
                          <div className="h-24 bg-slate-700 rounded-lg flex items-end justify-center p-2 relative">
                            <div
                              className="w-6 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all"
                              style={{ height: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-300 text-center mt-2 capitalize">
                            {device}
                          </p>
                          <p className="text-xs text-slate-500 text-center font-semibold">
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
