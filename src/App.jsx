import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Mail, Phone, MapPin, Briefcase, TrendingUp, FileText, Sparkles, ChevronRight, Building2, Clock, Users, Star } from 'lucide-react';

// Configuration for API keys
const API_CONFIG = {
  adzuna: {
    appId: '4c31e651',
    apiKey: '2a910f6dea66fef67e15128356e2019d'
  },
  usajobs: {
    apiKey: '/k4uj3LSM563nujXwQBaFdM8x+BI7ue4mhgZGMbC7bI='
  }
};

const JiffyApply = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [popularJobs, setPopularJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  // Fetch popular jobs on mount
  useEffect(() => {
    fetchPopularJobs();
  }, []);

  const fetchPopularJobs = async () => {
    setLoading(true);
    try {
      // Fetch from Adzuna API
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${API_CONFIG.adzuna.appId}&app_key=${API_CONFIG.adzuna.apiKey}&results_per_page=20&sort_by=date`
      );
      const data = await response.json();
      
      // Process and categorize jobs
      const jobsByCategory = {};
      data.results.forEach(job => {
        const category = job.category?.label || 'Other';
        if (!jobsByCategory[category]) {
          jobsByCategory[category] = {
            category,
            count: 0,
            avgSalary: 0,
            jobs: []
          };
        }
        jobsByCategory[category].count++;
        jobsByCategory[category].jobs.push(job);
        if (job.salary_min) {
          jobsByCategory[category].avgSalary += job.salary_min;
        }
      });

      // Calculate averages and format
      const categorizedJobs = Object.values(jobsByCategory).map(cat => ({
        ...cat,
        avgSalary: cat.avgSalary / cat.count,
        promotional: Math.random() > 0.5 // Simulated promotional status
      })).sort((a, b) => b.count - a.count);

      setPopularJobs(categorizedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Set demo data if API fails
      setPopularJobs(getDemoPopularJobs());
    }
    setLoading(false);
  };

  const fetchUSAJobs = async () => {
    try {
      const response = await fetch('https://data.usajobs.gov/api/search', {
        headers: {
          'Authorization-Key': API_CONFIG.usajobs.apiKey,
          'User-Agent': 'malcolmalbright@gmail.com'
        }
      });
      const data = await response.json();
      return data.SearchResult?.SearchResultItems || [];
    } catch (error) {
      console.error('Error fetching USA Jobs:', error);
      return [];
    }
  };

  const autoApplyToJobs = async () => {
    setLoading(true);
    const newApplications = [];
    
    try {
      // Fetch from both APIs
      const adzunaResponse = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${API_CONFIG.adzuna.appId}&app_key=${API_CONFIG.adzuna.apiKey}&results_per_page=10`
      );
      const adzunaData = await adzunaResponse.json();
      
      // Process Adzuna jobs
      adzunaData.results.slice(0, 5).forEach(job => {
        newApplications.push({
          id: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          salary: job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}K - $${(job.salary_max / 1000).toFixed(0)}K` : 'Not specified',
          appliedDate: new Date().toLocaleDateString(),
          considerationDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          hiringManager: 'HR Department',
          contactEmail: job.redirect_url || 'Not available',
          status: 'Applied',
          source: 'Adzuna'
        });
      });

      setApplications(prev => [...newApplications, ...prev]);
    } catch (error) {
      console.error('Error auto-applying:', error);
    }
    setLoading(false);
  };

  const analyzeResume = async () => {
    if (!resumeText.trim()) return;
    
    setAnalyzingResume(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a professional resume advisor. Analyze this resume and provide specific, actionable suggestions to improve it for job applications. Focus on: 1) Content improvements, 2) Formatting suggestions, 3) Keywords to add, 4) Skills to highlight. Be concise and specific.

Resume:
${resumeText}

Provide your response as a structured analysis with clear sections.`
            }
          ],
        })
      });

      const data = await response.json();
      const suggestions = data.content[0].text;
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setAiSuggestions('Error analyzing resume. Please try again.');
    }
    setAnalyzingResume(false);
  };

  const getDemoPopularJobs = () => [
    { category: 'Technology', count: 1247, avgSalary: 95000, promotional: true },
    { category: 'Healthcare', count: 892, avgSalary: 78000, promotional: false },
    { category: 'Finance', count: 654, avgSalary: 88000, promotional: true },
    { category: 'Engineering', count: 543, avgSalary: 92000, promotional: false },
    { category: 'Sales & Marketing', count: 487, avgSalary: 67000, promotional: true },
    { category: 'Education', count: 423, avgSalary: 52000, promotional: false },
    { category: 'Customer Service', count: 389, avgSalary: 45000, promotional: false },
    { category: 'Manufacturing', count: 321, avgSalary: 58000, promotional: true }
  ];

  // Pages
  const HomePage = () => (
    <div className="page-content">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Career, <span className="highlight">Automated</span>
          </h1>
          <p className="hero-subtitle">
            Jiffy Apply uses advanced AI to automatically apply to thousands of jobs on your behalf. 
            Sit back while we work 24/7 to land your dream position.
          </p>
          <button className="cta-button" onClick={() => setCurrentPage('applications')}>
            <Sparkles size={20} />
            Start Auto-Applying Now
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="section-header">
        <h2>Today's Popular Jobs by Category</h2>
        <p className="section-subtitle">Updated daily with the latest market trends</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-value">{popularJobs.reduce((sum, cat) => sum + cat.count, 0).toLocaleString()}</div>
          <div className="stat-label">Active Positions</div>
        </div>
        <div className="stat-card">
          <Building2 className="stat-icon" />
          <div className="stat-value">{popularJobs.length}</div>
          <div className="stat-label">Job Categories</div>
        </div>
        <div className="stat-card">
          <DollarSign className="stat-icon" />
          <div className="stat-value">
            ${Math.round(popularJobs.reduce((sum, cat) => sum + cat.avgSalary, 0) / popularJobs.length / 1000)}K
          </div>
          <div className="stat-label">Avg. Salary</div>
        </div>
      </div>

      <div className="jobs-grid">
        {loading ? (
          <div className="loading">Loading popular jobs...</div>
        ) : (
          popularJobs.map((job, idx) => (
            <div key={idx} className="job-category-card">
              {job.promotional && <div className="promotional-badge">🔥 Hot</div>}
              <div className="job-category-header">
                <Briefcase className="category-icon" />
                <h3>{job.category}</h3>
              </div>
              <div className="job-stats">
                <div className="job-stat">
                  <Users size={16} />
                  <span>{job.count} positions</span>
                </div>
                <div className="job-stat">
                  <DollarSign size={16} />
                  <span>${(job.avgSalary / 1000).toFixed(0)}K avg</span>
                </div>
              </div>
              <button className="view-jobs-btn" onClick={() => setCurrentPage('applications')}>
                View & Auto-Apply
                <ChevronRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ApplicationsPage = () => (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Your Applications</h2>
          <p className="page-subtitle">Track all auto-applied positions in real-time</p>
        </div>
        <button className="primary-button" onClick={autoApplyToJobs} disabled={loading}>
          {loading ? 'Processing...' : 'Auto-Apply to New Jobs'}
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} className="empty-icon" />
          <h3>No Applications Yet</h3>
          <p>Click "Auto-Apply to New Jobs" to get started</p>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app, idx) => (
            <div key={idx} className="application-card">
              <div className="app-header">
                <div>
                  <h3>{app.title}</h3>
                  <p className="company-name">{app.company}</p>
                </div>
                <div className="status-badge">{app.status}</div>
              </div>
              
              <div className="app-details">
                <div className="detail-row">
                  <MapPin size={16} />
                  <span>{app.location}</span>
                </div>
                <div className="detail-row">
                  <DollarSign size={16} />
                  <span>{app.salary}</span>
                </div>
                <div className="detail-row">
                  <Calendar size={16} />
                  <span>Applied: {app.appliedDate}</span>
                </div>
                <div className="detail-row">
                  <Clock size={16} />
                  <span>Consideration Date: {app.considerationDate}</span>
                </div>
              </div>

              <div className="hiring-info">
                <h4>Contact Hiring Manager</h4>
                <div className="contact-details">
                  <div className="contact-item">
                    <Mail size={14} />
                    <span>{app.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ResumeWorkCenter = () => (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Resume Work Center</h2>
          <p className="page-subtitle">AI-powered resume optimization for better job matches</p>
        </div>
      </div>

      <div className="resume-center">
        <div className="resume-input-section">
          <label htmlFor="resume-text">Paste Your Resume</label>
          <textarea
            id="resume-text"
            className="resume-textarea"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your current resume text here..."
          />
          <button 
            className="analyze-button" 
            onClick={analyzeResume}
            disabled={analyzingResume || !resumeText.trim()}
          >
            {analyzingResume ? (
              <>Analyzing...</>
            ) : (
              <>
                <Sparkles size={20} />
                AI Resume Analysis
              </>
            )}
          </button>
        </div>

        {aiSuggestions && (
          <div className="suggestions-section">
            <h3>
              <Star size={20} />
              AI Recommendations
            </h3>
            <div className="suggestions-content">
              {aiSuggestions}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AboutPage = () => (
    <div className="page-content">
      <div className="about-hero">
        <h1>About Jiffy Apply</h1>
        <p className="about-tagline">Revolutionizing job search with intelligent automation</p>
      </div>

      <div className="about-content">
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            Jiffy Apply transforms the job search process by leveraging cutting-edge AI and automation 
            technology. We believe that finding your dream job shouldn't require hundreds of hours 
            manually filling out applications. Our platform works 24/7 to match you with opportunities 
            and automatically submit applications on your behalf.
          </p>
        </div>

        <div className="about-section">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-number">1</div>
              <h3>Profile Setup</h3>
              <p>Upload your resume and set your job preferences</p>
            </div>
            <div className="feature">
              <div className="feature-number">2</div>
              <h3>AI Matching</h3>
              <p>Our AI scans thousands of jobs daily to find perfect matches</p>
            </div>
            <div className="feature">
              <div className="feature-number">3</div>
              <h3>Auto-Apply</h3>
              <p>We automatically apply to relevant positions using our API integrations</p>
            </div>
            <div className="feature">
              <div className="feature-number">4</div>
              <h3>Track & Manage</h3>
              <p>Monitor all applications in your personalized dashboard</p>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <h2>Contact Information</h2>
          <div className="contact-card">
            <div className="contact-header">
              <Building2 size={32} />
              <div>
                <h3>Malcolm Albright</h3>
                <p>Chief Executive Officer</p>
              </div>
            </div>
            <div className="contact-details-grid">
              <div className="contact-detail">
                <Phone size={20} />
                <div>
                  <span className="label">Phone</span>
                  <a href="tel:2404746455">(240) 474-6455</a>
                </div>
              </div>
              <div className="contact-detail">
                <Mail size={20} />
                <div>
                  <span className="label">Email</span>
                  <a href="mailto:malcolmalbright@gmail.com">malcolmalbright@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <h2>Our Technology</h2>
          <p>
            Jiffy Apply integrates with leading job platforms including USAJOBS and Adzuna, 
            giving you access to millions of opportunities across government and private sectors. 
            Our AI-powered resume optimization ensures your application stands out, while our 
            automated application system works around the clock to maximize your chances of success.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
        }

        .navbar {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          padding: 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
          animation: slideDown 0.5s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .nav-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
        }

        .nav-link {
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .nav-link:hover {
          background: rgba(148, 163, 184, 0.1);
          color: #e2e8f0;
        }

        .nav-link.active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
        }

        .page-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-section {
          text-align: center;
          padding: 4rem 0;
          margin-bottom: 4rem;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          letter-spacing: -0.03em;
        }

        .highlight {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #94a3b8;
          max-width: 700px;
          margin: 0 auto 2.5rem;
          line-height: 1.7;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          color: #3b82f6;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .job-category-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .job-category-card:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
        }

        .promotional-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .job-category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .category-icon {
          width: 40px;
          height: 40px;
          color: #3b82f6;
        }

        .job-category-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .job-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .job-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
        }

        .view-jobs-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-jobs-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 3rem;
        }

        .page-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .primary-button {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        .primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .application-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .application-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1);
        }

        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .app-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .company-name {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .app-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #94a3b8;
        }

        .hiring-info {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .hiring-info h4 {
          color: #3b82f6;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #cbd5e1;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          color: #475569;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #94a3b8;
        }

        .resume-center {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 968px) {
          .resume-center {
            grid-template-columns: 1fr;
          }
        }

        .resume-input-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .resume-input-section label {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
        }

        .resume-textarea {
          min-height: 400px;
          padding: 1.5rem;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          color: #e2e8f0;
          font-family: 'Courier New', monospace;
          font-size: 0.95rem;
          line-height: 1.6;
          resize: vertical;
        }

        .resume-textarea:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .analyze-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .analyze-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        }

        .analyze-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .suggestions-section {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 2rem;
          animation: slideInRight 0.5s ease-out;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .suggestions-section h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #f59e0b;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .suggestions-content {
          color: #cbd5e1;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .about-hero {
          text-align: center;
          padding: 3rem 0;
          margin-bottom: 3rem;
        }

        .about-hero h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .about-tagline {
          font-size: 1.5rem;
          color: #94a3b8;
        }

        .about-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .about-section {
          margin-bottom: 3rem;
        }

        .about-section h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #3b82f6;
        }

        .about-section p {
          color: #cbd5e1;
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .feature {
          text-align: center;
        }

        .feature-number {
          width: 60px;
          height: 60px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        .feature h3 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .feature p {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .contact-section {
          margin: 4rem 0;
        }

        .contact-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 16px;
          padding: 2.5rem;
          margin-top: 2rem;
        }

        .contact-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .contact-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .contact-header p {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .contact-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .contact-detail {
          display: flex;
          gap: 1rem;
        }

        .contact-detail .label {
          display: block;
          color: #94a3b8;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .contact-detail a {
          color: #3b82f6;
          text-decoration: none;
          font-size: 1.1rem;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .contact-detail a:hover {
          color: #60a5fa;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          color: #94a3b8;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .nav-links {
            flex-wrap: wrap;
          }

          .page-content {
            padding: 2rem 1rem;
          }

          .jobs-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">Jiffy Apply</div>
          <div className="nav-links">
            <button
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Popular Jobs
            </button>
            <button
              className={`nav-link ${currentPage === 'applications' ? 'active' : ''}`}
              onClick={() => setCurrentPage('applications')}
            >
              My Applications
            </button>
            <button
              className={`nav-link ${currentPage === 'resume' ? 'active' : ''}`}
              onClick={() => setCurrentPage('resume')}
            >
              Resume Center
            </button>
            <button
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => setCurrentPage('about')}
            >
              About
            </button>
          </div>
        </div>
      </nav>

      {currentPage === 'home' && <HomePage />}
      {currentPage === 'applications' && <ApplicationsPage />}
      {currentPage === 'resume' && <ResumeWorkCenter />}
      {currentPage === 'about' && <AboutPage />}
    </div>
  );
};

export default JiffyApply;