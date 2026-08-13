/**
 * AI Match Interface Component
 * Natural language talent search using AI
 */

import React, { useState } from 'react'
import { Search, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { useAIMatch } from '../../hooks/usePhase4'

interface MatchedTalent {
  id: string
  name: string
  age?: number
  category?: string
  match_score: number
  profile_picture_url?: string
}

interface AIMatchInterfaceProps {
  onTalentSelect?: (talent: MatchedTalent) => void
  isPremium?: boolean
}

export const AIMatchInterface: React.FC<AIMatchInterfaceProps> = ({
  onTalentSelect,
  isPremium = true,
}) => {
  const [prompt, setPrompt] = useState('')
  const { results, loading, error, match } = useAIMatch()
  const [submitted, setSubmitted] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setSubmitted(true)
    await match(prompt)
  }

  const examplePrompts = [
    'Indonesian female model, 22-28 years old, for beauty campaign',
    'Male actor, 25-35, English speaking, for international production',
    'Dancer, any gender, strong social media presence',
    'Local influencer, fashion niche, 100k+ followers',
  ]

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Talent Match</h2>
        </div>
        <p className="text-gray-600">
          Describe the talent you're looking for in your own words. Our AI will extract 
          criteria and find matching profiles.
        </p>
      </div>

      {!isPremium && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-900">
            <span className="font-semibold">Premium Feature:</span> AI-powered talent matching 
            is available for premium clients only. Upgrade your account to use this feature.
          </p>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-900">
            What kind of talent are you looking for?
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 'Looking for a beautiful Indonesian woman aged 20-28 for a beauty campaign. Must speak English and have strong Instagram presence.'"
              disabled={!isPremium || loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none disabled:bg-gray-100"
              rows={4}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!prompt.trim() || !isPremium || loading}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search with AI
            </>
          )}
        </button>
      </form>

      {/* Example Prompts */}
      {!submitted && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Try these examples:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(example)}
                disabled={!isPremium}
                className="p-3 text-sm text-left bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {submitted && results && (
        <div className="space-y-6">
          {/* Extracted Criteria */}
          {results.extracted_criteria && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-4">Extracted Criteria</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {results.extracted_criteria.gender && (
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {results.extracted_criteria.gender}
                    </span>
                  </div>
                )}
                {results.extracted_criteria.ethnicity && (
                  <div>
                    <span className="text-gray-600">Ethnicity:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {results.extracted_criteria.ethnicity}
                    </span>
                  </div>
                )}
                {results.extracted_criteria.age_range && (
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {results.extracted_criteria.age_range[0]}-{results.extracted_criteria.age_range[1]}
                    </span>
                  </div>
                )}
                {results.extracted_criteria.language && (
                  <div>
                    <span className="text-gray-600">Language:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {results.extracted_criteria.language}
                    </span>
                  </div>
                )}
                {results.extracted_criteria.category && (
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {results.extracted_criteria.category}
                    </span>
                  </div>
                )}
                {results.extracted_criteria.height && (
                  <div>
                    <span className="text-gray-600">Height:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {results.extracted_criteria.height}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matching Talents */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Found {results.results_count} Matching Talents
            </h3>

            {results.matching_talents && results.matching_talents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.matching_talents.map((talent: MatchedTalent) => (
                  <div
                    key={talent.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    {talent.profile_picture_url && (
                      <img
                        src={talent.profile_picture_url}
                        alt={talent.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{talent.name}</h4>
                          {talent.category && (
                            <p className="text-sm text-gray-600">{talent.category}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">
                            {Math.round(talent.match_score)}%
                          </div>
                          <p className="text-xs text-gray-500">match</p>
                        </div>
                      </div>

                      {talent.age && (
                        <p className="text-sm text-gray-600 mb-4">Age: {talent.age}</p>
                      )}

                      <button
                        onClick={() => onTalentSelect?.(talent)}
                        className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-semibold"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No matching talents found. Try adjusting your criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIMatchInterface
