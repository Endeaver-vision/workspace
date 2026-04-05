# Training Platform - Complete Build Plan

## Project Overview

Transform the existing Notion-like workspace app into a **Corporate Training Platform** focused on:
- **SOP Database** (primary) - Easy to create, easy to search, central knowledge repository
- **Training & Assessment** - Quizzes, knowledge checks, pass/fail certification
- **Compliance Tracking** - Who completed what, when
- **AI Assistance** - Search, content generation, summarization

### Target Users
| Role | Description |
|------|-------------|
| **Admin** | Manages users, views compliance reports, full access |
| **Trainer** | Creates SOPs, builds quizzes, assigns training |
| **Learner** | Completes assigned training, takes quizzes, earns certificates |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Editor | BlockNote |
| AI | OpenAI API (or Anthropic) |
| Testing | Playwright (browser automation) |

---

## Phase 1: Database Schema & Foundation

### Objective
Set up the database tables, TypeScript types, and Zustand stores needed for the training platform.

### Files to Create/Modify

#### 1.1 Database Migration
**File:** `supabase/migrations/008_training_platform.sql`

```sql
-- SOP Categories (hierarchical)
CREATE TABLE sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES sop_categories(id),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE
);

-- SOPs (Standard Operating Procedures)
CREATE TABLE sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  category_id UUID REFERENCES sop_categories(id),
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES profiles(id),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pass_threshold INTEGER DEFAULT 70,
  is_graded BOOLEAN DEFAULT true,
  time_limit_minutes INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'fill_blank')),
  question TEXT NOT NULL,
  options JSONB, -- For multiple choice: [{id, text, isCorrect}]
  correct_answer TEXT, -- For fill_blank and true_false
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (extend profiles)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'learner'
  CHECK (role IN ('admin', 'trainer', 'learner'));

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sop_id, user_id)
);

-- Completions
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id),
  score INTEGER,
  passed BOOLEAN,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  answers JSONB -- Store submitted answers for review
);

-- Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  completion_id UUID REFERENCES completions(id),
  certificate_number TEXT UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  pdf_url TEXT
);

-- SOP Documents (uploaded files)
CREATE TABLE sop_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID REFERENCES sops(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  extracted_text TEXT, -- For search
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for testing)
CREATE POLICY "Allow all sop_categories for testing" ON sop_categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sops for testing" ON sops FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quizzes for testing" ON quizzes FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all quiz_questions for testing" ON quiz_questions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all assignments for testing" ON assignments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all completions for testing" ON completions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all certificates for testing" ON certificates FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all sop_documents for testing" ON sop_documents FOR ALL TO public USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_sops_category ON sops(category_id);
CREATE INDEX idx_sops_workspace ON sops(workspace_id);
CREATE INDEX idx_sops_status ON sops(status);
CREATE INDEX idx_assignments_user ON assignments(user_id);
CREATE INDEX idx_assignments_sop ON assignments(sop_id);
CREATE INDEX idx_completions_user ON completions(user_id);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
```

#### 1.2 TypeScript Types
**File:** `types/training.types.ts`

```typescript
export type UserRole = 'admin' | 'trainer' | 'learner';
export type SOPStatus = 'draft' | 'published' | 'archived';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';

export interface SOPCategory {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  workspace_id: string;
  created_at: string;
  children?: SOPCategory[];
}

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
  category?: SOPCategory;
  quiz?: Quiz;
}

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
  questions?: QuizQuestion[];
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

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Assignment {
  id: string;
  sop_id: string;
  user_id: string;
  assigned_by: string;
  due_date: string | null;
  status: AssignmentStatus;
  created_at: string;
  sop?: SOP;
  user?: Profile;
}

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
  sop?: SOP;
  quiz?: Quiz;
}

export interface Certificate {
  id: string;
  user_id: string;
  sop_id: string;
  completion_id: string;
  certificate_number: string;
  issued_at: string;
  expires_at: string | null;
  pdf_url: string | null;
  sop?: SOP;
}

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
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
```

#### 1.3 SOP Store
**File:** `lib/store/sop-store.ts`

```typescript
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { SOP, SOPCategory, SOPStatus } from '@/types/training.types';

interface SOPStore {
  sops: SOP[];
  categories: SOPCategory[];
  currentSOP: SOP | null;
  loading: boolean;
  error: string | null;

  // SOP CRUD
  fetchSOPs: (workspaceId: string) => Promise<void>;
  fetchSOP: (sopId: string) => Promise<SOP | null>;
  createSOP: (workspaceId: string, title: string, categoryId?: string) => Promise<SOP | null>;
  updateSOP: (sopId: string, updates: Partial<SOP>) => Promise<void>;
  deleteSOP: (sopId: string) => Promise<void>;
  publishSOP: (sopId: string) => Promise<void>;

  // Category CRUD
  fetchCategories: (workspaceId: string) => Promise<void>;
  createCategory: (workspaceId: string, name: string, parentId?: string) => Promise<SOPCategory | null>;
  updateCategory: (categoryId: string, updates: Partial<SOPCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Search
  searchSOPs: (query: string, workspaceId: string) => Promise<SOP[]>;

  // Setters
  setCurrentSOP: (sop: SOP | null) => void;
}

export const useSOPStore = create<SOPStore>((set, get) => ({
  sops: [],
  categories: [],
  currentSOP: null,
  loading: false,
  error: null,

  // Implementation details...
}));
```

#### 1.4 Quiz Store
**File:** `lib/store/quiz-store.ts`

```typescript
import { create } from 'zustand';
import { Quiz, QuizQuestion, QuizOption } from '@/types/training.types';

interface QuizStore {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  questions: QuizQuestion[];
  loading: boolean;

  // Quiz CRUD
  fetchQuizzes: (sopId: string) => Promise<void>;
  fetchQuiz: (quizId: string) => Promise<Quiz | null>;
  createQuiz: (sopId: string, title: string) => Promise<Quiz | null>;
  updateQuiz: (quizId: string, updates: Partial<Quiz>) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;

  // Question CRUD
  addQuestion: (quizId: string, question: Partial<QuizQuestion>) => Promise<QuizQuestion | null>;
  updateQuestion: (questionId: string, updates: Partial<QuizQuestion>) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorderQuestions: (quizId: string, questionIds: string[]) => Promise<void>;

  // Quiz Taking
  submitQuiz: (quizId: string, answers: Record<string, string>) => Promise<{score: number, passed: boolean}>;

  setCurrentQuiz: (quiz: Quiz | null) => void;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  // Implementation...
}));
```

#### 1.5 Assignment Store
**File:** `lib/store/assignment-store.ts`

```typescript
import { create } from 'zustand';
import { Assignment, Completion, Certificate } from '@/types/training.types';

interface AssignmentStore {
  assignments: Assignment[];
  completions: Completion[];
  certificates: Certificate[];
  loading: boolean;

  // Assignments
  fetchUserAssignments: (userId: string) => Promise<void>;
  fetchSOPAssignments: (sopId: string) => Promise<void>;
  assignSOP: (sopId: string, userIds: string[], dueDate?: string) => Promise<void>;
  unassignSOP: (assignmentId: string) => Promise<void>;
  updateAssignmentStatus: (assignmentId: string, status: string) => Promise<void>;

  // Completions
  fetchUserCompletions: (userId: string) => Promise<void>;
  recordCompletion: (userId: string, sopId: string, quizId?: string, score?: number, passed?: boolean) => Promise<Completion | null>;

  // Certificates
  fetchUserCertificates: (userId: string) => Promise<void>;
  generateCertificate: (completionId: string) => Promise<Certificate | null>;

  // Reports
  getComplianceReport: (workspaceId: string, filters?: any) => Promise<any[]>;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  // Implementation...
}));
```

### Completion Criteria - Phase 1
- [ ] Migration file exists at `supabase/migrations/008_training_platform.sql`
- [ ] Migration applied successfully (tables visible in Supabase)
- [ ] `types/training.types.ts` has all interfaces with no TS errors
- [ ] `lib/store/sop-store.ts` created with CRUD operations
- [ ] `lib/store/quiz-store.ts` created with quiz management
- [ ] `lib/store/assignment-store.ts` created with assignment tracking
- [ ] `npm run build` passes with no errors

---

## Phase 2: SOP Database Core

### Objective
Build the core SOP creation, organization, and search functionality.

### Files to Create

```
components/sop/
├── SOPEditor.tsx          # Main SOP editor component
├── SOPHeader.tsx          # Title, category, status, version
├── SOPMetadata.tsx        # Author, dates, stats
├── SOPLibrary.tsx         # Grid/list view of SOPs
├── SOPCard.tsx            # Card for grid view
├── SOPFilters.tsx         # Filter controls
├── CategoryManager.tsx    # Create/edit categories
├── CategoryTree.tsx       # Hierarchical category display
├── DocumentUpload.tsx     # PDF upload component
└── index.ts               # Exports

app/(main)/[workspaceId]/
├── sops/
│   └── page.tsx           # SOP library page
└── sop/
    └── [sopId]/
        └── page.tsx       # SOP editor page

app/api/v1/
├── sops/
│   ├── route.ts           # List, create SOPs
│   └── [sopId]/
│       └── route.ts       # Get, update, delete SOP
├── categories/
│   └── route.ts           # Category CRUD
└── documents/
    └── route.ts           # Document upload
```

### Browser Test Script - Phase 2
```typescript
// tests/phase2-sop-database.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Phase 2: SOP Database', () => {
  test('SOP Library view', async ({ page }) => {
    await page.goto('/workspaceId/sops');
    await page.screenshot({ path: 'screenshots/phase2/sop-library.png', fullPage: true });
    await expect(page.getByText('SOP Library')).toBeVisible();
  });

  test('Create new SOP', async ({ page }) => {
    await page.goto('/workspaceId/sops');
    await page.click('button:has-text("New SOP")');
    await page.screenshot({ path: 'screenshots/phase2/sop-editor-empty.png', fullPage: true });

    await page.fill('input[name="title"]', 'Test SOP Document');
    await page.click('.editor-content');
    await page.keyboard.type('This is the SOP content.');
    await page.click('button:has-text("Save")');

    await page.screenshot({ path: 'screenshots/phase2/sop-editor-filled.png', fullPage: true });
  });

  test('Search SOPs', async ({ page }) => {
    await page.goto('/workspaceId/sops');
    await page.fill('input[placeholder*="Search"]', 'Test SOP');
    await page.screenshot({ path: 'screenshots/phase2/sop-search-results.png', fullPage: true });
  });

  test('Category navigation', async ({ page }) => {
    await page.goto('/workspaceId/sops');
    await page.click('.category-tree >> text=Operations');
    await page.screenshot({ path: 'screenshots/phase2/sop-category-view.png', fullPage: true });
  });
});
```

### Completion Criteria - Phase 2
- [ ] `/sops` page displays SOP library with grid/list toggle
- [ ] Can create new SOP with title and content
- [ ] SOP content saves to database
- [ ] Categories display in sidebar tree
- [ ] Can create/edit categories
- [ ] Search finds SOPs by title and content
- [ ] Can upload PDF documents to SOP
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `sop-library.png` - Library view with SOPs
- [ ] `sop-editor-empty.png` - Empty editor
- [ ] `sop-editor-filled.png` - Editor with content
- [ ] `sop-search-results.png` - Search results
- [ ] `sop-category-view.png` - Category filtered view

---

## Phase 3: Quiz/Test Builder

### Objective
Enable trainers to create quizzes and learners to take them.

### Files to Create

```
components/quiz/
├── QuizBuilder.tsx        # Main quiz builder
├── QuestionEditor.tsx     # Edit single question
├── QuestionTypes/
│   ├── MultipleChoice.tsx
│   ├── TrueFalse.tsx
│   └── FillBlank.tsx
├── QuizSettings.tsx       # Pass threshold, graded toggle
├── QuizTaker.tsx          # Take quiz UI
├── QuestionDisplay.tsx    # Render question for taking
├── QuizResults.tsx        # Score display
└── index.ts

components/editor/blocks/
└── QuizBlock.tsx          # Embed quiz in editor

app/(main)/[workspaceId]/
└── quiz/
    ├── builder/
    │   └── [quizId]/
    │       └── page.tsx   # Quiz builder page
    └── [quizId]/
        └── page.tsx       # Quiz taking page

app/api/v1/
└── quizzes/
    ├── route.ts           # List, create quizzes
    └── [quizId]/
        ├── route.ts       # Get, update, delete quiz
        ├── questions/
        │   └── route.ts   # Question CRUD
        └── submit/
            └── route.ts   # Submit quiz answers
```

### Browser Test Script - Phase 3
```typescript
// tests/phase3-quiz-builder.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Phase 3: Quiz Builder', () => {
  test('Create quiz with questions', async ({ page }) => {
    await page.goto('/workspaceId/quiz/builder/new');
    await page.screenshot({ path: 'screenshots/phase3/quiz-builder-empty.png', fullPage: true });

    // Add title
    await page.fill('input[name="title"]', 'Safety Training Quiz');

    // Add multiple choice question
    await page.click('button:has-text("Add Question")');
    await page.selectOption('select[name="type"]', 'multiple_choice');
    await page.fill('textarea[name="question"]', 'What is the first step?');
    await page.screenshot({ path: 'screenshots/phase3/quiz-builder-questions.png', fullPage: true });

    // Set pass threshold
    await page.fill('input[name="passThreshold"]', '70');
    await page.click('button:has-text("Save Quiz")');
  });

  test('Take quiz - Pass', async ({ page }) => {
    await page.goto('/workspaceId/quiz/quizId');
    await page.screenshot({ path: 'screenshots/phase3/quiz-taking.png', fullPage: true });

    // Answer questions correctly
    await page.click('input[value="correct"]');
    await page.click('button:has-text("Submit")');

    await page.screenshot({ path: 'screenshots/phase3/quiz-results-pass.png', fullPage: true });
    await expect(page.getByText('Passed')).toBeVisible();
  });

  test('Take quiz - Fail', async ({ page }) => {
    await page.goto('/workspaceId/quiz/quizId');

    // Answer questions incorrectly
    await page.click('input[value="wrong"]');
    await page.click('button:has-text("Submit")');

    await page.screenshot({ path: 'screenshots/phase3/quiz-results-fail.png', fullPage: true });
    await expect(page.getByText('Failed')).toBeVisible();
  });
});
```

### Completion Criteria - Phase 3
- [ ] Quiz builder UI allows creating quizzes
- [ ] Can add multiple choice, true/false, fill-in-blank questions
- [ ] Can set pass threshold percentage
- [ ] Quiz can be embedded in SOP editor
- [ ] Quiz taking page displays questions
- [ ] Submit calculates score and shows pass/fail
- [ ] Completion recorded in database
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `quiz-builder-empty.png` - Empty quiz builder
- [ ] `quiz-builder-questions.png` - Builder with questions
- [ ] `quiz-taking.png` - Taking a quiz
- [ ] `quiz-results-pass.png` - Passing result
- [ ] `quiz-results-fail.png` - Failing result

---

## Phase 4: Progress & Completion Tracking

### Objective
Show learners their progress and give admins compliance visibility.

### Files to Create

```
components/dashboard/
├── LearnerDashboard.tsx   # Main learner view
├── MyAssignments.tsx      # Assigned SOPs list
├── ProgressOverview.tsx   # Stats and progress
├── RecentActivity.tsx     # Recent completions
└── index.ts

components/completion/
├── StatusBadge.tsx        # Not started/In progress/Complete
├── ProgressBar.tsx        # Visual progress
└── CompletionCard.tsx     # Completion details

components/reports/
├── ComplianceTable.tsx    # Who/what/when grid
├── ReportFilters.tsx      # Date, user, SOP filters
├── ExportButton.tsx       # CSV export
└── index.ts

app/(main)/[workspaceId]/
├── dashboard/
│   └── page.tsx           # Role-based dashboard
└── reports/
    └── page.tsx           # Compliance reports
```

### Completion Criteria - Phase 4
- [ ] Learner dashboard shows assigned SOPs
- [ ] Progress bars show completion percentage
- [ ] Status badges display correctly
- [ ] Compliance report shows who completed what, when
- [ ] Can filter reports by user, SOP, date
- [ ] Can export to CSV
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `learner-dashboard.png` - Learner's view
- [ ] `sop-status-badge.png` - Status badges
- [ ] `compliance-report.png` - Full report
- [ ] `compliance-filtered.png` - Filtered report

---

## Phase 5: User Management & Assignments

### Objective
Enable admins to manage users and assign training.

### Files to Create

```
components/users/
├── UserList.tsx           # All users table
├── UserCard.tsx           # User details
├── RoleSelector.tsx       # Role dropdown
├── InviteUser.tsx         # Invite modal
└── index.ts

components/assignment/
├── AssignModal.tsx        # Assign SOP modal
├── AssignmentList.tsx     # View assignments
├── BulkAssign.tsx         # Multi-user assign
└── index.ts

app/(main)/[workspaceId]/
└── users/
    └── page.tsx           # User management

app/api/v1/
├── users/
│   ├── route.ts           # List, invite users
│   └── [userId]/
│       └── role/
│           └── route.ts   # Update role
└── assignments/
    └── route.ts           # CRUD assignments
```

### Completion Criteria - Phase 5
- [ ] User list page shows all users
- [ ] Can change user roles
- [ ] Can invite new users
- [ ] Can assign SOP to one or multiple users
- [ ] Assignments appear on learner dashboard
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `user-list.png` - User management page
- [ ] `role-selector.png` - Changing a role
- [ ] `invite-modal.png` - Invite user form
- [ ] `assign-modal.png` - Assign SOP modal
- [ ] `bulk-assign.png` - Multi-user selection

---

## Phase 6: Certificates

### Objective
Auto-generate certificates when learners pass quizzes.

### Files to Create

```
components/certificate/
├── CertificateTemplate.tsx # Visual template
├── CertificatePreview.tsx  # Preview modal
├── CertificateCard.tsx     # Card display
├── DownloadButton.tsx      # Download PDF
└── index.ts

lib/certificates/
└── generator.ts            # PDF generation

app/(main)/[workspaceId]/
└── certificates/
    └── page.tsx            # My certificates

app/api/v1/
└── certificates/
    ├── route.ts            # List certificates
    └── [certId]/
        └── download/
            └── route.ts    # Download PDF
```

### Completion Criteria - Phase 6
- [ ] Certificate template renders with user info
- [ ] Auto-generates on passing quiz
- [ ] `/certificates` page shows earned certs
- [ ] Can preview certificate
- [ ] Can download as PDF
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `my-certificates.png` - Certificates list
- [ ] `certificate-preview.png` - Preview modal
- [ ] `certificate-pdf.png` - Downloaded PDF

---

## Phase 7: AI Integration

### Objective
Add AI-powered search, quiz generation, and content assistance.

### Files to Create

```
lib/ai/
├── embeddings.ts          # Generate embeddings
├── search.ts              # Semantic search
├── quiz-generator.ts      # Generate questions
├── summarizer.ts          # Summarize content
└── chat.ts                # Chat completions

components/ai/
├── AISearchBar.tsx        # Natural language search
├── AIGenerateButton.tsx   # Generate quiz button
├── AISummaryButton.tsx    # Summarize button
├── ChatAssistant.tsx      # Chat interface
├── ChatMessage.tsx        # Message display
└── index.ts

app/api/v1/ai/
├── search/
│   └── route.ts           # AI search endpoint
├── generate-quiz/
│   └── route.ts           # Quiz generation
├── summarize/
│   └── route.ts           # Summarization
└── chat/
    └── route.ts           # Chat endpoint
```

### Completion Criteria - Phase 7
- [ ] AI search returns relevant SOPs
- [ ] Generate Quiz creates questions from content
- [ ] Summarize creates concise summaries
- [ ] Chat assistant answers SOP questions
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `ai-search-results.png` - AI search
- [ ] `ai-quiz-generated.png` - Generated quiz
- [ ] `ai-summary.png` - Generated summary
- [ ] `ai-chat-open.png` - Chat interface
- [ ] `ai-chat-response.png` - Chat response

---

## Phase 8: UI/UX Polish

### Objective
Apply professional corporate styling and improve navigation.

### Files to Modify/Create

```
app/
├── globals.css            # Corporate theme
└── layout.tsx             # Updated layout

components/
├── nav/
│   ├── TopNav.tsx         # Top navigation
│   ├── Breadcrumbs.tsx    # Breadcrumb trail
│   └── index.ts
├── sidebar/
│   └── TrainingSidebar.tsx # New sidebar
└── onboarding/
    └── WelcomeModal.tsx   # First-time user
```

### Corporate Color Scheme
```css
/* Primary: Professional Blue */
--primary: 217 91% 40%;        /* #1a56db */
--primary-foreground: 0 0% 100%;

/* Neutral: Clean Grays */
--background: 0 0% 98%;         /* #fafafa */
--foreground: 222 47% 11%;      /* #1e293b */
--muted: 210 40% 96%;           /* #f1f5f9 */
--muted-foreground: 215 16% 47%; /* #64748b */

/* Accent: Success Green */
--success: 142 76% 36%;         /* #16a34a */
--warning: 38 92% 50%;          /* #f59e0b */
--destructive: 0 84% 60%;       /* #ef4444 */
```

### Completion Criteria - Phase 8
- [ ] Corporate color scheme applied
- [ ] Professional typography
- [ ] New training-focused sidebar
- [ ] Top navigation bar
- [ ] Breadcrumb navigation
- [ ] Role-based landing pages
- [ ] Welcome modal for new users
- [ ] `npm run build` passes

**Browser Screenshots Required:**
- [ ] `welcome-modal.png` - New user welcome
- [ ] `final-learner-dashboard.png` - Learner view
- [ ] `final-trainer-dashboard.png` - Trainer view
- [ ] `final-admin-dashboard.png` - Admin view
- [ ] `breadcrumbs.png` - Navigation
- [ ] `final-app-overview.png` - Full page

---

## Global Completion Test

### End-to-End User Journey

```typescript
// tests/e2e-complete-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Training Journey', () => {
  test('Admin creates SOP with quiz', async ({ page }) => {
    // Login as admin
    // Create category
    // Create SOP with content
    // Add quiz with questions
    // Publish SOP
  });

  test('Admin assigns training to learner', async ({ page }) => {
    // Go to user management
    // Find learner
    // Assign SOP
    // Set due date
  });

  test('Learner completes training', async ({ page }) => {
    // Login as learner
    // See assignment on dashboard
    // Open SOP, read content
    // Take quiz, pass
    // See certificate generated
  });

  test('Admin views compliance report', async ({ page }) => {
    // Login as admin
    // Go to reports
    // See learner's completion
    // Export CSV
  });
});
```

### Final Checklist
- [ ] All 8 phases marked closed in beads
- [ ] `npm run build` passes
- [ ] All browser screenshots captured
- [ ] E2E test passes
- [ ] No console errors in browser
- [ ] App looks professional and corporate

---

## Appendix: Beads Commands Reference

```bash
# View all tasks
bd list

# View ready tasks
bd ready

# Start working on task
bd update <task-id> --status in_progress

# Complete task
bd update <task-id> --status closed

# Show task details
bd show <task-id>

# Create subtask
bd create "Task name" --parent <parent-id> --description "Details"
```

## Appendix: Ralph Loop Quick Reference

```bash
# Start Ralph loop
/ralph-loop "Follow PROMPT.md" --completion-promise "TRAINING PLATFORM COMPLETE" --max-iterations 50

# Check progress
bd list

# Cancel if needed
/cancel-ralph
```
