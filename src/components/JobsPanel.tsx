import { useState } from 'react'
import {
  JOB_CATEGORIES,
  buildIndeedUrl,
  buildJobbermanUrl,
  buildLinkedInUrl,
  getJobsByCategory,
  type JobCategory,
} from '../lib/jobs'

type Filter = JobCategory | 'All'

export function JobsPanel() {
  const [filter, setFilter] = useState<Filter>('All')
  const jobs = getJobsByCategory(filter)

  return (
    <section className="panel jobs-panel">
      <div className="jobs-header">
        <div>
          <h2>Jobs in Enugu</h2>
          <p className="jobs-subtitle">Opportunities across tech, education and more</p>
        </div>
        <div className="jobs-live-links">
          <span>Search live:</span>
          <a href={buildJobbermanUrl(filter)} target="_blank" rel="noopener noreferrer">Jobberman</a>
          <a href={buildLinkedInUrl(filter)} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={buildIndeedUrl(filter)} target="_blank" rel="noopener noreferrer">Indeed</a>
        </div>
      </div>

      <div className="jobs-chips">
        <button
          type="button"
          className={`job-chip ${filter === 'All' ? 'job-chip--active' : ''}`}
          onClick={() => setFilter('All')}
        >
          All
        </button>
        {JOB_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`job-chip ${filter === category ? 'job-chip--active' : ''}`}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="jobs-grid">
        {jobs.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-card-top">
              <span className="job-category">{job.category}</span>
              <span className="job-type">{job.type}</span>
            </div>
            <h3 className="job-title">{job.title}</h3>
            <p className="job-org">{job.organization}</p>
            <p className="job-summary">{job.summary}</p>
            <div className="job-card-bottom">
              <span className="job-location">📍 {job.location}</span>
              <a
                className="job-apply"
                href={buildLinkedInUrl(job.category)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Find &amp; Apply →
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="jobs-note">
        Curated representative roles for Enugu. Use the live-search links above for real-time openings.
      </p>
    </section>
  )
}
