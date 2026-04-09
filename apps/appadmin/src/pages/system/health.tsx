import React, { useEffect, useState } from 'react';
import { Activity, Zap, Database, AlertTriangle, CheckCircle, Clock, TrendingUp, Loader2 } from 'lucide-react';
import axios from 'axios';

interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  timestamp: string;
}

interface ServiceHealth {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  errorRate: number;
  requestsPerSecond: number;
}

interface DatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  queryLatency: number;
  storageUsed: number;
  storageTotal: number;
}

interface MetricsData {
  api: ServiceHealth;
  database: ServiceHealth;
  cache: ServiceHealth;
  databaseMetrics: DatabaseMetrics;
}

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<MetricsData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_BASE = 'https://api.orlandmanagement.com/api/v1';

  useEffect(() => {
    fetchHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      // Mock health data - in production, this would come from actual metrics endpoint
      const mockData: MetricsData = {
        api: {
          name: 'API Server',
          status: 'online',
          responseTime: 145,
          errorRate: 0.02,
          requestsPerSecond: 450,
        },
        database: {
          name: 'Database',
          status: 'online',
          responseTime: 28,
          errorRate: 0,
          requestsPerSecond: 285,
        },
        cache: {
          name: 'Cache Layer',
          status: 'online',
          responseTime: 5,
          errorRate: 0,
          requestsPerSecond: 920,
        },
        databaseMetrics: {
          totalConnections: 100,
          activeConnections: 27,
          queryLatency: 28,
          storageUsed: 2.4,
          storageTotal: 10,
        },
      };

      setHealth(mockData);
      setSystemStatus({
        status: 'healthy',
        uptime: 99.98,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-600' };
      case 'degraded':
        return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600' };
      case 'critical':
      case 'offline':
        return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600' };
      default:
        return { bg: 'bg-slate-50 dark:bg-slate-700', border: 'border-slate-200 dark:border-slate-600', text: 'text-slate-600' };
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'online' || status === 'healthy') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'degraded') return <AlertTriangle className="text-yellow-500" size={20} />;
    return <AlertTriangle className="text-red-500" size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="text-green-500" size={32} />
            System Health Monitor
          </h1>
          <p className="text-slate-500 mt-1">Real-time infrastructure and service status</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Auto-refresh</span>
        </label>
      </div>

      {/* Overall Status Card */}
      {systemStatus && (
        <div className={`rounded-xl border p-6 ${getStatusColor(systemStatus.status).bg} ${getStatusColor(systemStatus.status).border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                {systemStatus.status === 'healthy' ? '✅ All Systems Operational' : '⚠️ ' + systemStatus.status.toUpperCase()}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Last updated: {new Date(systemStatus.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">{systemStatus.uptime}%</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Uptime</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Health Cards */}
      <div className="grid grid-cols-3 gap-4">
        {health && [health.api, health.database, health.cache].map((service, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-6 ${getStatusColor(service.status).bg} ${getStatusColor(service.status).border}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{service.name}</h3>
                <p className={`text-sm font-semibold mt-1 ${getStatusColor(service.status).text}`}>
                  {service.status.toUpperCase()}
                </p>
              </div>
              {getStatusIcon(service.status)}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Response Time</span>
                <span className="font-bold text-slate-900 dark:text-white">{service.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Error Rate</span>
                <span className={`font-bold ${service.errorRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(service.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Requests/s</span>
                <span className="font-bold text-slate-900 dark:text-white">{service.requestsPerSecond}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Metrics */}
      {health && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <Database className="text-blue-500" size={24} />
            Database Metrics
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Connection Pool */}
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Connections</p>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Active</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {health.databaseMetrics.activeConnections} / {health.databaseMetrics.totalConnections}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{
                        width: `${(health.databaseMetrics.activeConnections / health.databaseMetrics.totalConnections) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Storage</p>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Used</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {health.databaseMetrics.storageUsed} / {health.databaseMetrics.storageTotal} GB
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all"
                      style={{
                        width: `${(health.databaseMetrics.storageUsed / health.databaseMetrics.storageTotal) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Query Latency */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Query Latency (avg)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{health.databaseMetrics.queryLatency}</span>
                <span className="text-sm text-slate-500">ms</span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Database Status</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                <span className="font-bold text-slate-900 dark:text-white">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <AlertTriangle className="text-yellow-500" size={24} />
          Recent Alerts
        </h2>

        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">All Systems Operational</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">No critical alerts in the last 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
