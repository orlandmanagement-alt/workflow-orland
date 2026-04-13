-- Migration 031: Talent Recommendations & Public Invite System
-- Purpose: Enable public invite link sharing for talent discovery
-- Date: 2026-04-12
-- Status: Active

-- Create talent_recommendations table
CREATE TABLE IF NOT EXISTS talent_recommendations (
  recommendation_id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  
  -- Core References
  talent_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  agency_id VARCHAR(36) NOT NULL,
  created_by_id VARCHAR(36) NOT NULL,
  
  -- Invite Token & Status
  invite_token VARCHAR(256) NOT NULL UNIQUE,
  invite_method ENUM('link', 'email', 'sms', 'manual') DEFAULT 'link',
  status ENUM('sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled') DEFAULT 'sent',
  
  -- Expiration & Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  viewed_at TIMESTAMP NULL,
  responded_at TIMESTAMP NULL,
  
  -- Metadata & Notes
  match_score DECIMAL(5, 2) DEFAULT 0.00,
  reason_text VARCHAR(500) NULL,
  metadata JSON DEFAULT '{}',
  
  -- Audit
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_talent_id (talent_id),
  INDEX idx_project_id (project_id),
  INDEX idx_agency_id (agency_id),
  INDEX idx_invite_token (invite_token),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by_id),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at),
  
  CONSTRAINT fk_talent_id FOREIGN KEY (talent_id) 
    REFERENCES talents(talent_id) ON DELETE CASCADE,
  CONSTRAINT fk_project_id FOREIGN KEY (project_id) 
    REFERENCES projects(project_id) ON DELETE CASCADE,
  CONSTRAINT fk_agency_id FOREIGN KEY (agency_id) 
    REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by_id) 
    REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create recommendation_claims table (tracks when unauthenticated user claims invite)
CREATE TABLE IF NOT EXISTS recommendation_claims (
  claim_id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
  recommendation_id VARCHAR(36) NOT NULL UNIQUE,
  new_user_id VARCHAR(36) NULL,  -- NULL if claim not yet processed
  claimed_at TIMESTAMP NULL,
  redirect_to_project BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_recommendation_id (recommendation_id),
  INDEX idx_new_user_id (new_user_id),
  INDEX idx_claimed_at (claimed_at),
  
  CONSTRAINT fk_recommendation_id FOREIGN KEY (recommendation_id) 
    REFERENCES talent_recommendations(recommendation_id) ON DELETE CASCADE,
  CONSTRAINT fk_new_user_id FOREIGN KEY (new_user_id) 
    REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create index for public invite link lookups
CREATE INDEX idx_public_invite_token ON talent_recommendations(invite_token, status, expires_at);

-- Create view for active invites
CREATE OR REPLACE VIEW active_invites AS
SELECT 
  tr.recommendation_id,
  tr.invite_token,
  tr.talent_id,
  tr.project_id,
  tr.agency_id,
  tr.created_by_id,
  tr.match_score,
  tr.reason_text,
  tr.status,
  tr.created_at,
  tr.expires_at,
  p.project_title,
  p.description AS project_description,
  p.budget,
  p.deadline,
  t.name AS talent_name,
  t.profile_image,
  u.company_name,
  u.logo_url
FROM talent_recommendations tr
JOIN projects p ON tr.project_id = p.project_id
JOIN talents t ON tr.talent_id = t.talent_id
JOIN users u ON tr.agency_id = u.user_id
WHERE tr.status IN ('sent', 'viewed')
AND tr.expires_at > NOW();

-- Add triggers for auto-expiration cleanup
DELIMITER $
CREATE TRIGGER tr_expire_old_invites
AFTER INSERT ON talent_recommendations
FOR EACH ROW
BEGIN
  UPDATE talent_recommendations 
  SET status = 'expired'
  WHERE expires_at < NOW() AND status != 'accepted' AND status != 'rejected';
END$
DELIMITER ;
