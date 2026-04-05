// Training Platform Types
// Generated from database schema

// ============================================
// Enums
// ============================================

export type UserRole = 'admin' | 'trainer' | 'learner';
export type SOPStatus = 'draft' | 'published' | 'archived';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';

// ============================================
// SOP Categories
// ============================================

export interface SOPCategory {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  // Virtual fields for tree structure
  children?: SOPCategory[];
  level?: number;
}

export interface SOPCategoryInsert {
  name: string;
  parent_id?: string | null;
  icon?: string | null;
  workspace_id: string;
}

export interface SOPCategoryUpdate {
  name?: string;
  parent_id?: string | null;
  icon?: string | null;
}

// ============================================
// SOPs (Standard Operating Procedures)
// ============================================

export interface SOP {
  id: string;
  title: string;
  content: Record<string, any>;
  category_id: string | null;
  version: number;
  status: SOPStatus;
  created_by: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  category?: SOPCategory;
  quiz?: Quiz;
  documents?: SOPDocument[];
  created_by_profile?: Profile;
}

export interface SOPInsert {
  title: string;
  content?: Record<string, any>;
  category_id?: string | null;
  status?: SOPStatus;
  created_by: string;
  workspace_id: string;
}

export interface SOPUpdate {
  title?: string;
  content?: Record<string, any>;
  category_id?: string | null;
  version?: number;
  status?: SOPStatus;
}

// ============================================
// Quizzes
// ============================================

export interface Quiz {
  id: string;
  sop_id: string;
  title: string;
  description: string | null;
  pass_threshold: number;
  is_graded: boolean;
  time_limit_minutes: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  questions?: QuizQuestion[];
  sop?: SOP;
}

export interface QuizInsert {
  sop_id: string;
  title: string;
  description?: string | null;
  pass_threshold?: number;
  is_graded?: boolean;
  time_limit_minutes?: number | null;
  created_by: string;
}

export interface QuizUpdate {
  title?: string;
  description?: string | null;
  pass_threshold?: number;
  is_graded?: boolean;
  time_limit_minutes?: number | null;
}

// ============================================
// Quiz Questions
// ============================================

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  type: QuestionType;
  question: string;
  options: QuizOption[] | null;
  correct_answer: string | null;
  points: number;
  order_index: number;
  created_at: string;
}

export interface QuizQuestionInsert {
  quiz_id: string;
  type: QuestionType;
  question: string;
  options?: QuizOption[] | null;
  correct_answer?: string | null;
  points?: number;
  order_index?: number;
}

export interface QuizQuestionUpdate {
  type?: QuestionType;
  question?: string;
  options?: QuizOption[] | null;
  correct_answer?: string | null;
  points?: number;
  order_index?: number;
}

// ============================================
// Assignments
// ============================================

export interface Assignment {
  id: string;
  sop_id: string;
  user_id: string;
  assigned_by: string;
  due_date: string | null;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  // Joined relations
  sop?: SOP;
  user?: Profile;
  assigned_by_profile?: Profile;
}

export interface AssignmentInsert {
  sop_id: string;
  user_id: string;
  assigned_by: string;
  due_date?: string | null;
  status?: AssignmentStatus;
}

export interface AssignmentUpdate {
  due_date?: string | null;
  status?: AssignmentStatus;
}

// ============================================
// Completions
// ============================================

export interface Completion {
  id: string;
  user_id: string;
  sop_id: string;
  quiz_id: string | null;
  score: number | null;
  passed: boolean | null;
  time_spent_seconds: number | null;
  completed_at: string;
  answers: Record<string, any> | null;
  // Joined relations
  sop?: SOP;
  quiz?: Quiz;
  user?: Profile;
  certificate?: Certificate;
}

export interface CompletionInsert {
  user_id: string;
  sop_id: string;
  quiz_id?: string | null;
  score?: number | null;
  passed?: boolean | null;
  time_spent_seconds?: number | null;
  answers?: Record<string, any> | null;
}

// ============================================
// Certificates
// ============================================

export interface Certificate {
  id: string;
  user_id: string;
  sop_id: string;
  completion_id: string;
  certificate_number: string;
  issued_at: string;
  expires_at: string | null;
  pdf_url: string | null;
  // Joined relations
  sop?: SOP;
  user?: Profile;
  completion?: Completion;
}

export interface CertificateInsert {
  user_id: string;
  sop_id: string;
  completion_id: string;
  expires_at?: string | null;
  pdf_url?: string | null;
}

// ============================================
// SOP Documents
// ============================================

export interface SOPDocument {
  id: string;
  sop_id: string;
  filename: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  extracted_text: string | null;
  uploaded_by: string;
  created_at: string;
  // Joined relations
  uploaded_by_profile?: Profile;
}

export interface SOPDocumentInsert {
  sop_id: string;
  filename: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  extracted_text?: string | null;
  uploaded_by: string;
}

// ============================================
// Profile (extended with role)
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
}

// ============================================
// Quiz Taking Types
// ============================================

export interface QuizSubmission {
  quiz_id: string;
  answers: QuizAnswer[];
  time_spent_seconds: number;
}

export interface QuizAnswer {
  question_id: string;
  answer: string; // Selected option ID for MC, 'true'/'false' for T/F, text for fill_blank
}

export interface QuizResult {
  quiz_id: string;
  score: number;
  passed: boolean;
  total_points: number;
  earned_points: number;
  question_results: QuestionResult[];
  completion?: Completion;
  certificate?: Certificate;
}

export interface QuestionResult {
  question_id: string;
  correct: boolean;
  user_answer: string;
  correct_answer: string;
  points_earned: number;
  points_possible: number;
}

// ============================================
// Dashboard & Report Types
// ============================================

export interface LearnerDashboard {
  user: Profile;
  assignments: AssignmentWithProgress[];
  recent_completions: Completion[];
  certificates: Certificate[];
  stats: LearnerStats;
}

export interface AssignmentWithProgress extends Assignment {
  progress_percent: number;
  completion?: Completion;
}

export interface LearnerStats {
  total_assigned: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  average_score: number | null;
  certificates_earned: number;
}

export interface ComplianceReport {
  filters: ComplianceFilters;
  data: ComplianceRow[];
  summary: ComplianceSummary;
}

export interface ComplianceFilters {
  workspace_id: string;
  user_ids?: string[];
  sop_ids?: string[];
  date_from?: string;
  date_to?: string;
  status?: AssignmentStatus[];
}

export interface ComplianceRow {
  user: Profile;
  sop: SOP;
  assignment: Assignment;
  completion: Completion | null;
  certificate: Certificate | null;
}

export interface ComplianceSummary {
  total_assignments: number;
  completed: number;
  completion_rate: number;
  average_score: number | null;
  overdue_count: number;
}

// ============================================
// Search Types
// ============================================

export interface SOPSearchResult {
  sop: SOP;
  relevance_score: number;
  matched_fields: string[];
  snippet?: string;
}

export interface SearchFilters {
  workspace_id: string;
  category_ids?: string[];
  status?: SOPStatus[];
  created_by?: string[];
  query?: string;
}
