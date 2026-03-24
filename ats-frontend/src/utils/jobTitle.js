export const extractJobTitle = (jobDescription) => {
  if (!jobDescription || typeof jobDescription !== 'string') {
    return 'Untitled Job';
  }

  const lines = jobDescription
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines.slice(0, 5)) {
    if (
      line.length > 3 &&
      line.length < 120 &&
      (
        line.includes('Engineer') ||
        line.includes('Developer') ||
        line.includes('Manager') ||
        line.includes('Analyst') ||
        line.includes('Scientist') ||
        line.includes('Research') ||
        line.includes('Lead') ||
        line.includes('Principal')
      )
    ) {
      return line;
    }
  }

  return lines[0] || 'Untitled Job';
};
