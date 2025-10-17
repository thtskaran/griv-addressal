// todo: remove mock functionality - This file contains all dummy data for the prototype

export type GrievanceStatus = 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected';
export type GrievanceCategory = 'Academic' | 'Hostel' | 'Facilities' | 'Admin' | 'Other';

export interface Grievance {
  id: string;
  title: string;
  category: GrievanceCategory;
  description: string;
  status: GrievanceStatus;
  userId: string;
  assignedTo?: string;
  adminReply?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
  attachmentUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'status_update' | 'reply' | 'resolved';
}

// todo: remove mock functionality
export const mockGrievances: Grievance[] = [
  {
    id: 'G001',
    title: 'Poor Wi-Fi Connectivity in Library',
    category: 'Facilities',
    description: 'The Wi-Fi connection in the library keeps dropping frequently, making it difficult to study and access online resources.',
    status: 'Resolved',
    userId: 'user123',
    assignedTo: 'IT Department',
    adminReply: 'We have upgraded the routers in the library. The issue should be resolved now.',
    rating: 5,
    feedback: 'Great response time! Issue fixed quickly.',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'G002',
    title: 'Hostel Room AC Not Working',
    category: 'Hostel',
    description: 'The air conditioning in room 204 has been non-functional for the past week.',
    status: 'In Progress',
    userId: 'user123',
    assignedTo: 'Maintenance',
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-13'),
  },
  {
    id: 'G003',
    title: 'Late Semester Results Publication',
    category: 'Academic',
    description: 'Results for the fall semester have not been published even after 3 weeks of exams completion.',
    status: 'Submitted',
    userId: 'user456',
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14'),
  },
  {
    id: 'G004',
    title: 'Cafeteria Food Quality Issue',
    category: 'Facilities',
    description: 'The food served in the cafeteria has been consistently below standard for the past month.',
    status: 'Resolved',
    userId: 'user789',
    assignedTo: 'Food Services',
    adminReply: 'We have changed the catering vendor and implemented new quality checks.',
    rating: 4,
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    id: 'G005',
    title: 'Library Book Return Process',
    category: 'Admin',
    description: 'The book return system is outdated and causes long queues during exam season.',
    status: 'In Progress',
    userId: 'user123',
    assignedTo: 'Library',
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-13'),
  },
];

// todo: remove mock functionality
export const mockNotifications: Notification[] = [
  {
    id: 'N001',
    title: 'Grievance Resolved',
    message: 'Your grievance "Poor Wi-Fi Connectivity in Library" has been resolved. Please rate your experience.',
    read: false,
    createdAt: new Date('2025-01-15'),
    type: 'resolved',
  },
  {
    id: 'N002',
    title: 'Status Update',
    message: 'Your grievance "Hostel Room AC Not Working" is now in progress. Assigned to Maintenance department.',
    read: false,
    createdAt: new Date('2025-01-13'),
    type: 'status_update',
  },
  {
    id: 'N003',
    title: 'Admin Reply',
    message: 'Admin has replied to your grievance "Cafeteria Food Quality Issue".',
    read: true,
    createdAt: new Date('2025-01-12'),
    type: 'reply',
  },
  {
    id: 'N004',
    title: 'Status Update',
    message: 'Your grievance "Library Book Return Process" status changed to In Progress.',
    read: false,
    createdAt: new Date('2025-01-13'),
    type: 'status_update',
  },
];
