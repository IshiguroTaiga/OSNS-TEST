
import { College, Course, Announcement } from './types';

export const COLLEGES: College[] = [
  'College of Agriculture, Food and Sustainable Development',
  'College of Aquatic Science and Applied Technology',
  'College of Arts and Sciences',
  'College of Business, Economics and Accountancy',
  'College of Computing and Information Sciences',
  'College of Engineering',
  'College of Health Sciences',
  'College of Industrial Technology',
  'College of Teacher Education',
  'College of Medicine',
  'College of Law',
  'College of Dentistry',
  'College of Veterinary Medicine',
  'Graduate School'
];

export const MOCK_COURSES: Course[] = [
  // Agriculture
  { id: 'c1', code: 'AGRI 101', title: 'Fundamentals of Crop Science', college: 'College of Agriculture, Food and Sustainable Development', description: 'Basic principles of plant growth and management.', credits: 3 },
  { id: 'c2', code: 'FOODSCI 201', title: 'Food Chemistry', college: 'College of Agriculture, Food and Sustainable Development', description: 'Chemical processes and interactions of all biological and non-biological components of foods.', credits: 3 },
  
  // Aquatic Science
  { id: 'c3', code: 'AQUACUL 101', title: 'Introduction to Aquaculture', college: 'College of Aquatic Science and Applied Technology', description: 'Principles and practices of farming aquatic organisms.', credits: 3 },
  { id: 'c4', code: 'MARBIO 202', title: 'Marine Ecology', college: 'College of Aquatic Science and Applied Technology', description: 'Study of the interactions among marine organisms and their environment.', credits: 4 },

  // Arts and Sciences
  { id: 'c5', code: 'BIO 101', title: 'General Biology', college: 'College of Arts and Sciences', description: 'Study of life and living organisms.', credits: 4 },
  { id: 'c6', code: 'MATH 101', title: 'College Algebra', college: 'College of Arts and Sciences', description: 'Functions and graphs, systems of equations.', credits: 3 },

  // Business
  { id: 'c7', code: 'ACCTG 101', title: 'Financial Accounting 1', college: 'College of Business, Economics and Accountancy', description: 'Principles and procedures of the accounting cycle.', credits: 3 },
  { id: 'c8', code: 'ECON 201', title: 'Microeconomics', college: 'College of Business, Economics and Accountancy', description: 'Individual consumer and producer behavior.', credits: 3 },

  // Computing
  { id: 'c9', code: 'IT 101', title: 'Introduction to Computing', college: 'College of Computing and Information Sciences', description: 'Fundamental concepts of computer hardware and software.', credits: 3 },
  { id: 'c10', code: 'CMPSC 146', title: 'Software Engineering', college: 'College of Computing and Information Sciences', description: 'Systematic approach to software development.', credits: 3 },

  // Engineering
  { id: 'c11', code: 'ENGG 101', title: 'Engineering Graphics', college: 'College of Engineering', description: 'Principles of drafting and visualization.', credits: 2 },
  { id: 'c12', code: 'CE 201', title: 'Statics of Rigid Bodies', college: 'College of Engineering', description: 'Analysis of force systems in equilibrium.', credits: 3 },

  // Health Sciences
  { id: 'c13', code: 'NURS 101', title: 'Fundamentals of Nursing', college: 'College of Health Sciences', description: 'Basic nursing concepts and skills.', credits: 5 },
  { id: 'c14', code: 'PHARM 201', title: 'Pharmacology 1', college: 'College of Health Sciences', description: 'Study of drug action and usage.', credits: 3 },

  // Industrial Tech
  { id: 'c15', code: 'AUTO 101', title: 'Automotive Technology', college: 'College of Industrial Technology', description: 'Principles of automotive maintenance and repair.', credits: 3 },
  
  // Teacher Education
  { id: 'c16', code: 'EDUC 101', title: 'Child and Adolescent Development', college: 'College of Teacher Education', description: 'Phases of growth and development of students.', credits: 3 },

  // Medicine
  { id: 'c17', code: 'MED 101', title: 'Gross Anatomy', college: 'College of Medicine', description: 'Detailed study of human structures.', credits: 8 },

  // Law
  { id: 'c18', code: 'LAW 101', title: 'Constitutional Law 1', college: 'College of Law', description: 'Study of the Philippine Constitution.', credits: 4 },

  // Dentistry
  { id: 'c19', code: 'DENT 101', title: 'Oral Anatomy', college: 'College of Dentistry', description: 'Anatomy and morphology of human teeth.', credits: 4 },

  // Veterinary Medicine
  { id: 'c20', code: 'VETMED 101', title: 'Veterinary Anatomy 1', college: 'College of Veterinary Medicine', description: 'Systemic anatomy of domestic animals.', credits: 5 },

  // Graduate School
  { id: 'c21', code: 'GRAD 501', title: 'Research Methodology', college: 'Graduate School', description: 'Advanced research techniques and ethics.', credits: 3 }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Second Semester Enrollment AY 2025-2026', date: 'January 12, 2026', content: 'Final week for adding/dropping subjects. Please visit your college registrar.', category: 'Enrollment' },
  { id: 'a2', title: '2026 Scholarship Renewal', date: 'January 18, 2026', content: 'Submit your 1st Semester grades to the Office of Student Affairs for renewal.', category: 'Scholarship' },
  { id: 'a3', title: 'MMSU 48th Foundation Anniversary', date: 'January 20, 2026', content: 'Happy Foundation Day, Stallions! Join us for the grand celebration at the Sunken Garden.', category: 'Event' },
  { id: 'a4', title: 'Luzon-wide Student Summit 2026', date: 'January 05, 2026', content: 'MMSU delegates requested to attend the orientation at the CIT Amphitheater.', category: 'Event' },
  { id: 'a5', title: 'Final Grade Encoding 1st Sem', date: 'December 20, 2025', content: 'All faculty must complete grade encoding by 11:59 PM tonight.', category: 'Academic' },
  { id: 'a6', title: 'Christmas Break Schedule', date: 'December 15, 2025', content: 'Offices will be closed from Dec 22 until Jan 03 for the holiday season.', category: 'Event' },
  { id: 'a7', title: 'Inter-College Sports Fest Results', date: 'November 30, 2025', content: 'CCIS reigns supreme in E-Sports; CBEA takes the overall championship.', category: 'Event' },
  { id: 'a8', title: 'Midterm Assessment Period', date: 'October 15, 2025', content: 'Prepare for midterm examinations. Good luck, Stallions!', category: 'Academic' },
  { id: 'a9', title: 'CHED Merit Scholarship Application', date: 'September 10, 2025', content: 'Accepting applications for the new batch of scholars for the next semester.', category: 'Scholarship' },
];
