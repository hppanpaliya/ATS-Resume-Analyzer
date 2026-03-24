import type { TestInfo } from '@playwright/test';
import { createUniqueAuthUser, type TestAuthUser } from './auth';

export type LivePersona = {
  auth: TestAuthUser;
  displayName: string;
  currentCompany: string;
  resumeTitle: string;
  updatedResumeTitle: string;
  resumeContent: string;
  updatedResumeContent: string;
  jobTitle: string;
  updatedJobTitle: string;
  jobDescription: string;
  updatedJobDescription: string;
};

export const createMovieUniversePhdPersona = (testInfo: TestInfo): LivePersona => {
  const auth = createUniqueAuthUser(testInfo);
  const nonce = `${Date.now()}-${testInfo.workerIndex}-${testInfo.retry}`;
  const displayName = 'Dr. Elara Voss';
  const currentCompany = 'Wayne Enterprises';
  const resumeTitle = `${displayName} - AI Systems Resume ${nonce}`;
  const updatedResumeTitle = `${displayName} - Principal AI Systems Resume ${nonce}`;
  const jobTitle = `Principal Applied AI Engineer - Tyrell Corporation ${nonce}`;
  const updatedJobTitle = `Principal Applied AI Engineer - Tyrell Advanced Research ${nonce}`;

  const resumeContent = `${displayName}
Senior Machine Learning Engineer, ${currentCompany}
Gotham City, NJ
${auth.email}

SUMMARY
Computer Science PhD with strong graduate research in large-scale machine learning systems, retrieval pipelines, and human-centered AI products. Seven years of experience delivering production AI platforms, leading cross-functional teams, and translating research into measurable business impact.

EXPERIENCE
Senior Machine Learning Engineer | ${currentCompany} | 2021-Present
- Built an ATS optimization and semantic ranking platform that improved recruiter response rates by 31 percent.
- Led a team of five engineers shipping React, Node.js, TypeScript, Python, and PostgreSQL services for talent intelligence workflows.
- Designed retrieval augmented generation workflows, evaluation tooling, and experiment dashboards for hiring copilots.
- Partnered with product, design, and legal stakeholders to ship secure AI features with auditability and metrics.

Machine Learning Engineer | Oscorp Innovation Lab | 2018-2021
- Delivered NLP pipelines for document parsing, entity extraction, and recommendation systems.
- Maintained cloud infrastructure on AWS with Docker, CI/CD, observability dashboards, and automated testing.

EDUCATION
PhD, Computer Science | Carnegie Mellon University | 2018
Dissertation: Reliable Neural Retrieval for Enterprise Decision Support

BS, Computer Science | University of Illinois Urbana-Champaign | 2013
Graduated summa cum laude

SKILLS
Python, TypeScript, JavaScript, React, Node.js, NLP, LLM evaluation, retrieval systems, AWS, Docker, Kubernetes, PostgreSQL, experiment design, mentoring`;

  const updatedResumeContent = `${resumeContent}

SELECTED IMPACT
- Published 4 peer-reviewed papers on applied machine learning systems and served as technical mentor for graduate interns.`;

  const jobDescription = `${jobTitle}
Tyrell Corporation is hiring a principal applied AI engineer to build hiring intelligence and enterprise decision-support systems.

Responsibilities:
- Lead design of AI platforms for semantic search, retrieval augmented generation, and resume-to-role matching.
- Partner with product and design on recruiter workflows, experiment design, and measurable delivery outcomes.
- Mentor engineers across Python, TypeScript, React, Node.js, and cloud-native services.
- Own quality, observability, and secure deployment practices for customer-facing AI systems.

Requirements:
- PhD or equivalent research background in computer science, machine learning, information retrieval, or NLP.
- Experience shipping production ML systems with Python, TypeScript, React, Node.js, AWS, Docker, and PostgreSQL.
- Strong communication, cross-functional leadership, and a track record of mentoring senior engineers.
- Experience with evaluation tooling, metrics, and experimentation for AI-assisted user journeys.`;

  const updatedJobDescription = `${updatedJobTitle}
Tyrell Advanced Research is expanding its applied AI group for enterprise talent intelligence products.

Responsibilities:
- Architect semantic search and retrieval augmented generation systems for resume screening and candidate insight workflows.
- Drive end-to-end delivery across React, Node.js, TypeScript, Python, and cloud infrastructure.
- Improve observability, testing depth, and safe rollout practices for AI systems used by recruiting teams.
- Mentor engineers, review system design proposals, and collaborate closely with product, design, and analytics.

Requirements:
- PhD in computer science or a related discipline with research depth in NLP, retrieval, or ML systems.
- Experience leading production AI systems using Python, TypeScript, React, Node.js, AWS, Docker, Kubernetes, and PostgreSQL.
- Strong communication, mentorship, and metrics-driven product delivery.
- Experience building evaluation loops, auditability, and usage tracking into enterprise AI features.`;

  return {
    auth,
    displayName,
    currentCompany,
    resumeTitle,
    updatedResumeTitle,
    resumeContent,
    updatedResumeContent,
    jobTitle,
    updatedJobTitle,
    jobDescription,
    updatedJobDescription,
  };
};
