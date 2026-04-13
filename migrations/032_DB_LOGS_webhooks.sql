-- Migration 032: Webhook Management System
-- Purpose: Enable external service integrations via webhooks
-- Date: 2026-04-12

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  webhook_id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  
  -- Configuration
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  events JSON NOT NULL DEFAULT '[]', -- Array of event types
  
  -- Status & Monitoring
  status ENUM('active', 'inactive', 'failed') DEFAULT 'active',
  created_by_id VARCHAR(36) NOT NULL,
  
  -- Headers & Auth (optional)
  headers JSON DEFAULT '{}',
  auth_token VARCHAR(500) NULL,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_triggered TIMESTAMP NULL,
  last_response JSON DEFAULT NULL,
  
  -- Retry tracking
  retry_count INT DEFAULT 0,
  consecutive_failures INT DEFAULT 0,
  max_consecutive_failures INT DEFAULT 5,
  
  -- Audit
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_status (status),
  INDEX idx_created_by (created_by_id),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) 
    REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create webhook logs table (audit trail)
CREATE TABLE IF NOT EXISTS webhook_logs (
  log_id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  webhook_id VARCHAR(36) NOT NULL,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  
  -- Request/Response
  request_headers JSON DEFAULT NULL,
  request_body JSON DEFAULT NULL,
  
  response_status INT DEFAULT NULL,
  response_headers JSON DEFAULT NULL,
  response_body TEXT DEFAULT NULL,
  
  -- Timing
  duration_ms INT DEFAULT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Retry info
  retry_attempt INT DEFAULT 0,
  next_retry_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_webhook_id (webhook_id),
  INDEX idx_event_type (event_type),
  INDEX idx_executed_at (executed_at),
  INDEX idx_response_status (response_status),
  CONSTRAINT fk_webhook_id FOREIGN KEY (webhook_id) 
    REFERENCES webhooks(webhook_id) ON DELETE CASCADE
);

-- Create webhook queue table (for processing)
CREATE TABLE IF NOT EXISTS webhook_queue (
  queue_id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  webhook_id VARCHAR(36) NOT NULL,
  
  -- Event
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  
  -- Status
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  
  -- Retry
  attempt INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  priority INT DEFAULT 0, -- 0 = normal, 1 = high
  
  -- Timing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_webhook_id (webhook_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_for (scheduled_for),
  INDEX idx_priority (priority),
  CONSTRAINT fk_queue_webhook_id FOREIGN KEY (webhook_id) 
    REFERENCES webhooks(webhook_id) ON DELETE CASCADE
);

-- Create index for efficient queue polling
CREATE INDEX idx_webhook_queue_next_job 
ON webhook_queue(status, scheduled_for, priority DESC)
WHERE status IN ('pending', 'failed');

-- Create trigger to log webhook events
DELIMITER $
CREATE TRIGGER tr_webhook_executed
AFTER UPDATE ON webhooks
FOR EACH ROW
BEGIN
  IF OLD.last_triggered IS DISTINCT FROM NEW.last_triggered THEN
    INSERT INTO webhook_logs (webhook_id, event_type, executed_at)
    VALUES (NEW.webhook_id, 'webhook_executed', NOW());
  END IF;
END$
DELIMITER ;

-- Create view for active webhooks
CREATE OR REPLACE VIEW active_webhooks AS
SELECT 
  w.webhook_id,
  w.name,
  w.url,
  w.events,
  w.status,
  w.created_by_id,
  w.created_at,
  w.last_triggered,
  COUNT(wl.log_id) as total_calls,
  SUM(CASE WHEN wl.response_status >= 200 AND wl.response_status < 300 THEN 1 ELSE 0 END) as successful_calls,
  MAX(wl.executed_at) as last_execution
FROM webhooks w
LEFT JOIN webhook_logs wl ON w.webhook_id = wl.webhook_id
WHERE w.status = 'active' AND w.is_deleted = FALSE
GROUP BY w.webhook_id;

-- Create view for failed webhooks needing attention
CREATE OR REPLACE VIEW failed_webhooks AS
SELECT 
  w.webhook_id,
  w.name,
  w.status,
  w.consecutive_failures,
  w.last_triggered,
  wq.queue_id,
  wq.attempt,
  wq.max_attempts,
  wq.scheduled_for
FROM webhooks w
LEFT JOIN webhook_queue wq ON w.webhook_id = wq.webhook_id
WHERE (w.status = 'failed' OR w.consecutive_failures > 0)
AND w.is_deleted = FALSE
ORDER BY w.consecutive_failures DESC, w.last_triggered DESC;
