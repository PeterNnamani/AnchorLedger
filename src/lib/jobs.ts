export type JobCategory =
  | 'Tech'
  | 'Education'
  | 'Finance'
  | 'Healthcare'
  | 'Engineering'
  | 'Sales & Marketing'

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid'

export interface JobListing {
  id: string
  title: string
  organization: string
  category: JobCategory
  location: string
  type: JobType
  summary: string
}

export const JOB_CATEGORIES: JobCategory[] = [
  'Tech',
  'Education',
  'Finance',
  'Healthcare',
  'Engineering',
  'Sales & Marketing',
]

/**
 * Curated, realistic Enugu-focused listings. These are representative roles for
 * common Enugu employers and serve as an always-available baseline. Use the
 * live-search links for up-to-the-minute openings.
 */
export const JOBS: JobListing[] = [
  {
    id: 'tech-1',
    title: 'Frontend Developer (React)',
    organization: 'Tech startup, Independence Layout',
    category: 'Tech',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Build responsive web apps with React and TypeScript for a growing product team.',
  },
  {
    id: 'tech-2',
    title: 'IT Support Officer',
    organization: 'Enugu Electricity Distribution Company',
    category: 'Tech',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Maintain internal systems, networks and provide first-line technical support.',
  },
  {
    id: 'tech-3',
    title: 'Data Analyst',
    organization: 'Fintech firm (Hybrid)',
    category: 'Tech',
    location: 'Enugu, Nigeria',
    type: 'Hybrid',
    summary: 'Turn raw data into dashboards and insights that drive business decisions.',
  },
  {
    id: 'edu-1',
    title: 'Mathematics Teacher',
    organization: 'Secondary School, GRA',
    category: 'Education',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Teach senior secondary mathematics and prepare students for WAEC/NECO.',
  },
  {
    id: 'edu-2',
    title: 'Lecturer / Assistant Lecturer',
    organization: 'University of Nigeria (UNN)',
    category: 'Education',
    location: 'Nsukka, Enugu',
    type: 'Full-time',
    summary: 'Deliver lectures, supervise students and contribute to departmental research.',
  },
  {
    id: 'edu-3',
    title: 'Online Tutor (STEM)',
    organization: 'EdTech platform',
    category: 'Education',
    location: 'Enugu, Nigeria',
    type: 'Remote',
    summary: 'Tutor students in science and maths through live online sessions.',
  },
  {
    id: 'fin-1',
    title: 'Accountant',
    organization: 'Manufacturing company, Emene',
    category: 'Finance',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Manage ledgers, reconciliations, payroll and monthly financial reporting.',
  },
  {
    id: 'fin-2',
    title: 'Bank Relationship Officer',
    organization: 'Commercial Bank, Okpara Avenue',
    category: 'Finance',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Grow the customer base, manage accounts and drive deposit mobilisation.',
  },
  {
    id: 'health-1',
    title: 'Registered Nurse',
    organization: 'Private Hospital, Uwani',
    category: 'Healthcare',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Provide patient care, administer treatment and support clinical staff.',
  },
  {
    id: 'health-2',
    title: 'Medical Laboratory Scientist',
    organization: 'Diagnostic Centre',
    category: 'Healthcare',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Run laboratory tests, interpret results and maintain lab quality standards.',
  },
  {
    id: 'eng-1',
    title: 'Civil Engineer (Site)',
    organization: 'Construction firm',
    category: 'Engineering',
    location: 'Enugu, Nigeria',
    type: 'Contract',
    summary: 'Supervise site works, quality control and project milestones.',
  },
  {
    id: 'eng-2',
    title: 'Electrical Technician',
    organization: 'Industrial plant, Emene',
    category: 'Engineering',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Install, maintain and troubleshoot electrical equipment and systems.',
  },
  {
    id: 'sales-1',
    title: 'Digital Marketing Executive',
    organization: 'Retail brand',
    category: 'Sales & Marketing',
    location: 'Enugu, Nigeria',
    type: 'Hybrid',
    summary: 'Run social campaigns, manage ads and grow the brand online.',
  },
  {
    id: 'sales-2',
    title: 'Field Sales Representative',
    organization: 'FMCG distributor',
    category: 'Sales & Marketing',
    location: 'Enugu, Nigeria',
    type: 'Full-time',
    summary: 'Drive sales across assigned territory and build retailer relationships.',
  },
]

export function getJobsByCategory(category: JobCategory | 'All'): JobListing[] {
  if (category === 'All') return JOBS
  return JOBS.filter((job) => job.category === category)
}

/** Builds a live Jobberman search URL for a category in Enugu. */
export function buildJobbermanUrl(category: JobCategory | 'All'): string {
  const query = category === 'All' ? '' : encodeURIComponent(category.toLowerCase())
  return `https://www.jobberman.com/jobs/in-enugu${query ? `?q=${query}` : ''}`
}

/** Builds a live LinkedIn jobs search URL for a category in Enugu. */
export function buildLinkedInUrl(category: JobCategory | 'All'): string {
  const keywords = category === 'All' ? 'jobs' : category
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    keywords,
  )}&location=${encodeURIComponent('Enugu, Nigeria')}`
}

/** Builds a live Indeed jobs search URL for a category in Enugu. */
export function buildIndeedUrl(category: JobCategory | 'All'): string {
  const keywords = category === 'All' ? '' : category
  return `https://ng.indeed.com/jobs?q=${encodeURIComponent(
    keywords,
  )}&l=${encodeURIComponent('Enugu')}`
}
