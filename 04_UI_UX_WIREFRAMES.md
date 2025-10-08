# UI/UX Wireframes & Design Specifications
## ATS Resume Platform - Student/Entry-Level Focus

**Version:** 1.0  
**Design System:** Modern Glassmorphism (Current)  
**Last Updated:** October 2025

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Design System](#design-system)
3. [User Flows](#user-flows)
4. [Page Wireframes](#page-wireframes)
5. [Component Library](#component-library)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Accessibility](#accessibility)

---

## 1. Design Philosophy

### 1.1 Core Principles

**For Students & Entry-Level Job Seekers:**
1. **Approachable**: Friendly, not intimidating
2. **Guided**: Clear next steps, helpful hints
3. **Encouraging**: Positive feedback, progress indicators
4. **Modern**: Contemporary design that appeals to young professionals
5. **Fast**: Quick loading, instant feedback

### 1.2 Key User Needs

| User Need | Design Solution |
|-----------|----------------|
| **"I don't know where to start"** | Guided onboarding, templates, examples |
| **"Is my resume good enough?"** | Real-time scoring, actionable feedback |
| **"I need this done quickly"** | AI-assisted writing, one-click optimization |
| **"I'm not a designer"** | Beautiful templates, automatic formatting |
| **"Will this work with ATS?"** | Clear ATS score, compatibility checks |

### 1.3 Visual Style

**Current Style:** Glassmorphism with gradients
- Translucent cards with backdrop blur
- Soft shadows and depth
- Animated gradients
- Smooth transitions
- Light/dark mode support

**Maintain & Enhance:**
- Keep existing glassmorphism aesthetic
- Add more interactive elements
- Improve feedback mechanisms
- Better visual hierarchy

---

## 2. Design System

### 2.1 Color Palette

**Primary Colors (Light Mode):**
```
Purple: #667eea
Pink: #764ba2
Blue: #4facfe
Green: #43e97b
Yellow: #fbbf24
Red: #ef4444
```

**Primary Colors (Dark Mode):**
```
Purple: #8b7fea
Pink: #f093fb
Blue: #4facfe
Green: #38f9d7
Yellow: #fee140
Red: #f87171
```

**Semantic Colors:**
```
Success: Green (#43e97b)
Warning: Yellow (#fbbf24)
Error: Red (#ef4444)
Info: Blue (#4facfe)
```

### 2.2 Typography

**Font Stack:**
```
Headings: 'Inter', 'SF Pro Display', sans-serif
Body: 'Inter', 'SF Pro Text', sans-serif
Code: 'JetBrains Mono', monospace
```

**Type Scale:**
```
h1: 48px / 3rem (Landing, Dashboard Hero)
h2: 36px / 2.25rem (Page Titles)
h3: 24px / 1.5rem (Section Headers)
h4: 20px / 1.25rem (Card Titles)
body: 16px / 1rem
small: 14px / 0.875rem
```

### 2.3 Spacing System

**8px Base Unit:**
```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
```

### 2.4 Component Patterns

**Card Styles:**
- `.glass`: Light translucent cards
- `.glass-strong`: Stronger opacity for primary content
- `.hover-glass`: Hover effect with lift
- `.btn-glass`: Button with gradient background

**Animations:**
- `.fade-in`: Opacity 0→1 with slight y-translate
- `.slide-up`: Bottom to position with opacity
- `.pulse`: Subtle scale animation for emphasis

---

## 3. User Flows

### 3.1 First-Time User Flow

```
Landing Page
    ↓
Sign Up (Email, Password)
    ↓
Email Verification (Optional: Skip for now)
    ↓
Welcome Onboarding
    ├── Option 1: Upload Existing Resume → Parse → Dashboard
    └── Option 2: Create New Resume → Template Selection → Builder
    ↓
Dashboard (with guided tour)
```

### 3.2 Resume Creation Flow

```
Dashboard
    ↓
Click "Create Resume"
    ↓
Template Gallery
    ├── Filter: Category, ATS Score, Premium
    └── Preview on hover
    ↓
Select Template
    ↓
Resume Builder
    ├── Personal Info
    ├── Summary (with AI assist button)
    ├── Experience (with AI generate bullets)
    ├── Education
    ├── Skills (with suggestions)
    ├── Projects
    └── Certifications
    ↓
Live Preview (right panel)
    ↓
Save & Export
```

### 3.3 Resume Analysis Flow

```
Dashboard
    ↓
Select Resume
    ↓
Click "Analyze Resume"
    ↓
Paste Job Description
    ├── Or: Select from saved JDs
    └── Or: Paste job URL (future)
    ↓
Analysis Processing (loading state)
    ↓
Results Page
    ├── Overall Score (prominently displayed)
    ├── Keyword Analysis
    ├── Experience Matching
    ├── ATS Formatting Score
    └── Actionable Advice
    ↓
Apply Suggestions
    ├── Auto-optimize (one-click)
    └── Manual edits (guided)
    ↓
Re-analyze (compare scores)
```

### 3.4 Resume Optimization Flow

```
Analysis Results
    ↓
Click "Optimize Resume"
    ↓
AI Processing (shows progress)
    ↓
Side-by-Side Comparison
    ├── Left: Original
    └── Right: Optimized (highlighted changes)
    ↓
Review Changes
    ├── Accept All
    ├── Accept Individual
    └── Reject Individual
    ↓
Apply Changes → New Version Created
    ↓
Success! Score Improvement Shown
```

---

## 4. Page Wireframes

### 4.1 Landing Page

```
╔══════════════════════════════════════════════════════════╗
║  Logo                    Features  Pricing  Login  [Sign Up] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║          🎯 AI-Powered ATS Resume Analyzer               ║
║       Get Your Dream Job with a Resume That Passes       ║
║              Applicant Tracking Systems                  ║
║                                                          ║
║     [Upload Resume] [Try Free Analysis]                  ║
║                                                          ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ║
║  │ ✨ AI-Powered│ │ 📊 Instant  │ │ 🎨 Beautiful│       ║
║  │   Analysis  │ │  Scoring    │ │  Templates  │       ║
║  └─────────────┘ └─────────────┘ └─────────────┘       ║
║                                                          ║
║  How It Works                                            ║
║  ─────────────                                           ║
║  1. Upload Resume → 2. Add Job Description → 3. Get Score║
║                                                          ║
║  Templates Gallery (carousel)                            ║
║  [Modern] [Classic] [Tech] [Creative] [ATS-Optimized]   ║
║                                                          ║
║  Testimonials                                            ║
║  "Got 3x more interviews after using this tool!"         ║
║                                                          ║
║  Pricing (Simple)                                        ║
║  FREE: 5 analyses/day | PREMIUM: Unlimited + AI Features║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Key Elements:**
- Hero section with clear value proposition
- Prominent CTA buttons
- Trust indicators (testimonials, stats)
- Feature highlights with icons
- Template showcase
- Simple pricing
- Footer with links

---

### 4.2 Sign Up / Login Page

```
╔══════════════════════════════════════════════════════════╗
║                    [Logo]                                ║
║                                                          ║
║  ┌────────────────────────────────────────────────┐     ║
║  │                                                │     ║
║  │          Welcome to ATS Platform               │     ║
║  │    Land your dream job with an ATS-ready resume│     ║
║  │                                                │     ║
║  │    Email    [___________________________]      │     ║
║  │    Password [___________________________]      │     ║
║  │                                                │     ║
║  │    ☐ Remember me          Forgot password?    │     ║
║  │                                                │     ║
║  │           [  Sign In  ]                        │     ║
║  │                                                │     ║
║  │    ────────── or ──────────                    │     ║
║  │                                                │     ║
║  │    [  Continue with Google  ]                  │     ║
║  │                                                │     ║
║  │    Don't have an account? Sign up              │     ║
║  │                                                │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Sign Up Variant:**
```
Email, Password, Confirm Password
First Name, Last Name (optional)
[ ] I agree to Terms & Privacy Policy
[Sign Up] button
"Already have an account? Sign in"
```

---

### 4.3 Dashboard (Main Hub)

```
╔══════════════════════════════════════════════════════════╗
║ [Logo] Dashboard  Resumes  Templates  Analysis  [Profile▾]║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Welcome back, John! 👋                                  ║
║                                                          ║
║  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       ║
║  │ 📄 Resumes  │ │ 📊 Analyses │ │ 🎯 AI Usage │       ║
║  │     3       │ │      2/5    │ │    5/20     │       ║
║  │             │ │   Today     │ │   Today     │       ║
║  └─────────────┘ └─────────────┘ └─────────────┘       ║
║                                                          ║
║  Quick Actions                                           ║
║  [+ Create Resume] [📤 Upload Resume] [🔍 Analyze]       ║
║                                                          ║
║  Recent Resumes                          [View All →]    ║
║  ┌────────────────────────────────────────────────┐     ║
║  │ Software Engineer Resume        Score: 78%     │     ║
║  │ Updated 2 hours ago        [Edit] [Analyze]    │     ║
║  ├────────────────────────────────────────────────┤     ║
║  │ Marketing Manager Resume    Score: 65%         │     ║
║  │ Updated 1 day ago          [Edit] [Analyze]    │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  Recent Analyses                     [View All →]    ║
║  ┌────────────────────────────────────────────────┐     ║
║  │ 🎯 Software Engineer @ Tech Corp               │     ║
║  │ Score: 78% • 2 hours ago    [View Details]     │     ║
║  ├────────────────────────────────────────────────┤     ║
║  │ 🎯 Frontend Developer @ StartupX               │     ║
║  │ Score: 82% • 1 day ago      [View Details]     │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  💡 Tips & Tutorials                                     ║
║  • How to optimize your resume for ATS                   ║
║  • Best practices for bullet points                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Key Features:**
- Usage stats prominently displayed
- Quick action buttons
- Recent resumes with actions
- Recent analyses with scores
- Tips section for engagement

---

### 4.4 Template Gallery

```
╔══════════════════════════════════════════════════════════╗
║ Dashboard > Templates                          [Profile▾] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Choose Your Template                                    ║
║  Select a professionally designed template that matches  ║
║  your industry and personality                           ║
║                                                          ║
║  Filter: [All] [Classic] [Modern] [Tech] [Creative]     ║
║  Sort by: [Popular] [ATS Score] [Newest]                ║
║  [ ] Show premium only                                   ║
║                                                          ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   ║
║  │[Preview] │ │[Preview] │ │[Preview] │ │[Preview] │   ║
║  │          │ │          │ │          │ │          │   ║
║  │ Modern   │ │ Classic  │ │ Tech Pro │ │ Creative │   ║
║  │ ⭐ 4.8  │ │ ⭐ 4.9  │ │ ⭐ 4.7  │ │ 👑 Pro  │   ║
║  │ ATS: 88% │ │ ATS: 95% │ │ ATS: 82% │ │ ATS: 75% │   ║
║  │ [Use]    │ │ [Use]    │ │ [Use]    │ │[Upgrade] │   ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘   ║
║                                                          ║
║  [Load More Templates]                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Template Preview Modal:**
```
┌────────────────────────────────────────────────────┐
│  ← Back to Gallery        Modern Template    [X]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Full-size preview image/iframe]                  │
│                                                    │
│  Details:                                          │
│  • Single column layout                            │
│  • Clean & contemporary                            │
│  • ATS Score: 88%                                  │
│  • Perfect for: Tech, Business                     │
│                                                    │
│            [Use This Template]                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### 4.5 Resume Builder

```
╔══════════════════════════════════════════════════════════════════════════════╗
║ [<] Back to Dashboard | Software Engineer Resume | Auto-saved 2 min ago      ║
╠════════════════════════════════════════╦═════════════════════════════════════╣
║  EDITOR (Left Panel)                   ║  PREVIEW (Right Panel)             ║
║                                        ║                                    ║
║  Sections:                             ║  [Live preview of resume]          ║
║  ▼ Personal Information                ║                                    ║
║    Full Name   [John Doe          ]    ║  ┌──────────────────────────────┐ ║
║    Email       [john@example.com  ]    ║  │ JOHN DOE                     │ ║
║    Phone       [+1234567890       ]    ║  │ john@example.com • +123...   │ ║
║    Location    [San Francisco, CA ]    ║  │                              │ ║
║    LinkedIn    [linkedin.com/in/..]    ║  │ PROFESSIONAL SUMMARY         │ ║
║                                        ║  │ Experienced software...      │ ║
║  ▼ Professional Summary                ║  │                              │ ║
║    [______________________________]    ║  │ EXPERIENCE                   │ ║
║    [______________________________]    ║  │ Senior Developer             │ ║
║    [✨ AI: Generate Summary]           ║  │ Tech Corp • 2020-2023        │ ║
║                                        ║  │ • Developed...               │ ║
║  ▼ Work Experience                     ║  │                              │ ║
║    ┌────────────────────────────┐      ║  └──────────────────────────────┘ ║
║    │ Senior Developer           │      ║                                    ║
║    │ Tech Corp • 2020-2023      │      ║  Actions:                          ║
║    │ • Bullet point 1           │      ║  [💾 Save]                         ║
║    │ • Bullet point 2           │      ║  [📊 Analyze]                      ║
║    │ [✨ Generate Bullets]      │      ║  [📥 Export PDF]                   ║
║    │ [Edit] [Delete]            │      ║  [📄 Export DOCX]                  ║
║    └────────────────────────────┘      ║                                    ║
║    [+ Add Experience]                  ║  Template:                         ║
║                                        ║  [Modern ▾]                        ║
║  ▶ Education                           ║                                    ║
║  ▶ Skills                              ║  Zoom:                             ║
║  ▶ Projects                            ║  [- 75% +]                         ║
║  ▶ Certifications                      ║                                    ║
║                                        ║                                    ║
║  [+ Add Custom Section]                ║                                    ║
║                                        ║                                    ║
╚════════════════════════════════════════╩═════════════════════════════════════╝
```

**Key Features:**
- Split view: Editor | Preview
- Collapsible sections
- AI assist buttons throughout
- Drag-to-reorder sections
- Real-time preview updates
- Auto-save indicator
- Quick actions (save, analyze, export)

---

### 4.6 AI Content Generation Modal

```
┌──────────────────────────────────────────────────────┐
│  ✨ AI Assistant - Generate Bullet Points      [X]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Tell me about your role:                            │
│                                                      │
│  Job Title     [Software Engineer            ]       │
│  Company       [Tech Corp                    ]       │
│  Duration      [3 years                      ]       │
│                                                      │
│  What did you work on? (brief description)           │
│  [____________________________________________]       │
│  [____________________________________________]       │
│                                                      │
│  Skills used: (select or type)                       │
│  [Python] [React] [AWS] [+ Add skill]                │
│                                                      │
│  Number of bullets to generate: [3 ▾]                │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 💡 Tip: The more specific you are, the better │  │
│  │ the AI-generated content will be!             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Cancel]                   [✨ Generate Bullets]    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**After Generation:**
```
┌──────────────────────────────────────────────────────┐
│  ✨ Generated Bullet Points                   [X]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Here are your AI-generated bullet points:           │
│                                                      │
│  ☐ Developed and maintained scalable microservices  │
│     using Python and AWS Lambda                      │
│     [Edit] [Regenerate this one]                     │
│                                                      │
│  ☐ Optimized database queries, reducing response    │
│     time by 40% and improving user experience        │
│     [Edit] [Regenerate this one]                     │
│                                                      │
│  ☐ Collaborated with cross-functional teams to      │
│     deliver features on schedule                     │
│     [Edit] [Regenerate this one]                     │
│                                                      │
│  [🔄 Regenerate All]                                 │
│                                                      │
│  [Cancel]         [Add Selected to Resume (3)]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 4.7 Analysis Page

```
╔══════════════════════════════════════════════════════════╗
║ Dashboard > Analysis Results                  [Profile▾] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Analysis: Software Engineer @ Tech Corp                 ║
║  Resume: Software Engineer Resume • Analyzed 2 min ago   ║
║                                                          ║
║  ┌────────────────────────────────────────────────┐     ║
║  │         Overall Match Score                    │     ║
║  │                                                │     ║
║  │             ┌─────────┐                        │     ║
║  │             │   78%   │  🎉                    │     ║
║  │             │ Good    │                        │     ║
║  │             └─────────┘                        │     ║
║  │                                                │     ║
║  │    Your resume shows good alignment!           │     ║
║  │    Some improvements could boost chances.      │     ║
║  │                                                │     ║
║  │  ┌──────┐  ┌──────┐  ┌──────┐                 │     ║
║  │  │  12  │  │  85% │  │   3  │                 │     ║
║  │  │Keywords│ │ ATS  │ │Strong│                 │     ║
║  │  │ Found │ │Friendly│ │Matches│                │     ║
║  │  └──────┘  └──────┘  └──────┘                 │     ║
║  │                                                │     ║
║  │  [🚀 Optimize Resume]  [📥 Export Report]     │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  ┌────────────────────────────────────────────────┐     ║
║  │ 🔤 Keyword Analysis         [✓ Found] [✗ Missing]│   ║
║  ├────────────────────────────────────────────────┤     ║
║  │ Great! Your resume contains these keywords:     │     ║
║  │ [Python] [React] [AWS] [Docker] [Agile]        │     ║
║  │ ... 7 more                                      │     ║
║  │                                                 │     ║
║  │ Missing keywords (consider adding):             │     ║
║  │ [Kubernetes] [GraphQL] [TypeScript]            │     ║
║  │                                                 │     ║
║  │ 💡 Tip: Click to copy keyword to clipboard     │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  ┌────────────────────────────────────────────────┐     ║
║  │ ✅ Experience Relevance                         │     ║
║  ├────────────────────────────────────────────────┤     ║
║  │ Your experience aligns well with requirements   │     ║
║  │                                                 │     ║
║  │ 3+ years software development      [🎯 Strong] │     ║
║  │ ✓ 5 years as Senior Developer at Tech Corp     │     ║
║  │                                                 │     ║
║  │ Experience with AWS                [🎯 Strong] │     ║
║  │ ✓ Deployed apps on AWS using EC2, S3, Lambda   │     ║
║  │                                                 │     ║
║  │ Knowledge of Kubernetes            [💪 Weak]   │     ║
║  │ ✗ No direct evidence found                     │     ║
║  │ 💡 Add: Kubernetes experience if applicable    │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  ┌────────────────────────────────────────────────┐     ║
║  │ 📄 ATS Formatting Score: 85%                   │     ║
║  ├────────────────────────────────────────────────┤     ║
║  │ Your resume has good ATS compatibility!         │     ║
║  │                                                 │     ║
║  │ Checklist:                                      │     ║
║  │ ✓ Clear section headers                        │     ║
║  │ ✓ Consistent formatting                        │     ║
║  │ ✓ ATS-friendly fonts                           │     ║
║  │ ✓ Proper spacing                               │     ║
║  │ ✓ Standard file format                         │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  ┌────────────────────────────────────────────────┐     ║
║  │ ⚡ Actionable Improvements                      │     ║
║  ├────────────────────────────────────────────────┤     ║
║  │ 1. 🎯 HIGH PRIORITY                            │     ║
║  │    Add Kubernetes experience if applicable      │     ║
║  │    [☐ Mark as done]                            │     ║
║  │                                                 │     ║
║  │ 2. 💡 MEDIUM PRIORITY                          │     ║
║  │    Include TypeScript in skills list           │     ║
║  │    [☐ Mark as done]                            │     ║
║  │                                                 │     ║
║  │ 3. ⚡ LOW PRIORITY                             │     ║
║  │    Quantify achievements in bullet points      │     ║
║  │    [☐ Mark as done]                            │     ║
║  │                                                 │     ║
║  │ Progress: 0/3 completed                         │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Key Features:**
- Large, prominent overall score
- Quick stats at top
- Collapsible/expandable sections
- Interactive keyword badges
- Priority-based advice
- Progress tracking
- Primary CTA: Optimize Resume

---

### 4.8 Resume Optimization (Side-by-Side)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║ Optimize Resume: Software Engineer Resume                          [X Close] ║
╠════════════════════════════════════════╦═════════════════════════════════════╣
║  ORIGINAL (Left)                       ║  OPTIMIZED (Right)                 ║
║                                        ║                                    ║
║  John Doe                              ║  John Doe                          ║
║  john@example.com                      ║  john@example.com                  ║
║                                        ║                                    ║
║  PROFESSIONAL SUMMARY                  ║  PROFESSIONAL SUMMARY              ║
║  Experienced software engineer         ║  Results-driven Software Engineer  ║
║  with Python skills.                   ║  with 5+ years developing scalable ║
║                                        ║  applications using Python, AWS... ║
║                                        ║  [✨ AI-enhanced]                  ║
║                                        ║                                    ║
║  EXPERIENCE                            ║  EXPERIENCE                        ║
║  Senior Developer                      ║  Senior Software Engineer          ║
║  Tech Corp • 2020-2023                 ║  Tech Corp • 2020-2023             ║
║  • Worked on backend services          ║  • Architected microservices...    ║
║                                        ║    [✨ AI-enhanced]                ║
║  • Fixed bugs                          ║  • Optimized performance by 40%    ║
║                                        ║    [✨ AI-enhanced]                ║
║                                        ║  • [New] Led team of 5 engineers   ║
║                                        ║    [✨ AI-suggested]               ║
║                                        ║                                    ║
║  SKILLS                                ║  SKILLS                            ║
║  Python, React, AWS                    ║  Python, React, AWS, Docker        ║
║                                        ║  TypeScript, Kubernetes, GraphQL   ║
║                                        ║  [✨ Missing keywords added]       ║
║                                        ║                                    ║
╠════════════════════════════════════════╩═════════════════════════════════════╣
║                                                                              ║
║  Changes Summary:                                                            ║
║  ✨ 8 AI-enhanced sections   |   📝 3 sections rewritten   |   🆕 2 added    ║
║                                                                              ║
║  ┌──────────────────────────────────────────────────────────────────┐       ║
║  │ Expected Score Improvement:  78% → 86% (+8 points) 🎉          │       ║
║  └──────────────────────────────────────────────────────────────────┘       ║
║                                                                              ║
║  [↶ Reject All]      [Accept Individual Changes]      [✓ Accept All]        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Individual Change View:**
```
┌────────────────────────────────────────────────────┐
│  Professional Summary                              │
├────────────────────────────────────────────────────┤
│  Original:                                         │
│  "Experienced software engineer with Python skills"│
│                                                    │
│  Optimized:                                        │
│  "Results-driven Software Engineer with 5+ years   │
│   developing scalable applications using Python..."│
│                                                    │
│  Why this is better:                               │
│  • Uses stronger action word ("Results-driven")    │
│  • Quantifies experience (5+ years)                │
│  • More specific about skills                      │
│                                                    │
│  [✗ Reject]                          [✓ Accept]    │
└────────────────────────────────────────────────────┘
```

---

### 4.9 Profile Settings

```
╔══════════════════════════════════════════════════════════╗
║ Dashboard > Profile Settings                  [Profile▾] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Tabs: [Profile] [Account] [Subscription] [Preferences] ║
║                                                          ║
║  PROFILE TAB:                                            ║
║  ┌────────────────────────────────────────────────┐     ║
║  │  Profile Picture                               │     ║
║  │  [Photo] [Change Photo] [Remove]               │     ║
║  │                                                │     ║
║  │  First Name    [John                  ]        │     ║
║  │  Last Name     [Doe                   ]        │     ║
║  │  Email         [john@example.com      ]        │     ║
║  │  Phone         [+1234567890           ]        │     ║
║  │                                                │     ║
║  │  [Save Changes]                                │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  ACCOUNT TAB:                                            ║
║  ┌────────────────────────────────────────────────┐     ║
║  │  Change Password                               │     ║
║  │  Current Password   [____________]             │     ║
║  │  New Password       [____________]             │     ║
║  │  Confirm Password   [____________]             │     ║
║  │  [Update Password]                             │     ║
║  │                                                │     ║
║  │  Two-Factor Authentication        [Enable]     │     ║
║  │  Email Verification           ✓ Verified       │     ║
║  │                                                │     ║
║  │  Danger Zone                                   │     ║
║  │  [Delete Account]                              │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  SUBSCRIPTION TAB:                                       ║
║  ┌────────────────────────────────────────────────┐     ║
║  │  Current Plan: Free                            │     ║
║  │                                                │     ║
║  │  Usage This Month:                             │     ║
║  │  Analyses:     8 / Unlimited                   │     ║
║  │  AI Generations: 45 / Unlimited                │     ║
║  │  Resumes:      3 / 5                           │     ║
║  │                                                │     ║
║  │  [Upgrade to Premium] - $9.99/month            │     ║
║  │                                                │     ║
║  │  Premium Features:                             │     ║
║  │  ✓ Unlimited analyses                          │     ║
║  │  ✓ Unlimited AI generations                    │     ║
║  │  ✓ Unlimited resumes                           │     ║
║  │  ✓ Priority support                            │     ║
║  │  ✓ Advanced templates                          │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
║  PREFERENCES TAB:                                        ║
║  ┌────────────────────────────────────────────────┐     ║
║  │  Appearance                                    │     ║
║  │  Theme: ⚪ Light  ⚫ Dark  🌓 Auto              │     ║
║  │                                                │     ║
║  │  Notifications                                 │     ║
║  │  ☑ Email notifications                         │     ║
║  │  ☑ Analysis complete alerts                    │     ║
║  │  ☐ Marketing emails                            │     ║
║  │                                                │     ║
║  │  Language: [English ▾]                         │     ║
║  │                                                │     ║
║  │  [Save Preferences]                            │     ║
║  └────────────────────────────────────────────────┘     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## 5. Component Library

### 5.1 Buttons

**Primary Button:**
```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}
```

**Secondary Button:**
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
```

**Icon Button:**
```
[🔍] [📤] [⚙️] [❤️]
Small, circular, with icon only
```

### 5.2 Cards

**Standard Card:**
```css
.card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.25);
}
```

**Interactive Card (hover effect):**
```css
.card-interactive:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 32px rgba(31, 38, 135, 0.35);
}
```

### 5.3 Inputs

**Text Input:**
```css
.input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  color: inherit;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

**Textarea:**
```
Same as input, min-height: 120px
```

### 5.4 Badges

**Keyword Badge:**
```css
.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s;
}

.badge-found {
  background: rgba(67, 233, 123, 0.2);
  color: #22c55e;
  border: 1px solid rgba(67, 233, 123, 0.3);
}

.badge-missing {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
```

### 5.5 Progress Indicators

**Circular Score:**
```
SVG ring with animated fill
Score in center
Color based on value:
  80-100: Green
  60-79: Yellow
  0-59: Red
```

**Linear Progress:**
```css
.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #43e97b, #38f9d7);
  border-radius: 4px;
  transition: width 1s ease-out;
}
```

### 5.6 Modals

**Standard Modal:**
```
Overlay: rgba(0, 0, 0, 0.5)
Modal: Centered glass card
Max-width: 600px
Padding: 32px
Border-radius: 24px
Close button: Top-right
```

**Full-Screen Modal:**
```
For resume preview, side-by-side comparison
Slide in from right
Overlay darker: rgba(0, 0, 0, 0.7)
```

### 5.7 Toasts/Notifications

**Success Toast:**
```
┌─────────────────────────────────────┐
│ ✓ Resume saved successfully!        │
│   [Dismiss]                          │
└─────────────────────────────────────┘
Position: Top-right
Auto-dismiss: 3 seconds
Green gradient background
```

**Error Toast:**
```
┌─────────────────────────────────────┐
│ ✗ Failed to save resume             │
│   Please try again                   │
│   [Dismiss]                          │
└─────────────────────────────────────┘
Red gradient background
Manual dismiss
```

---

## 6. Responsive Breakpoints

### 6.1 Breakpoint Values

```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }

/* Large Desktop */
@media (min-width: 1440px) { ... }
```

### 6.2 Mobile Adaptations

**Dashboard:**
- Stack cards vertically
- Collapse sidebar to hamburger menu
- Bottom navigation bar for primary actions

**Resume Builder:**
- Tabs instead of side-by-side (Editor / Preview)
- Floating action button for save/export
- Simplified toolbar

**Analysis Results:**
- Stack sections vertically
- Collapse/expand sections by default
- Sticky header with score

---

## 7. Accessibility

### 7.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- Text on background: Min 4.5:1
- Large text: Min 3:1
- Interactive elements: Min 3:1

**Keyboard Navigation:**
- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Escape key closes modals

**Screen Readers:**
- Semantic HTML (header, nav, main, section)
- ARIA labels on icons
- ARIA live regions for dynamic content
- Alternative text for images

### 7.2 Focus States

```css
*:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 7.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Loading States

### 8.1 Skeleton Screens

**Resume Card Loading:**
```
┌────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░     │
│ ████░░░░░░░░░░░░               │
│ ████████░░░░░░  ████░░░░       │
└────────────────────────────────┘
Animated shimmer effect
```

### 8.2 Processing States

**AI Generation:**
```
⏳ Analyzing your resume...
Progress: ████████░░░░ 65%
Estimated time: 2 seconds
```

**File Upload:**
```
📤 Uploading resume.pdf...
██████████████████░░ 90%
```

---

## 9. Empty States

**No Resumes:**
```
┌────────────────────────────────┐
│     📄                         │
│   No resumes yet               │
│   Create your first resume     │
│   to get started!              │
│                                │
│   [+ Create Resume]            │
└────────────────────────────────┘
```

**No Analyses:**
```
┌────────────────────────────────┐
│     📊                         │
│   No analyses yet              │
│   Analyze a resume to see      │
│   how it matches jobs!         │
│                                │
│   [Analyze Resume]             │
└────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** October 8, 2025  
**Design System Version:** 1.0.0

**Next Steps:**
- Create high-fidelity mockups in Figma/Sketch
- User testing with target demographic (students)
- Iterate based on feedback
