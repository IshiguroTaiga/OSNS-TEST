
export type Campus = 'Batac' | 'Laoag' | 'Currimao' | 'Dingras';

export type College = 
  | 'College of Agriculture, Food and Sustainable Development'
  | 'College of Aquatic Science and Applied Technology'
  | 'College of Arts and Sciences'
  | 'College of Business, Economics and Accountancy'
  | 'College of Computing and Information Sciences'
  | 'College of Engineering'
  | 'College of Health Sciences'
  | 'College of Industrial Technology'
  | 'College of Teacher Education'
  | 'College of Medicine'
  | 'College of Law'
  | 'College of Dentistry'
  | 'College of Veterinary Medicine'
  | 'Graduate School';

export type ChatMode = 'GENERAL' | 'TUTORING';

export interface GroundingLink {
  title: string;
  uri: string;
  type?: 'search' | 'maps';
}

export interface Course {
  id: string;
  code: string;
  title: string;
  college: College;
  description: string;
  credits: number;
}

export interface Tutor {
  id: string;
  name: string;
  college: College;
  subjects: string[];
  rating: number;
  avatar: string;
  bio: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  groundingLinks?: GroundingLink[];
}

export interface UserProfile {
  name: string;
  email: string;
  college: College;
  campus: Campus;
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  studentId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  category: 'Academic' | 'Event' | 'Scholarship' | 'Enrollment';
}
