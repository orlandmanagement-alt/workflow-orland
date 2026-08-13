/**
 * Mission 5: Analytics Dashboard - Talent Dashboard
 * 
 * Purpose: Personal performance analytics for talents
 * ENTERPRISE: Fetches real data from /api/v1/talents/me/analytics
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, Star, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
// @ts-ignore
import { MetricCard } from '../common/AnalyticsCommon';

export default function TalentDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ENTERPRISE: Fetch analytics from API
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['talents-analytics'],
    queryFn: async () => {
      const response = await api('/talents/me/analytics');
      return response?.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <RefreshCw size={32} className="text-brand-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
        <p className="font-bold">Failed to load analytics</p>
        <p className="text-sm mt-1">Try refreshing the page</p>
      </div>
    );
  }

  // Fallback to mock data if API returns empty
  const data = analyticsData || {
    views_week: 0,
    views_month: 0,
    views_total: 0,
    wishlists: 0,
    ranking: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Overview</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Your profile views and engagement metrics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Views This Week</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {data.views_week?.toLocaleString() || 0}
                </p>
              </div>
              <TrendingUp size={40} className="text-indigo-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Views This Month</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {data.views_month?.toLocaleString() || 0}
                </p>
              </div>
              <TrendingUp size={40} className="text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Views</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {data.views_total?.toLocaleString() || 0}
                </p>
              </div>
              <CheckCircle size={40} className="text-green-500 opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Metrics */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Engagement</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Client interest and ranking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Wishlists</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {data.wishlists?.toLocaleString() || 0}
                </p>
              </div>
              <Star size={40} className="text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Ranking Position</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  #{data.ranking?.toLocaleString() || '—'}
                </p>
              </div>
              <TrendingUp size={40} className="text-purple-500 opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
          <p className="text-gray-600 text-sm mt-1">
            Feedback from your clients
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {data.recentReviews && data.recentReviews.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {data.recentReviews.map((review: any, idx: number) => (
                <div key={idx} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={
                            i < Math.floor(review.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-gray-700">{review.feedback}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-600">
              No reviews yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
