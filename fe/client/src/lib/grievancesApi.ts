// src/lib/grievancesApi.ts
import apiClient from './apiClient';

// --- TypeScript Interfaces ---
export interface Grievance {
  id: number;
  title: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  // Add any other fields you need from the GET /grievances endpoint
}

export interface GrievanceDetails extends Grievance {
  description: string;
  s3_doc_urls: string[];
  chat: { role: string; message: string; timestamp: string }[];
}

export interface NewGrievanceData {
  title: string;
  description: string;
  docs?: FileList;
}

export interface ChatMessage {
  role: 'user' | 'admin';
  message: string;
}


// --- API Functions ---

// GET /grievances
export const getGrievances = async (): Promise<Grievance[]> => {
  const { data } = await apiClient.get('/grievances');
  return data;
};

// GET /grievances/{id}
export const getGrievanceById = async (id: string): Promise<GrievanceDetails> => {
  const { data } = await apiClient.get(`/grievances/${id}`);
  return data;
};

// POST /grievances
export const submitGrievance = async (grievanceData: NewGrievanceData) => {
  const formData = new FormData();
  formData.append('title', grievanceData.title);
  formData.append('description', grievanceData.description);
  if (grievanceData.docs) {
    Array.from(grievanceData.docs).forEach(file => formData.append('docs', file));
  }
  const { data } = await apiClient.post('/grievances', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// POST /grievances/{id}/chat
export const addChatMessage = async ({ id, ...message }: { id: string } & ChatMessage) => {
  const { data } = await apiClient.post(`/grievances/${id}/chat`, message);
  return data;
};