const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

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

// Helper function to determine card type
function getCardType(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  return 'Unknown';
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
