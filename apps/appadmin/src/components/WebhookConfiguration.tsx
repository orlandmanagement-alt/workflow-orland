import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';
import SuccessAlert from '@/components/ui/SuccessAlert';

interface Webhook {
  webhook_id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  created_at: string;
  last_triggered?: string;
  last_response?: {
    status: number;
    timestamp: string;
  };
}

const AVAILABLE_EVENTS = [
  { value: 'talent.profile.updated', label: 'Talent Profile Updated' },
  { value: 'booking.created', label: 'Booking Created' },
  { value: 'booking.status_changed', label: 'Booking Status Changed' },
  { value: 'project.created', label: 'Project Created' },
  { value: 'project.completed', label: 'Project Completed' },
  { value: 'contract.signed', label: 'Contract Signed' },
  { value: 'payment.processed', label: 'Payment Processed' },
  { value: 'dispute.created', label: 'Dispute Created' },
  { value: 'user.registered', label: 'User Registered' },
];

const POPULAR_SERVICES = [
  { name: 'Slack', icon: '💬', template: 'https://hooks.slack.com/services/...' },
  { name: 'Discord', icon: '🎮', template: 'https://discordapp.com/api/webhooks/...' },
  { name: 'Zapier', icon: '⚡', template: 'https://hooks.zapier.com/hooks/...' },
  { name: 'Make', icon: '🔗', template: 'https://hook.integromat.com/...' },
  { name: 'Custom', icon: '🔧', template: 'https://your-server.com/webhook' },
];

export const WebhookConfiguration: React.FC = () => {
  const { api } = useApi();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  // Fetch webhooks
  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/webhooks');
      setWebhooks(response.data.webhooks || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (webhook?: Webhook) => {
    if (webhook) {
      setEditingId(webhook.webhook_id);
      setFormData({
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', url: '', events: [] });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      setError('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/v1/webhooks/${editingId}`, formData);
        setSuccess('Webhook updated successfully');
      } else {
        await api.post('/api/v1/webhooks', formData);
        setSuccess('Webhook created successfully');
      }
      
      setShowModal(false);
      await fetchWebhooks();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save webhook');
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/webhooks/${webhookId}`);
      setSuccess('Webhook deleted');
      await fetchWebhooks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete webhook');
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      await api.post(`/api/v1/webhooks/${webhookId}/test`, {});
      setSuccess('Test payload sent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send test payload');
    }
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const applyTemplate = (template: string) => {
    setFormData(prev => ({ ...prev, url: template }));
  };

  if (loading) {
    return <LoadingSpinner message="Loading webhooks..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Webhooks</h1>
          <p className="text-slate-600 mt-1">
            Send real-time events to external services
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          + Create Webhook
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <ErrorAlert 
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
      {success && (
        <SuccessAlert 
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      {/* Popular Services */}
      {webhooks.length === 0 && !error && (
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <h3 className="font-bold text-slate-900 mb-4">Popular Integrations</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {POPULAR_SERVICES.map(service => (
              <button
                key={service.name}
                onClick={() => {
                  handleOpenModal();
                  applyTemplate(service.template);
                }}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg hover:shadow-md transition"
              >
                <span className="text-3xl">{service.icon}</span>
                <span className="text-sm font-medium text-slate-700">
                  {service.name}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length > 0 ? (
          webhooks.map(webhook => (
            <Card key={webhook.webhook_id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {webhook.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 font-mono">
                    {webhook.url}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    webhook.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : webhook.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {webhook.status}
                  </span>
                </div>
              </div>

              {/* Events */}
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Events ({webhook.events.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
                    >
                      {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Info */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4 p-3 bg-slate-50 rounded">
                <div>
                  <p className="text-slate-600">Created</p>
                  <p className="font-medium text-slate-900">
                    {new Date(webhook.created_at).toLocaleDateString()}
                  </p>
                </div>
                {webhook.last_triggered && (
                  <div>
                    <p className="text-slate-600">Last Triggered</p>
                    <p className="font-medium text-slate-900">
                      {new Date(webhook.last_triggered).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleTest(webhook.webhook_id)}
                  variant="secondary"
                  size="sm"
                >
                  Test
                </Button>
                <Button
                  onClick={() => handleOpenModal(webhook)}
                  variant="secondary"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(webhook.webhook_id)}
                  variant="secondary"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center bg-slate-50">
            <p className="text-slate-600">No webhooks created yet</p>
            <Button 
              onClick={() => handleOpenModal()}
              className="mt-4"
            >
              Create Your First Webhook
            </Button>
          </Card>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? 'Edit Webhook' : 'Create Webhook'}
        >
          <div className="space-y-6 p-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Webhook Name
              </label>
              <Input
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Slack Notifications"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Webhook URL
              </label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>

            {/* Events Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Events to Monitor
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {AVAILABLE_EVENTS.map(event => (
                  <label key={event.value} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-slate-700">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
              >
                {editingId ? 'Update' : 'Create'} Webhook
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WebhookConfiguration;
