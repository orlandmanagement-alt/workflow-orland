// File: apps/appclient/src/components/workspace/EOWorkspace/InteractiveTimeline.tsx
// Component untuk drag-and-drop rundown timeline management

import React, { useState } from 'react'
import { GripVertical, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useEOWorkspaceStore } from '../../../store/useEOWorkspaceStore'

export interface InteractiveTimelineProps {
  projectId: string
}

export const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ projectId }) => {
  const {
    rundown,
    draggedSegment,
    saveRundown,
    finalizeRundown,
    updateRundownSegment,
    startDragSegment,
    dropSegment,
    isSavingRundown,
  } = useEOWorkspaceStore()

  const [newSegmentName, setNewSegmentName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!rundown) return <div className="text-center text-slate-400">No rundown loaded</div>

  const handleDragStart = (segment: any) => {
    startDragSegment(segment)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-500/10')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-500/10')
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-500/10')
    dropSegment(index)
  }

  const handleSave = async () => {
    try {
      await saveRundown(projectId)
      alert('Rundown saved successfully!')
    } catch (error) {
      alert('Failed to save rundown')
    }
  }

  const handleFinalize = async () => {
    if (!confirm('Are you sure? Finalizing will lock the rundown for execution.')) return
    try {
      await finalizeRundown(projectId)
      alert('Rundown finalized!')
    } catch (error) {
      alert('Failed to finalize rundown')
    }
  }

  // Timeline visualization
  const timelineSegments = rundown.timeline.sort((a, b) => a.order - b.order)
  const totalDuration = timelineSegments.reduce((sum, seg) => sum + seg.duration_minutes, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Event Rundown - {rundown.event_date}
          </h3>
          <p className="text-sm text-slate-400">
            Total Duration: {totalDuration} minutes | Version {rundown.version}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSavingRundown}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
          >
            {isSavingRundown ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleFinalize}
            disabled={rundown.is_finalized}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
          >
            {rundown.is_finalized ? 'Finalized' : 'Finalize'}
          </button>
        </div>
      </div>

      {/* Timeline visual bar */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex gap-1 h-8">
          {timelineSegments.map((seg) => {
            const widthPercent = (seg.duration_minutes / totalDuration) * 100
            return (
              <div
                key={seg.id}
                title={seg.segment_name}
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-xs text-white font-semibold truncate hover:from-blue-500 hover:to-purple-500 transition-all"
                style={{ flex: `${widthPercent}%` }}
              >
                {seg.duration_minutes}m
              </div>
            )
          })}
        </div>
      </div>

      {/* Draggable segments list */}
      <div className="space-y-2">
        {timelineSegments.map((segment, index) => (
          <div
            key={segment.id}
            draggable
            onDragStart={() => handleDragStart(segment)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 transition-all cursor-grab active:cursor-grabbing group`}
            style={{
              opacity: draggedSegment?.id === segment.id ? 0.5 : 1,
            }}
          >
            <div className="flex items-start gap-3">
              <GripVertical
                size={18}
                className="text-slate-500 group-hover:text-slate-300 mt-1 flex-shrink-0"
              />

              <div className="flex-1 space-y-2">
                {editingId === segment.id ? (
                  <input
                    autoFocus
                    value={segment.segment_name}
                    onChange={(e) =>
                      updateRundownSegment(segment.id, {
                        segment_name: e.target.value,
                      })
                    }
                    onBlur={() => setEditingId(null)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                  />
                ) : (
                  <h4
                    className="font-semibold text-white cursor-pointer hover:text-blue-400"
                    onClick={() => setEditingId(segment.id)}
                  >
                    {segment.segment_name}
                  </h4>
                )}

                {/* Time and metadata */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>
                    {segment.start_time} - {segment.end_time}
                  </span>
                  <span className="px-2 py-1 bg-slate-700 rounded">
                    {segment.duration_minutes}min
                  </span>
                  <span className="px-2 py-1 bg-slate-700 rounded">{segment.stage}</span>
                  {segment.status === 'completed' && (
                    <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded">
                      ✓ Completed
                    </span>
                  )}
                </div>

                {/* Talents and notes */}
                {segment.talent_ids.length > 0 && (
                  <p className="text-xs text-slate-300">{segment.talent_ids.length} talents</p>
                )}
                {segment.notes && (
                  <p className="text-xs text-slate-400 italic">Note: {segment.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => updateRundownSegment(segment.id, { status: 'in_progress' })}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
                >
                  Start
                </button>
                <button
                  onClick={() => updateRundownSegment(segment.id, { status: 'completed' })}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add new segment */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 border-2 border-dashed border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Segment
        </button>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <input
            autoFocus
            value={newSegmentName}
            onChange={(e) => setNewSegmentName(e.target.value)}
            placeholder="Segment name (e.g., Opening Performance)"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <input
              type="time"
              defaultValue="18:00"
              placeholder="Start time"
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
            />
            <input
              type="time"
              defaultValue="18:15"
              placeholder="End time"
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
            />
            <select className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs">
              <option>main_stage</option>
              <option>secondary_stage</option>
              <option>outdoor_area</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewSegmentName('')
              }}
              className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-600/30 rounded-lg text-xs text-yellow-300">
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        <p>Drag segments to reorder. Times will be auto-calculated based on sequence.</p>
      </div>
    </div>
  )
}
