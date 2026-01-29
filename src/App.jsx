import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Mail, Phone, MapPin, Briefcase, TrendingUp, Sparkles, ChevronRight, Building2, Clock, Users, Star, LogOut, User, CreditCard, AlertCircle, Check } from 'lucide-react';

// API Configuration
const API_URL = 'https://jiffy-apply-backend.onrender.com';

const JiffyApply = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [popularJobs, setPopularJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [error, setError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setCurrentPage('home');
        fetchApplications();
        
        // Load resume text if exists
        if (userData.resume && userData.resume.text) {
          setResumeText(userData.resume.text);
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    }
  };

  // Fetch user applications
  const fetchApplications = async () => {
    try {
      const response = await fetch(`${API_URL}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  // Login
  const handleLogin = async (email, password) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setCurrentPage('home');
        
        // Check if user needs to acknowledge fees
        if (!data.user.acknowledgedFees && data.user.freeApplicationsRemaining > 0) {
          setShowFeeModal(true);
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Register
  const handleRegister = async (formData) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setCurrentPage('home');
        setShowFeeModal(true); // Show fee acknowledgement for new users
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('login');
    setApplications([]);
  };

  // Acknowledge fees
  const acknowledgeFees = async () => {
    try {
      await fetch(`${API_URL}/user/acknowledge-fees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUser({ ...user, acknowledgedFees: true });
      setShowFeeModal(false);
    } catch (error) {
      console.error('Error acknowledging fees:', error);
    }
  };

  // Subscribe
  const handleSubscribe = async (paymentData) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/subscription/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser({ ...user, subscription: data.subscription });
        setShowSubscriptionModal(false);
        alert('Subscription activated successfully! You now have unlimited applications.');
      } else {
        setError(data.error || 'Subscription failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Demo popular jobs data
  const getDemoPopularJobs = () => [
    { category: 'Technology', count: 1247, avgSalary: 95000, promotional: true },
    { category: 'Healthcare', count: 892, avgSalary: 78000, promotional: false },
    { category: 'Finance', count: 654, avgSalary: 88000, promotional: true },
    { category: 'Engineering', count: 543, avgSalary: 92000, promotional: false },
    { category: 'Sales & Marketing', count: 487, avgSalary: 67000, promotional: true },
    { category: 'Education', count: 423, avgSalary: 52000, promotional: false }
  ];

  // Fetch popular jobs
  const fetchPopularJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/jobs/popular`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      
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

      const categorizedJobs = Object.values(jobsByCategory).map(cat => ({
        ...cat,
        avgSalary: cat.avgSalary / cat.count,
        promotional: Math.random() > 0.5
      })).sort((a, b) => b.count - a.count);

      setPopularJobs(categorizedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setPopularJobs(getDemoPopularJobs());
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPopularJobs();
    }
  }, [isAuthenticated]);

  // Auto apply to jobs (with resume requirement)
  const autoApplyToJobs = async () => {
    // Check if user has resume
    if (!user.resume || !user.resume.text) {
      alert('⚠️ Please add and analyze your resume first in the Resume Work Center before auto-applying to jobs.');
      setCurrentPage('resume');
      return;
    }

    // Check if user needs subscription
    if (user.freeApplicationsRemaining <= 0 && user.subscription.status !== 'active') {
      setShowSubscriptionModal(true);
      return;
    }

    setLoading(true);
    const newApplications = [];
    
    try {
      // Build search keywords from parsed resume
      const parsedData = user.resume.parsedData;
      const keywords = [
        ...(parsedData.jobTitles || []),
        ...(parsedData.skills || []).slice(0, 5), // Top 5 skills
        ...(parsedData.keywords || []).slice(0, 3) // Top 3 keywords
      ].join(' ');

      // Call backend with keywords from resume
      const response = await fetch(`${API_URL}/jobs/search?keywords=${encodeURIComponent(keywords)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        alert('No matching jobs found for your profile. Try updating your resume with more skills and keywords.');
        setLoading(false);
        return;
      }
      
      data.results.slice(0, 5).forEach(job => {
        newApplications.push({
          jobId: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          salary: job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}K - $${(job.salary_max / 1000).toFixed(0)}K` : 'Not specified',
          considerationDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          hiringManager: 'HR Department',
          contactEmail: 'Available upon request',
          status: 'Applied',
          source: 'Adzuna'
        });
      });

      // Send to backend
      const submitResponse = await fetch(`${API_URL}/applications/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ applications: newApplications })
      });

      const submitData = await submitResponse.json();

      if (submitResponse.ok) {
        setApplications(prev => [...submitData.applications, ...prev]);
        setUser({
          ...user,
          freeApplicationsRemaining: submitData.freeApplicationsRemaining,
          applicationCount: user.applicationCount + submitData.applications.length
        });

        alert(`✅ Applied to ${submitData.applications.length} jobs tailored to your resume!`);

        if (submitData.requiresSubscription) {
          setShowSubscriptionModal(true);
        }
      } else if (submitData.requiresSubscription) {
        setShowSubscriptionModal(true);
      }
    } catch (error) {
      console.error('Error auto-applying:', error);
      alert('Error applying to jobs. Please try again.');
    }
    setLoading(false);
  };

  // Analyze resume (backend does both parsing and suggestions)
  const analyzeResume = async () => {
    if (!resumeText.trim()) return;
    
    setAnalyzingResume(true);
    setError('');
    
    try {
      // Backend handles both parsing AND suggestions
      const response = await fetch(`${API_URL}/user/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText })
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      const data = await response.json();
      
      // Update user with parsed resume data
      setUser({
        ...user,
        resume: {
          text: resumeText,
          parsedData: data.parsedData,
          lastUpdated: new Date()
        }
      });

      // Set the AI suggestions from backend
      setAiSuggestions(data.suggestions);
      
      alert('✅ Resume saved and analyzed! Your job matches will now be tailored to your experience.');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError('Error analyzing resume. Please try again.');
      setAiSuggestions('Error analyzing resume. Please try again.');
    }
    setAnalyzingResume(false);
  };

  // Login Page Component
  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      handleLogin(email, password);
    };

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-logo">Jiffy Apply</h1>
            <p className="auth-tagline">Your career, automated</p>
          </div>

          <div className="auth-card">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Sign in to continue job hunting</p>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="auth-button">
                Sign In
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account?{' '}
              <button className="link-button" onClick={() => setCurrentPage('register')}>
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Register Page Component
  const RegisterPage = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: ''
    });

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const { confirmPassword, ...registerData } = formData;
      handleRegister(registerData);
    };

    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-logo">Jiffy Apply</h1>
            <p className="auth-tagline">Start your automated job search</p>
          </div>

          <div className="auth-card">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Get 50 free applications to start</p>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(240) 123-4567"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="auth-button">
                Create Account
              </button>
            </form>

            <div className="auth-footer">
              Already have an account?{' '}
              <button className="link-button" onClick={() => setCurrentPage('login')}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fee Acknowledgement Modal
  const FeeModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <AlertCircle size={48} className="modal-icon" />
          <h2>Important Information</h2>
        </div>
        <div className="modal-body">
          <p className="modal-text">
            Welcome to Jiffy Apply! You have <strong>{user?.freeApplicationsRemaining} free applications</strong> to get started.
          </p>
          <p className="modal-text">
            After your free applications are used, there is a subscription fee of <strong>$5.00/month</strong> for unlimited job applications.
          </p>
          <div className="benefits-list">
            <div className="benefit-item">
              <Check size={20} className="check-icon" />
              <span>Unlimited auto-applications</span>
            </div>
            <div className="benefit-item">
              <Check size={20} className="check-icon" />
              <span>AI-powered resume optimization</span>
            </div>
            <div className="benefit-item">
              <Check size={20} className="check-icon" />
              <span>Priority job matching</span>
            </div>
            <div className="benefit-item">
              <Check size={20} className="check-icon" />
              <span>Application tracking & analytics</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-button primary" onClick={acknowledgeFees}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );

  // Subscription Modal
  const SubscriptionModal = () => {
    const [paymentData, setPaymentData] = useState({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: ''
    });

    const handlePaymentChange = (e) => {
      let value = e.target.value;
      
      if (e.target.name === 'cardNumber') {
        value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      }
      
      if (e.target.name === 'expiryDate') {
        value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
      }

      setPaymentData({ ...paymentData, [e.target.name]: value });
    };

    const handlePaymentSubmit = (e) => {
      e.preventDefault();
      const cleanedData = {
        ...paymentData,
        cardNumber: paymentData.cardNumber.replace(/\s/g, '')
      };
      handleSubscribe(cleanedData);
    };

    return (
      <div className="modal-overlay">
        <div className="modal subscription-modal">
          <div className="modal-header">
            <CreditCard size={48} className="modal-icon subscription-icon" />
            <h2>Subscribe to Continue</h2>
          </div>
          <div className="modal-body">
            <p className="modal-text">
              You've used all your free applications. Subscribe for just <strong>$5.00/month</strong> to continue applying to unlimited jobs.
            </p>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handlePaymentChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  name="cardName"
                  value={paymentData.cardName}
                  onChange={handlePaymentChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handlePaymentChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handlePaymentChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="subscription-info">
                <p>✓ Cancel anytime</p>
                <p>✓ Secure payment processing</p>
                <p>✓ Unlimited applications</p>
              </div>

              <button type="submit" className="modal-button primary">
                Subscribe for $5.00/month
              </button>
            </form>
          </div>
          <div className="modal-footer">
            <button className="modal-button secondary" onClick={() => setShowSubscriptionModal(false)}>
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

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
          <div className="user-stats">
            <div className="stat-badge">
              <Briefcase size={20} />
              <span>{user?.applicationCount || 0} Applications</span>
            </div>
            {user?.subscription.status !== 'active' && (
              <div className="stat-badge">
                <Star size={20} />
                <span>{user?.freeApplicationsRemaining || 0} Free Left</span>
              </div>
            )}
            {user?.subscription.status === 'active' && (
              <div className="stat-badge premium">
                <CreditCard size={20} />
                <span>Premium Member</span>
              </div>
            )}
          </div>
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
          {!user?.resume?.text && (
            <p style={{color: '#f59e0b', marginTop: '1rem'}}>
              💡 Add your resume in the Resume Work Center first for tailored job matches!
            </p>
          )}
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
                  <span>Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <Clock size={16} />
                  <span>Consideration: {new Date(app.considerationDate).toLocaleDateString()}</span>
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
          <p className="page-subtitle">⚠️ Required: Add your resume to enable tailored job matching</p>
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
            placeholder="Paste your current resume text here... (Required for auto-apply)"
          />
          <button 
            className="analyze-button" 
            onClick={analyzeResume}
            disabled={analyzingResume || !resumeText.trim()}
          >
            {analyzingResume ? (
              <>Analyzing & Saving...</>
            ) : (
              <>
                <Sparkles size={20} />
                Save & Analyze Resume
              </>
            )}
          </button>
          <p style={{color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem'}}>
            💡 Your resume will be parsed to find jobs matching your skills and experience
          </p>
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
          <h2>Pricing</h2>
          <div className="pricing-info">
            <p>Start with <strong>50 free applications</strong> to test our platform.</p>
            <p>After that, continue for just <strong>$5.00/month</strong> with unlimited applications.</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <>
        <style>{getStyles()}</style>
        {currentPage === 'login' ? <LoginPage /> : <RegisterPage />}
      </>
    );
  }

  return (
    <div className="app">
      <style>{getStyles()}</style>

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
            <div className="user-menu">
              <User size={18} />
              <span>{user?.firstName}</span>
              <button className="logout-btn" onClick={logout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {currentPage === 'home' && <HomePage />}
      {currentPage === 'applications' && <ApplicationsPage />}
      {currentPage === 'resume' && <ResumeWorkCenter />}
      {currentPage === 'about' && <AboutPage />}

      {showFeeModal && <FeeModal />}
      {showSubscriptionModal && <SubscriptionModal />}
    </div>
  );
};

const getStyles = () => `
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

  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  }

  .auth-container {
    width: 100%;
    max-width: 480px;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-logo {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  .auth-tagline {
    color: #94a3b8;
    font-size: 1.1rem;
  }

  .auth-card {
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .auth-card h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .auth-subtitle {
    color: #94a3b8;
    margin-bottom: 2rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: #cbd5e1;
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(15, 23, 42, 0.7);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .auth-button {
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 0.5rem;
  }

  .auth-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
  }

  .auth-footer {
    text-align: center;
    margin-top: 2rem;
    color: #94a3b8;
  }

  .link-button {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-weight: 600;
    text-decoration: underline;
  }

  .link-button:hover {
    color: #60a5fa;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.3s ease-out;
  }

  .modal {
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 20px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease-out;
  }

  .subscription-modal {
    max-width: 600px;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    text-align: center;
    padding: 2.5rem 2rem 1.5rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  .modal-icon {
    margin: 0 auto 1rem;
    color: #f59e0b;
  }

  .subscription-icon {
    color: #3b82f6;
  }

  .modal-header h2 {
    font-size: 1.75rem;
    font-weight: 700;
  }

  .modal-body {
    padding: 2rem;
  }

  .modal-text {
    color: #cbd5e1;
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .benefits-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .benefit-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #cbd5e1;
  }

  .check-icon {
    color: #22c55e;
    flex-shrink: 0;
  }

  .modal-footer {
    padding: 1.5rem 2rem 2.5rem;
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .modal-button {
    padding: 0.875rem 2rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
  }

  .modal-button.primary {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
  }

  .modal-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
  }

  .modal-button.secondary {
    background: rgba(148, 163, 184, 0.1);
    color: #94a3b8;
  }

  .modal-button.secondary:hover {
    background: rgba(148, 163, 184, 0.2);
  }

  .payment-form {
    margin-top: 1.5rem;
  }

  .subscription-info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .subscription-info p {
    color: #cbd5e1;
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }

  .pricing-info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  .pricing-info p {
    color: #cbd5e1;
    margin: 0.75rem 0;
    font-size: 1.05rem;
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
    align-items: center;
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

  .user-menu {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: rgba(148, 163, 184, 0.1);
    border-radius: 8px;
    color: #cbd5e1;
    margin-left: 1rem;
  }

  .logout-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.3s ease;
  }

  .logout-btn:hover {
    color: #ef4444;
  }

  .page-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 3rem 2rem;
    animation: fadeIn 0.6s ease-out;
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

  .user-stats {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .stat-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 20px;
    color: #cbd5e1;
    font-weight: 600;
  }

  .stat-badge.premium {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
    border-color: rgba(59, 130, 246, 0.4);
    color: #60a5fa;
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

    .user-menu {
      margin-left: 0.5rem;
      padding: 0.5rem 1rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }
`;

export default JiffyApply;
