/**
 * Resume Text Extraction Utility
 * Shared utility for extracting readable text from structured resume data.
 * Used by both ResumeFileService and ResumeAnalysisService.
 */

/**
 * Extracts readable text from structured resume data
 * @param data - Structured resume data object (e.g. from AI parsing or file import)
 * @returns Plain text representation of the resume
 */
export function extractTextFromStructuredData(data: any): string {
  const sections: string[] = [];

  if (data.personalInfo) {
    const { fullName, email, phone, location } = data.personalInfo;
    sections.push(`${fullName || 'Name'}`);
    if (email) sections.push(`Email: ${email}`);
    if (phone) sections.push(`Phone: ${phone}`);
    if (location) sections.push(`Location: ${location}`);
  }

  if (data.summary) {
    sections.push(`SUMMARY\n${data.summary}`);
  }

  if (data.experience && Array.isArray(data.experience)) {
    sections.push('EXPERIENCE');
    data.experience.forEach((exp: any) => {
      sections.push(`${exp.title || exp.position || 'Position'} at ${exp.company || 'Company'}`);
      sections.push(`${exp.startDate || 'Start'} - ${exp.endDate || 'Present'}`);
      if (exp.description) sections.push(exp.description);
    });
  }

  if (data.education && Array.isArray(data.education)) {
    sections.push('EDUCATION');
    data.education.forEach((edu: any) => {
      sections.push(`${edu.degree || 'Degree'} from ${edu.institution || edu.school || 'School'}`);
      if (edu.graduationDate) sections.push(`Graduated: ${edu.graduationDate}`);
    });
  }

  if (data.skills && Array.isArray(data.skills)) {
    sections.push(`SKILLS\n${data.skills.join(', ')}`);
  }

  if (data.certifications && Array.isArray(data.certifications)) {
    sections.push('CERTIFICATIONS');
    data.certifications.forEach((cert: any) => {
      sections.push(`${cert.name || 'Certification'}${cert.issuer ? ` - ${cert.issuer}` : ''}`);
    });
  }

  if (data.projects && Array.isArray(data.projects)) {
    sections.push('PROJECTS');
    data.projects.forEach((project: any) => {
      sections.push(`${project.name || 'Project'}`);
      if (project.description) sections.push(project.description);
    });
  }

  return sections.join('\n\n');
}
