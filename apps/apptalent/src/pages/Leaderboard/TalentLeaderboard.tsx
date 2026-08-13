import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type LeaderboardCategory = 'all' | 'photography' | 'videography' | 'modeling' | 'music' | 'design';

interface TalentRanking {
  rank: number;
  talent_id: string;
  talent_name: string;
  profile_image?: string;
  category: string;
  rating: number;
  booking_count: number;
  earnings_total: number;
  completion_rate: number;
  is_self?: boolean;
}

export const TalentLeaderboard: React.FC = () => {
  const { api } = useApi();
  const [period, setPeriod] = useState<LeaderboardPeriod>('monthly');
  const [category, setCategory] = useState<LeaderboardCategory>('all');
  const [rankings, setRankings] = useState<TalentRanking[]>([]);
  const [userRank, setUserRank] = useState<TalentRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: { value: LeaderboardCategory; label: string; icon: string }[] = [
    { value: 'all', label: 'All Talents', icon: '👥' },
    { value: 'photography', label: 'Photography', icon: '📸' },
    { value: 'videography', label: 'Videography', icon: '🎥' },
    { value: 'modeling', label: 'Modeling', icon: '👗' },
    { value: 'music', label: 'Music', icon: '🎵' },
    { value: 'design', label: 'Design', icon: '🎨' },
  ];

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/rankings/talents/${period}`, {
          params: {
            category: category !== 'all' ? category : undefined,
            limit: 100,
          },
        });

        setRankings(response.data.rankings || []);
        setUserRank(response.data.userRank || null);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.error || 'Failed to load leaderboard'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [period, category, api]);

  if (loading) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  if (error) {
    return <ErrorAlert title="Leaderboard Error" message={error} />;
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-500';
    if (rank === 2) return 'from-slate-300 to-slate-400';
    if (rank === 3) return 'from-orange-400 to-orange-500';
    return 'from-slate-200 to-slate-300';
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          🏆 Talent Leaderboard
        </h1>
        <p className="text-lg text-slate-600">
          See how you rank among your peers
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center gap-2 flex-wrap">
        {(['weekly', 'monthly', 'quarterly', 'yearly'] as LeaderboardPeriod[]).map(
          (p) => (
            <Button
              key={p}
              onClick={() => setPeriod(p)}
              variant={period === p ? 'primary' : 'secondary'}
              size="sm"
              className="capitalize"
            >
              {p}
            </Button>
          )
        )}
      </div>

      {/* Category Filter */}
      <div className="flex justify-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            variant={category === cat.value ? 'primary' : 'secondary'}
            size="sm"
            className="gap-2"
          >
            <span>{cat.icon}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Your Position Card (if ranked) */}
      {userRank && (
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-700 font-medium mb-1">Your Current Rank</p>
              <h2 className="text-4xl font-bold text-blue-600">
                #{userRank.rank}
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                {userRank.talent_name}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-slate-600 text-sm">Bookings</p>
                <p className="text-2xl font-bold text-slate-900">
                  {userRank.booking_count}
                </p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Rating</p>
                <p className="text-2xl font-bold text-slate-900">
                  {userRank.rating.toFixed(1)}⭐
                </p>
              </div>
              <div>
                <p className="text-slate-600 text-sm">Earnings</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${(userRank.earnings_total / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard Table */}
      <div className="space-y-3">
        {rankings.length > 0 ? (
          rankings.map((talent, idx) => {
            const medal = getMedalEmoji(talent.rank);
            const isUser = talent.is_self;

            return (
              <Card
                key={talent.talent_id}
                className={`p-4 ${
                  isUser
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : idx < 3
                    ? 'bg-gradient-to-r ' + getRankColor(talent.rank)
                    : 'hover:bg-slate-50'
                } transition`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="min-w-16 text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {medal ? (
                        <span className="text-3xl">{medal}</span>
                      ) : (
                        `#${talent.rank}`
                      )}
                    </p>
                  </div>

                  {/* Profile */}
                  <div className="flex items-center gap-3 flex-1">
                    {talent.profile_image && (
                      <img
                        src={talent.profile_image}
                        alt={talent.talent_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {talent.talent_name}
                        {isUser && (
                          <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500">{talent.category}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 text-center min-w-max">
                    <div>
                      <p className="text-xs text-slate-600">Bookings</p>
                      <p className="text-lg font-bold text-slate-900">
                        {talent.booking_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Rating</p>
                      <p className="text-lg font-bold text-slate-900">
                        {talent.rating.toFixed(1)}
                      </p>
                      <div className="text-xs">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < Math.floor(talent.rating) ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Completion</p>
                      <p className="text-lg font-bold text-slate-900">
                        {Math.round(talent.completion_rate)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Earnings</p>
                      <p className="text-lg font-bold text-slate-900">
                        ${(talent.earnings_total / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-12 text-center bg-slate-50">
            <p className="text-slate-600">No talents ranked for this period</p>
          </Card>
        )}
      </div>

      {/* Tips */}
      <Card className="p-6 bg-amber-50 border border-amber-200">
        <h3 className="font-bold text-slate-900 mb-2">💡 How to Improve Your Rank</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>✓ Complete more projects successfully</li>
          <li>✓ Maintain high ratings from clients</li>
          <li>✓ Build expertise in specific categories</li>
          <li>✓ Deliver projects on time</li>
          <li>✓ Provide excellent communication</li>
        </ul>
      </Card>
    </div>
  );
};

export default TalentLeaderboard;
