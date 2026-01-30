const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();

// ============================================
// CORS Configuration - Updated
// ============================================
const allowedOrigins = [
  'https://smoothicedude.github.io',
  'http://localhost:3000',
  'http://localhost:5173' // In case you use Vite
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests for all routes
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// File Upload Configuration
// ============================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX allowed.'));
    }
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jiffy-apply')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  subscription: {
    status: {
      type: String,
      enum: ['free', 'active', 'cancelled'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    paymentMethod: {
      cardLast4: String,
      cardType: String,
      expiryDate: String
    }
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  freeApplicationsRemaining: {
    type: Number,
    default: 50
  },
  acknowledgedFees: {
    type: Boolean,
    default: false
  },
  resume: {
    originalText: String,
    parsed: {
      skills: [String],
      experience: [{
        title: String,
        company: String,
        duration: String
      }],
      education: [{
        degree: String,
        school: String,
        year: String
      }],
      keywords: [String]
    },
    uploadedAt: Date
  }
});

// Application Schema
const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: String,
  salary: String,
  appliedDate: {
    type: Date,
    default: Date.now
  },
  considerationDate: Date,
  hiringManager: String,
  contactEmail: String,
  contactPhone: String,
  status: {
    type: String,
    enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Rejected', 'Offer'],
    default: 'Applied'
  },
  source: {
    type: String,
    enum: ['Adzuna', 'USAJOBS'],
    required: true
  },
  notes: String
});

const User = mongoose.model('User', userSchema);
const Application = mongoose.model('Application', applicationSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// ============================================
// Routes
// ============================================

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Jiffy Apply API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    allowedOrigins
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        applicationCount: user.applicationCount,
        freeApplicationsRemaining: user.freeApplicationsRemaining,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        applicationCount: user.applicationCount,
        freeApplicationsRemaining: user.freeApplicationsRemaining,
        subscription: user.subscription,
        acknowledgedFees: user.acknowledgedFees
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Acknowledge fees
app.post('/api/user/acknowledge-fees', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.acknowledgedFees = true;
    await user.save();

    res.json({ message: 'Fees acknowledged', acknowledgedFees: true });
  } catch (error) {
    console.error('Acknowledge fees error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resume upload and parsing
app.post('/api/user/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let resumeText = '';

    // Parse based on file type
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = result.value;
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from resume' });
    }

    // Call Claude API to parse resume
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Parse this resume and extract key information. Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "Job Title", "company": "Company Name", "duration": "2020-2023"}],
  "education": [{"degree": "Degree", "school": "School Name", "year": "2020"}],
  "keywords": ["keyword1", "keyword2"]
}

Resume text:
${resumeText}`
        }]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const parsedContent = claudeData.content[0].text;
    
    // Try to parse the JSON response from Claude
    let parsedResume;
    try {
      parsedResume = JSON.parse(parsedContent);
    } catch (e) {
      // If Claude didn't return pure JSON, extract it
      const jsonMatch = parsedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResume = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse resume data from Claude');
      }
    }

    // Update user with parsed resume data
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.resume = {
      originalText: resumeText,
      parsed: parsedResume,
      uploadedAt: new Date()
    };
    await user.save();

    res.json({
      message: 'Resume uploaded and parsed successfully',
      resume: parsedResume
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to process resume', details: error.message });
  }
});

// Subscribe
app.post('/api/subscription/subscribe', authenticateToken, async (req, res) => {
  try {
    const { cardNumber, cardName, expiryDate, cvv } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In production, integrate with Stripe/PayPal here
    // For now, we'll just store the card info (last 4 digits only)
    const cardLast4 = cardNumber.slice(-4);
    const cardType = getCardType(cardNumber);

    user.subscription = {
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paymentMethod: {
        cardLast4,
        cardType,
        expiryDate
      }
    };

    await user.save();

    res.json({
      message: 'Subscription activated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Server error during subscription' });
  }
});

// Get all applications for user
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId })
      .sort({ appliedDate: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new application
app.post('/api/applications', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has free applications or active subscription
    if (user.freeApplicationsRemaining <= 0 && user.subscription.status !== 'active') {
      return res.status(403).json({
        error: 'No applications remaining',
        message: 'Please subscribe to continue applying to jobs',
        requiresSubscription: true
      });
    }

    const application = new Application({
      userId: req.user.userId,
      ...req.body
    });

    await application.save();

    // Update user application count
    user.applicationCount += 1;
    if (user.freeApplicationsRemaining > 0) {
      user.freeApplicationsRemaining -= 1;
    }
    await user.save();

    res.status(201).json({
      message: 'Application created successfully',
      application,
      freeApplicationsRemaining: user.freeApplicationsRemaining
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk create applications (for auto-apply)
app.post('/api/applications/bulk', authenticateToken, async (req, res) => {
  try {
    const { applications } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check limits
    const availableApplications = user.subscription.status === 'active' 
      ? applications.length 
      : Math.min(applications.length, user.freeApplicationsRemaining);

    if (availableApplications === 0) {
      return res.status(403).json({
        error: 'No applications remaining',
        message: 'Please subscribe to continue applying to jobs',
        requiresSubscription: true
      });
    }

    // Create applications
    const applicationsToCreate = applications.slice(0, availableApplications).map(app => ({
      userId: req.user.userId,
      ...app
    }));

    const createdApplications = await Application.insertMany(applicationsToCreate);

    // Update user stats
    user.applicationCount += createdApplications.length;
    if (user.subscription.status !== 'active') {
      user.freeApplicationsRemaining -= createdApplications.length;
    }
    await user.save();

    res.status(201).json({
      message: `${createdApplications.length} applications created successfully`,
      applications: createdApplications,
      freeApplicationsRemaining: user.freeApplicationsRemaining,
      requiresSubscription: user.freeApplicationsRemaining <= 0 && user.subscription.status !== 'active'
    });
  } catch (error) {
    console.error('Bulk create applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application status
app.patch('/api/applications/:id', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    Object.assign(application, req.body);
    await application.save();

    res.json({ message: 'Application updated', application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete application
app.delete('/api/applications/:id', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to determine card type
function getCardType(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  return 'Unknown';
}

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Allowed origins:', allowedOrigins);
});