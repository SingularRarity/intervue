export interface Tenant {
  id: string;
  company_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  has_claude_key: boolean;
  has_sarvam_key: boolean;
}

export type InterviewType = 'Technical' | 'Behavioral' | 'Mixed' | 'CultureFit' | 'Screening';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type SessionStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Failed';

export interface InterviewTemplate {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  interview_type: InterviewType;
  difficulty: DifficultyLevel;
  duration_minutes: number;
  language: string;
  topics: string[];
  custom_questions?: CustomQuestion[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomQuestion {
  question: string;
  expected_answer_points: string[];
  weight: number;
}

export interface Candidate {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  resume_text?: string;
  skills: string[];
  experience_years?: number;
  current_role?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewSession {
  id: string;
  tenant_id: string;
  template_id: string;
  candidate_id: string;
  status: SessionStatus;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  overall_score?: number;
  recommendation?: string;
  transcript?: InterviewMessage[];
  analysis?: InterviewResult;
  recording_url?: string;
  created_at: string;
  updated_at: string;
  candidate_name?: string;
  template_title?: string;
}

export interface InterviewMessage {
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: string;
  audio_url?: string;
}

export interface InterviewResult {
  overall_score: number;
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  cultural_fit_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire';
  detailed_feedback: string;
  skill_assessments: SkillAssessment[];
}

export interface SkillAssessment {
  skill: string;
  score: number;
  evidence: string;
  level: 'Expert' | 'Proficient' | 'Developing' | 'Beginner';
}

export interface DashboardStats {
  total_interviews: number;
  completed_interviews: number;
  average_score: number;
  candidates_this_month: number;
  interviews_by_status: StatusCount[];
  top_skills: SkillCount[];
  recent_sessions: SessionSummary[];
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface SkillCount {
  skill: string;
  count: number;
}

export interface SessionSummary {
  id: string;
  candidate_name: string;
  template_title: string;
  status: string;
  score?: number;
  created_at: string;
}

export interface CreateTenantRequest {
  company_name: string;
  email: string;
  password: string;
  website?: string;
  industry?: string;
  company_size?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateApiKeysRequest {
  claude_api_key?: string;
  sarvam_api_key?: string;
}

export interface CreateInterviewTemplateRequest {
  title: string;
  description?: string;
  interview_type: InterviewType;
  difficulty: DifficultyLevel;
  duration_minutes: number;
  language: string;
  topics: string[];
  custom_questions?: CustomQuestion[];
}

export interface CreateCandidateRequest {
  name: string;
  email: string;
  phone?: string;
  resume_text?: string;
  skills: string[];
  experience_years?: number;
  current_role?: string;
  notes?: string;
}

export interface CreateSessionRequest {
  template_id: string;
  candidate_id: string;
  scheduled_at?: string;
}

export interface SubmitFeedbackRequest {
  reviewer_notes: string;
  human_override?: string;
  rating: number;
}
