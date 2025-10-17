// src/lib/grievancesApi.ts
import apiClient from './apiClient';

// --- TypeScript Interfaces ---

export interface TagGroups {
  issue: string[];
  cluster: string[];
}

export interface ChatMessage {
  role: 'student' | 'admin';
  message: string;
  timestamp: string;
}

export interface Grievance {
  id: number;
  student_id: number;
  title: string;
  description?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'SOLVED' | 'REJECTED' | 'DROPPED';
  assigned_to: string;
  tags: string[];
  issue_tags: string[];
  cluster_tags: string[];
  cluster: string;
  s3_doc_urls: string[];
  drop_reason: string | null;
  tag_groups: TagGroups;
  created_at: string;
  updated_at: string;
}

export interface GrievanceDetails extends Grievance {
  chat: ChatMessage[];
}

export interface Document {
  filename: string;
  content_base64: string;
  content_type: string;
}

export interface NewGrievanceData {
  title: string;
  description?: string;
  issue_tags?: string[];
  cluster?: string;
  cluster_tags?: string[];
  documents?: Document[];
}

export interface UpdateGrievanceData {
  status?: 'NEW' | 'IN_PROGRESS' | 'SOLVED' | 'REJECTED' | 'DROPPED';
  assigned_to?: string;
  issue_tags?: string[];
  cluster?: string;
  cluster_tags?: string[];
  drop_reason?: string;
}

export interface ClusterAnalytics {
  cluster: string;
  count: number;
  top_tags: string[];
}

export interface AISuggestionSource {
  doc_id: string;
  chunk_id: string;
}

export interface AISuggestion {
  confidence: number;
  source: AISuggestionSource;
  summary: string;
}

export interface KBContextWindow {
  doc_name: string;
  excerpt: string;
}

export interface RelatedGrievance {
  id: number;
  title: string;
  status: string;
}

export interface AISuggestionsResponse {
  grievance_id: number;
  suggestions: AISuggestion[];
  kb_context_window: KBContextWindow[];
  related_grievances: RelatedGrievance[];
}

export interface GDriveFolderResponse {
  folder_id: string;
  request_id: string;
  status: string;
  start_page_token: string;
  polling_interval_seconds: number;
  next_poll_in_seconds: number;
}

export interface GDriveReindexResponse {
  status: string;
  folder_id: string;
  chunks_discovered: number;
  chunks_upserted: number;
  chunks_deleted: number;
  next_change_token: string;
  reindexed_at: string;
}

// --- Student/User API Functions ---

// GET /health
export const checkHealth = async () => {
  const { data } = await apiClient.get('/health');
  return data;
};

// POST /grievances
export const submitGrievance = async (grievanceData: NewGrievanceData) => {
  const { data } = await apiClient.post('/grievances', grievanceData);
  return data;
};

// GET /grievances?student_id=<id>
export const getGrievances = async (studentId?: number): Promise<{ grievances: Grievance[] }> => {
  const params = studentId ? { student_id: studentId } : {};
  const { data } = await apiClient.get('/grievances', { params });
  return data;
};

// GET /grievances/<grievance_id>
export const getGrievanceById = async (grievanceId: number): Promise<{ grievance: GrievanceDetails; chat: ChatMessage[] }> => {
  const { data } = await apiClient.get(`/grievances/${grievanceId}`);
  return data;
};

// POST /grievances/<grievance_id>/chat
export const addStudentChatMessage = async (grievanceId: number, message: string) => {
  const { data } = await apiClient.post(`/grievances/${grievanceId}/chat`, { message });
  return data;
};

// --- Admin API Functions ---

// GET /admin/grievances
export const getAdminGrievances = async (filters?: { 
  status?: string; 
  assigned_to?: string;
}): Promise<{ grievances: Grievance[] }> => {
  const { data } = await apiClient.get('/admin/grievances', { params: filters });
  return data;
};

// PATCH /admin/grievances/<grievance_id>
export const updateGrievance = async (grievanceId: number, updates: UpdateGrievanceData) => {
  const { data } = await apiClient.patch(`/admin/grievances/${grievanceId}`, updates);
  return data;
};

// POST /admin/grievances/<grievance_id>/chat
export const addAdminChatMessage = async (grievanceId: number, message: string) => {
  const { data } = await apiClient.post(`/admin/grievances/${grievanceId}/chat`, { message });
  return data;
};

// POST /admin/gdrive
export const registerGDriveFolder = async (folderId: string): Promise<GDriveFolderResponse> => {
  const { data } = await apiClient.post('/admin/gdrive', { folder_id: folderId });
  return data;
};

// GET /admin/gdrive/reindex
export const reindexGDriveFolder = async (): Promise<GDriveReindexResponse> => {
  const { data } = await apiClient.get('/admin/gdrive/reindex');
  return data;
};

// GET /admin/analytics/clusters
export const getClusterAnalytics = async (): Promise<{ analytics: ClusterAnalytics[] }> => {
  const { data } = await apiClient.get('/admin/analytics/clusters');
  return data;
};

// GET /admin/grievances/ai-summarize
export const getAISummary = async (): Promise<{ summary: string }> => {
  const { data } = await apiClient.get('/admin/grievances/ai-summarize');
  return data;
};

// --- AI Suggestions API Functions ---

// POST /ai/suggestions/preview
export const getAISuggestions = async (grievanceId: number): Promise<AISuggestionsResponse> => {
  const { data } = await apiClient.post('/ai/suggestions/preview', { grievance_id: grievanceId });
  return data;
};

// POST /ai/suggestions/confirm
export const confirmAISuggestion = async (
  grievanceId: number,
  suggestionId: string,
  accepted: boolean
) => {
  const { data } = await apiClient.post('/ai/suggestions/confirm', {
    grievance_id: grievanceId,
    suggestion_id: suggestionId,
    accepted,
  });
  return data;
};