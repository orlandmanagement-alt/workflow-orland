// Skema JSON untuk API Hono/D1 (Workspace & Operations)

// --- KANBAN BOARD SYSTEM (KOL / DIGITAL AGENCY) ---
// Payload API: GET /projects/:id/workspace/kanban
// Payload API: PUT /projects/:id/workspace/content/:content_id
export interface ContentBoardCard {
  id: string;
  talent_id: string;
  talent_name: string;
  talent_avatar: string;
  post_type: 'tiktok' | 'ig_reels' | 'youtube_shorts';
  status: 'brief_sent' | 'draft_submitted' | 'revision' | 'approved' | 'live';
  preview_url?: string;     // Link draft video dari talent
  live_url?: string;        // Link final yang sudah di-publish
  client_feedback?: string; // Komentar / Revisi dari klien
  metrics?: {
    views: number;
    likes: number;
    shares: number;
  };
  last_updated: string;
}

export interface KanbanBoardState {
  project_id: string;
  columns: {
    brief_sent: ContentBoardCard[];
    draft_submitted: ContentBoardCard[];
    revision: ContentBoardCard[];
    approved: ContentBoardCard[];
    live: ContentBoardCard[];
  }
}

// --- CALL SHEET GENERATOR (PH / TVC) ---
// Payload API: POST /projects/:id/workspace/call-sheet
export interface CallSheetPayload {
  project_id: string;
  call_date: string;
  general_call_time: string;
  location: {
    name: string;
    address: string;
    maps_url: string;
  };
  wardrobe_notes: string;
  scenes: {
    scene_number: string;
    description: string;
    expected_time: string;
    talent_ids_involved: string[];
  }[];
}

// --- ATTENDANCE SYSTEM (EO / WO) ---
// Payload API: GET /projects/:id/workspace/attendance
// Payload API: POST /projects/:id/workspace/attendance/log (Apptalent scan QR -> Trigger ke server)
export interface AttendanceLog {
  id: string;
  talent_id: string;
  talent_name: string;
  role_name: string; // Misal: "Usher VVIP"
  qr_code_scanned: boolean;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
  check_out_time?: string;
  location_verified: boolean;
}

export interface EventRundown {
  id: string;
  start_time: string;
  end_time: string;
  activity: string;
  pic_name: string;
  talent_role_ids: string[];
}
