require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
//const admin = require('firebase-admin');

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const app = express();

// ============================================
// FIREBASE ADMIN INITIALIZATION
// ============================================

const serviceAccount = require('./firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const firebaseAdminAuth = getAuth();

console.log('🔥 Firebase Admin initialized');

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in .env');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is missing in .env');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

console.log('🚀 Server starting...');

// ============================================
// JWT HELPER
// ============================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in .env');
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: '8h'
    }
  );
}


function authenticateToken(req, res, next) {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required'
    });
  }

  const token =
    authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

  try {

    const decoded =
      jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}



// ============================================
// ====== IN-MEMORY DATABASE (STORAGE) ======
// ============================================

// Test storage
const testStore = new Map();
const submissionStore = new Map();
const resultStore = new Map();

// ============================================
// ====== HELPER FUNCTIONS ======
// ============================================

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Calculate test results
const calculateResults = (test, submission) => {
  let correct = 0;
  let wrong = 0;
  let marksObtained = 0;
  let totalMarks = 0;

  test.questions.forEach((q) => {
    totalMarks += q.marks;
    const userAnswer = submission.answers[q.id];
    if (userAnswer) {
      if (userAnswer === q.correctAnswer) {
        correct++;
        marksObtained += q.marks;
      } else {
        wrong++;
      }
    }
  });

  const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

  return {
    studentId: submission.studentId,
    studentName: submission.studentName || 'Student',
    rollNumber: submission.studentId,
    marksObtained,
    totalMarks,
    percentage: Math.round(percentage * 100) / 100,
    correctAnswers: correct,
    wrongAnswers: wrong,
    timeTaken: `${Math.floor(submission.timeTaken / 60)} min ${submission.timeTaken % 60} sec`
  };
};

// ============================================
// ====== API ENDPOINTS ======
// ============================================


// Login
/* app.post('/api/auth/login', (req, res) => {
    res.json({ 
        success: true,
        token: 'fake-token', 
        user: { 
            email: req.body.email, 
            role: 'principal' 
        } 
    });
}); */
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login API called');

  try {
    const {
      email,
      password,
      role
    } = req.body;

    // ==============================
    // VALIDATION
    // ==============================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // ==============================
    // FIND USER
    // ==============================

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase()
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ==============================
    // CHECK PASSWORD
    // ==============================

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ==============================
    // CHECK ROLE
    // ==============================

    if (
      role &&
      user.role.toUpperCase() !== role.toUpperCase() &&
      user.role.toUpperCase() !== role.replace('_', '').toUpperCase()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Selected role does not match this account'
      });
    }

    // ==============================
    // CREATE JWT
    // ==============================

    const accessToken =
      generateAccessToken(user);

    // ==============================
    // RESPONSE
    // ==============================

    res.status(200).json({
      success: true,
      message: 'Login successful',

      user: {
        id: user.id,
        email: user.email,
        firstName: user.name,
        lastName: '',
        role: user.role,
        tenantId: '',
        tenant: {
          name: 'Sunrise Public School'
        }
      },

      accessToken
    });

  } catch (error) {

    console.error(
      '❌ Login error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Login failed',
      details: error.message
    });
  }
});

// ============================================
// GOOGLE LOGIN
// ============================================

app.post('/api/auth/google', async (req, res) => {
  console.log('🔵 Google Login API called');

  try {
    const { credential, role } = req.body;

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // ----------------------------------------
    // VERIFY GOOGLE ID TOKEN
    // ----------------------------------------

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const googleEmail = payload.email;
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const googleName =
      payload.name ||
      `${firstName} ${lastName}`.trim();

    if (!googleEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google account email not available'
      });
    }

    console.log('✅ Google email:', googleEmail);

    // ----------------------------------------
    // FIND USER IN DATABASE
    // ----------------------------------------

    let user = await prisma.user.findUnique({
      where: {
        email: googleEmail
      }
    });

    // ----------------------------------------
    // CREATE USER IF NOT FOUND
    // ----------------------------------------

    if (!user) {
      console.log('👤 Google user not found. Creating user...');

      const selectedRole = role || 'STUDENT';

      // Generate a random password because
      // our current User model requires password
      const randomPassword =
        Math.random().toString(36).slice(-12);

      const hashedPassword =
        await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email: googleEmail,
          password: hashedPassword,
          name: googleName || googleEmail,
          role: selectedRole.toUpperCase()
        }
      });

      console.log('✅ Google user created:', user.email);
    }

    // ----------------------------------------
    // GENERATE OUR JWT
    // ----------------------------------------

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    res.json({
      success: true,
      message: 'Google login successful',

      user: {
        id: user.id,
        email: user.email,
        firstName: user.name,
        lastName: '',
        role: user.role
      },

      accessToken
    });

  } catch (error) {

    console.error('❌ Google login error:', error);

    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      details: error.message
    });
  }
});

// ============================================
// MOBILE OTP LOGIN
// ============================================

app.post('/api/auth/mobile', async (req, res) => {

    console.log('📱 Mobile OTP Login API called');

    try {

      const { idToken, role } = req.body;

      // ----------------------------------------
      // 1. VALIDATE REQUEST
      // ----------------------------------------

      if (!idToken) {

        return res.status(400).json({
          success: false,
          message: 'Firebase ID token is required'
        });

      }

      // ----------------------------------------
      // 2. VERIFY FIREBASE ID TOKEN
      // ----------------------------------------

      const decodedToken =
        await firebaseAdminAuth.verifyIdToken(idToken);

      console.log('✅ Firebase token verified');

      console.log(
        'Firebase UID:',
        decodedToken.uid
      );

      console.log(
        'Firebase phone:',
        decodedToken.phone_number
      );

      // ----------------------------------------
      // 3. GET VERIFIED PHONE NUMBER
      // ----------------------------------------

      const phoneNumber =
        decodedToken.phone_number;

      if (!phoneNumber) {

        return res.status(400).json({
          success: false,
          message: 'Phone number not available in Firebase account'
        });

      }

      // ----------------------------------------
      // 4. FIND USER IN POSTGRESQL
      // ----------------------------------------

      let user =
        await prisma.user.findFirst({
          where: {
            mobile: phoneNumber
          }
        });

      // ----------------------------------------
      // 5. USER NOT FOUND
      // ----------------------------------------

      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            'No account found with this mobile number'
        });

      }

      console.log(
        '✅ User found:',
        user.email
      );

      // ----------------------------------------
      // 6. CHECK ROLE
      // ----------------------------------------

      if (
        role &&
        user.role.toUpperCase() !==
          role.toUpperCase()
      ) {

        return res.status(403).json({
          success: false,
          message:
            'Selected role does not match this account'
        });

      }

      // ----------------------------------------
      // 7. GENERATE APPLICATION JWT
      // ----------------------------------------

      const accessToken =
        generateAccessToken(user);

      // ----------------------------------------
      // 8. SEND RESPONSE
      // ----------------------------------------

      return res.status(200).json({

        success: true,

        message: 'Mobile login successful',

        user: {
          id: user.id,
          email: user.email,
          firstName: user.name,
          lastName: '',
          role: user.role,
          mobile: user.mobile
        },

        accessToken

      });

    } catch (error) {

      console.error(
        '❌ Mobile login error:',
        error
      );

      return res.status(401).json({

        success: false,

        message:
          'Mobile authentication failed',

        details:
          error.message

      });

    }

  });



/* app.get('/api/auth/me', (req, res) => {
    console.log('/api/auth/me called');
    res.json({
        success: true,
        user: {
            id: 1,
            email: 'principal@school.com',
            name: 'Principal',
            role: 'principal'
        }
    });
}); */
app.get(
  '/api/auth/me',
  authenticateToken,
  async (req, res) => {

    try {

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user.userId
          }
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,

        user: {
          id: user.id,
          email: user.email,
          firstName: user.name,
          lastName: '',
          role: user.role,
          tenantId: '',
          tenant: {
            name: 'Sunrise Public School'
          }
        }
      });

    } catch (error) {

      console.error(
        '❌ /me error:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'Failed to get current user'
      });
    }
  }
);

// ============================================
// ====== HEALTH CHECK ======
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    testsCount: testStore.size,
    submissionsCount: submissionStore.size,
    resultsCount: resultStore.size
  });
});

// --------------------------------------------
// 1. CREATE TEST
// --------------------------------------------
app.post('/api/create-tests', async (req, res) => {
  console.log('📝 Create Test API called');
  console.log('📦 Request body:', req.body);

  try {
    const {
      testName,
      teacherName,
      subject,
      className,
      questions,
      duration,
      totalMarks
    } = req.body;

    // ============================================
    // VALIDATION
    // ============================================

    if (!testName || !teacherName || !subject || !className) {
      return res.status(400).json({
        success: false,
        error: 'Test name, Teacher name, subject and class are required'
      });
    }

    if (!questions) {
      return res.status(400).json({
        success: false,
        error: 'At least one question is required'
      });
    }

    // ============================================
    // CONVERT QUESTIONS TO ARRAY
    // ============================================

    let parsedQuestions;

    try {
      parsedQuestions =
        typeof questions === 'string'
          ? JSON.parse(questions)
          : questions;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid questions JSON format'
      });
    }

    if (
      !Array.isArray(parsedQuestions) ||
      parsedQuestions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: 'At least one question is required'
      });
    }

    // ============================================
    // VALIDATE EACH QUESTION
    // ============================================

    for (const question of parsedQuestions) {

      if (!question.question) {
        return res.status(400).json({
          success: false,
          error: 'Question text is required'
        });
      }

      if (
        !question.option1 ||
        !question.option2 ||
        !question.option3 ||
        !question.option4
      ) {
        return res.status(400).json({
          success: false,
          error: 'All four options are required'
        });
      }

      if (!question.correctAnswer) {
        return res.status(400).json({
          success: false,
          error: 'Correct answer is required'
        });
      }

      if (
        question.marks === undefined ||
        Number(question.marks) <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: 'Question marks must be greater than zero'
        });
      }
    }

    // ============================================
    // CALCULATE TOTAL MARKS
    // ============================================

    const calculatedTotalMarks =
      parsedQuestions.reduce(
        (sum, question) =>
          sum + Number(question.marks || 0),
        0
      );

    // ============================================
    // SAVE TO POSTGRESQL
    // ============================================

    const test = await prisma.test.create({
      data: {
        testName: testName.trim(),
        teacherName: teacherName.trim(),
        subject: subject.trim(),
        className: className.trim(),

        duration:
          Number(duration) > 0
            ? Number(duration)
            : 30,

        totalMarks:
          Number(totalMarks) > 0
            ? Number(totalMarks)
            : calculatedTotalMarks,

        questions: JSON.stringify(parsedQuestions)
      }
    });

    console.log(
      '✅ Test saved to PostgreSQL!'
    );

    console.log(
      '📋 Test ID:',
      test.id
    );

    res.status(201).json({
      success: true,
      testId: test.id,
      message: 'Test created successfully!',
      test: test
    });

  } catch (error) {

    console.error(
      '❌ Error creating test:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to save test',
      details: error.message
    });
  }
});

// --------------------------------------------
// 2. GET ALL TESTS
// --------------------------------------------
app.get('/api/create-tests', async (req, res) => {
  console.log('📚 Get all tests API called');

  try {

    const tests = await prisma.test.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedTests = tests.map((test) => {

      let parsedQuestions = [];

      try {

        if (test.questions) {
          parsedQuestions =
            typeof test.questions === 'string'
              ? JSON.parse(test.questions)
              : test.questions;
        }

      } catch (error) {

        console.error(
          '❌ Invalid questions JSON for test:',
          test.id
        );

        parsedQuestions = [];
      }

      return {
        ...test,
        questions: parsedQuestions
      };
    });

    console.log(
      '📊 Total tests:',
      formattedTests.length
    );

    res.status(200).json(formattedTests);

  } catch (error) {

    console.error(
      '❌ Error fetching tests:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tests',
      details: error.message
    });
  }
});

// --------------------------------------------
// TAKE TEST STORE
// --------------------------------------------
// --------------------------------------------
// 1. CREATE / TAKE TEST
// --------------------------------------------
app.post('/api/take-test/submit', async (req, res) => {
  console.log('📝 Submit Test API called');
  console.log('📦 Request body:', req.body);

  try {
    const {
      testId,
      student,
      answers,
      startedAt
    } = req.body;

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!testId || !student || !answers) {
      return res.status(400).json({
        success: false,
        error: 'testId, student and answers are required'
      });
    }

    // ----------------------------------------
    // GET TEST CREATED FROM CREATE TEST
    // ----------------------------------------

    const test = await prisma.test.findUnique({
      where: {
        id: testId
      }
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // ----------------------------------------
    // PARSE QUESTIONS
    // ----------------------------------------

    let questions = [];

    try {
      questions = test.questions
        ? JSON.parse(test.questions)
        : [];
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Invalid question data in database'
      });
    }

    // ----------------------------------------
    // CALCULATE RESULT
    // ----------------------------------------

    let score = 0;
    let totalMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    questions.forEach((question, index) => {

      const marks = Number(question.marks || 1);

      totalMarks += marks;

      const questionId =
        question.id || String(index);

      const studentAnswer =
        answers[questionId];

      const correctAnswer =
        question.correctAnswer;

      if (
        studentAnswer !== undefined &&
        studentAnswer !== null &&
        studentAnswer !== ''
      ) {

        if (
          String(studentAnswer) ===
          String(correctAnswer)
        ) {
          score += marks;
          correctAnswers++;
        } else {
          wrongAnswers++;
        }

      }

    });

    // ----------------------------------------
    // PERCENTAGE
    // ----------------------------------------

    const percentage =
      totalMarks > 0
        ? Number(((score / totalMarks) * 100).toFixed(2))
        : 0;

    // ----------------------------------------
    // DATES
    // ----------------------------------------

    const startedDate =
      startedAt
        ? new Date(startedAt)
        : new Date();

    const submittedDate = new Date();

    // ----------------------------------------
    // SAVE TAKE TEST
    // ----------------------------------------

    const takeTest = await prisma.takeTest.create({
      data: {
        test: String(testId),
        student: String(student),

        startedAt: startedDate,
        submittedAt: submittedDate,

        answers: JSON.stringify(answers),

        score,
        totalMarks,
        percentage
      }
    });

    // ----------------------------------------
    // SAVE TEST RESULT
    // ----------------------------------------

    const testResult =
      await prisma.testResult.create({
        data: {
          test: String(testId),
          student: String(student),

          score,
          totalMarks,
          percentage
        }
      });

    console.log('================================');
    console.log('✅ TEST SUBMITTED');
    console.log('Test:', test.testName);
    console.log('Student:', student);
    console.log('Score:', score);
    console.log('Total Marks:', totalMarks);
    console.log('Percentage:', percentage);
    console.log('Correct:', correctAnswers);
    console.log('Wrong:', wrongAnswers);
    console.log('================================');

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    res.status(201).json({
      success: true,

      message: 'Test submitted successfully',

      test: {
        id: test.id,
        testName: test.testName,
        subject: test.subject,
        className: test.className
      },

      result: {
        score,
        totalMarks,
        percentage,
        correctAnswers,
        wrongAnswers,
        attempted: correctAnswers + wrongAnswers,
        totalQuestions: questions.length
      },

      takeTest,
      testResult
    });

  } catch (error) {

    console.error(
      '❌ Error submitting test:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to submit test',
      details: error.message
    });
  }
});

// --------------------------------------------
// 2. GET ALL TAKE TESTS
// --------------------------------------------
app.get('/api/take-test', async (req, res) => {

  console.log('📚 Get all Take Test records API called');

  try {

    const takeTests =
      await prisma.takeTest.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

    res.json(takeTests);

  } catch (error) {

    console.error(
      '❌ Error fetching Take Test records:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch Take Test records',
      details: error.message
    });
  }
});


// ============================================
// TAKE TEST APIs
// ============================================

// GET ALL TESTS AVAILABLE FOR TAKING
app.get('/api/take-test/tests', async (req, res) => {
  console.log('📚 Get tests for Take Test called');

  try {
    const tests = await prisma.test.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedTests = tests.map((test) => {
      let questions = [];

      try {
        questions = test.questions
          ? JSON.parse(test.questions)
          : [];
      } catch (error) {
        console.error(
          'Question JSON parse error for test:',
          test.id
        );
      }

      return {
        ...test,
        questions
      };
    });

    res.json(formattedTests);

  } catch (error) {
    console.error('❌ Error fetching tests:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tests',
      details: error.message
    });
  }
});
// ============================================
// TEST RESULT APIs
// ============================================

// CREATE TEST RESULT
app.post('/api/test/results', async (req, res) => {
  console.log('📝 Create Test Result API called');
  console.log('📦 Request body:', req.body);

  try {
    const {
      test,
      student,
      score,
      totalMarks,
      percentage
    } = req.body;

    if (
      !test ||
      !student ||
      score === undefined ||
      totalMarks === undefined ||
      percentage === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: 'Test, student, score and totalMarks are required'
      });
    }
    const result = await prisma.testResult.create({
      data: {
        test: String(test),
        student: String(student),
        score: Number(score),
        totalMarks: Number(totalMarks),
        percentage: Number(percentage)
      }
    });
    console.log('✅ Test Result saved successfully!');
    console.log('📋 Result ID:', result.id);
    res.status(201).json({
      success: true,
      message: 'Test result created successfully!',
      testResult: result
    });
  } catch (error) {
    console.error('❌ Error creating Test Result:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to create test result',
      details: error.message
    });
  }
});  

// GET ALL TEST RESULTS
app.get('/api/test/results', async (req, res) => {
  console.log('📚 Get Test Results API called');

  try {

    const results = await prisma.testResult.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedResults = await Promise.all(
      results.map(async (result) => {

        let testName = result.testName || null;

        // If testName is not stored,
        // try to get it from Test table
        if (!testName && result.test) {

          const testRecord =
            await prisma.test.findUnique({
              where: {
                id: result.test
              }
            });

          if (testRecord) {
            testName = testRecord.testName;
          }
        }

        return {
          id: result.id,

          test: result.test,

          testName: testName,

          student: result.student,

          studentName: result.studentName,

          score: result.score,

          totalMarks: result.totalMarks,

          percentage: result.percentage,

          createdAt: result.createdAt
        };

      })
    );

    console.log(
      '📊 Total results:',
      formattedResults.length
    );

    res.status(200).json(formattedResults);

  } catch (error) {

    console.error(
      '❌ Error fetching Test Results:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch test results',
      details: error.message
    });

  }
});

// ======================================================
// CRM CUSTOMER APIs
// ======================================================

// GET ALL CUSTOMERS
app.get('/api/crm/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      customers
    });

  } catch (error) {
    console.error('❌ Get CRM customers error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      details: error.message
    });
  }
});


// CREATE CUSTOMER
app.post('/api/crm/customers', async (req, res) => {
  try {
    const {
      name,
      company,
      phone,
      email,
      location,
      status,
      gstin,
      address,
      state,
      pincode,
      contactPerson,
      notes,
      projects,
      businessValue
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!company?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),

        email: email?.trim() || null,
        location: location?.trim() || null,

        status: status || 'Active',

        projects: Number(projects) || 0,

        businessValue: Number(businessValue) || 0,

        gstin: gstin?.trim() || null,
        address: address?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        notes: notes?.trim() || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });

  } catch (error) {
    console.error('❌ Create CRM customer error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      details: error.message
    });
  }
});


// UPDATE CUSTOMER
app.put('/api/crm/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      company,
      phone,
      email,
      location,
      status,
      gstin,
      address,
      state,
      pincode,
      contactPerson,
      notes,
      projects,
      businessValue
    } = req.body;

    const customer = await prisma.customer.update({
      where: {
        id
      },

      data: {
        name: name?.trim(),
        company: company?.trim(),
        phone: phone?.trim(),

        email: email?.trim() || null,
        location: location?.trim() || null,

        status: status || 'Active',

        projects: Number(projects) || 0,

        businessValue: Number(businessValue) || 0,

        gstin: gstin?.trim() || null,
        address: address?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        notes: notes?.trim() || null
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });

  } catch (error) {
    console.error('❌ Update CRM customer error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      details: error.message
    });
  }
});


// DELETE CUSTOMER
app.delete('/api/crm/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: {
        id
      }
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete CRM customer error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      details: error.message
    });
  }
});

app.get('/api/projects', async (req, res) => {
  try {

    const projects =
      await prisma.project.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

    res.json({
      success: true,
      projects
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to load projects'
    });
  }
});

app.post('/api/projects', async (req, res) => {

  try {

    const {
      name,
      customer,
      site,
      projectLead,
      measuredArea,
      targetDate,
      progress,
      value,
      status,
      notes
    } = req.body;

    const project =
      await prisma.project.create({
        data: {
          name,
          customer,
          site,
          projectLead,
          measuredArea,
          targetDate,
          progress: Number(progress) || 0,
          value: Number(value) || 0,
          status,
          notes
        }
      });

    res.status(201).json({
      success: true,
      project
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.put('/api/projects/:id', async (req, res) => {

  try {

    const { id } = req.params;

    const project =
      await prisma.project.update({
        where: { id },
        data: req.body
      });

    res.json({
      success: true,
      project
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.delete('/api/projects/:id', async (req, res) => {

  try {

    await prisma.project.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({
      success: true
    });

  } catch (error) {

    res.status(500).json({
      success: false
    });
  }
});



// ============================================
// ====== START SERVER ======
// ============================================
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Server is running!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📚 Test Store: ${testStore.size} tests`);
  console.log(`📝 Submission Store: ${submissionStore.size} submissions`);
  console.log(`📊 Result Store: ${resultStore.size} results`);
  console.log('=================================');
  console.log('✅ All API routes are ready!');
  console.log('   POST   /api/tests/create');
  console.log('   GET    /api/tests');
  console.log('   GET    /api/tests/:testId');
  console.log('   POST   /api/tests/submit');
  console.log('   GET    /api/tests/:testId/results');
  console.log('   GET    /api/tests/:testId/result/:studentId');
  console.log('   GET    /api/tests/:testId/stats');
  console.log('   GET    /api/health');
  console.log('=================================');
});



