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

//const leadEnquiryRoutes = require("./leadEnquiryRoutes");

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
        console.log("Request body:", req.body);

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

// ======================================================
// WORK ORDERS APIs
// ======================================================

// ======================================================
// HELPER - GENERATE WORK ORDER NUMBER
// ======================================================

async function generateWorkOrderNumber() {
  const currentYear = new Date().getFullYear();
  const shortYear = String(currentYear).slice(-2);

  const lastWorkOrder = await prisma.workOrder.findFirst({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      workOrderNo: true
    }
  });

  let nextNumber = 1;

  if (lastWorkOrder?.workOrderNo) {
    const match =
      lastWorkOrder.workOrderNo.match(/WO-\d{2}-(\d+)/);

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `WO-${shortYear}-${String(nextNumber).padStart(3, '0')}`;
}


// ======================================================
// GET ALL WORK ORDERS
// ======================================================

app.get('/api/work-orders', async (req, res) => {
  console.log('📋 Get Work Orders API called');

  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      workOrders
    });

  } catch (error) {
    console.error(
      '❌ Get Work Orders error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch work orders',
      details: error.message
    });
  }
});


// ======================================================
// GET SINGLE WORK ORDER
// ======================================================

app.get('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder =
      await prisma.workOrder.findUnique({
        where: {
          id
        }
      });

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.json({
      success: true,
      workOrder
    });

  } catch (error) {
    console.error(
      '❌ Get Work Order error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch work order',
      details: error.message
    });
  }
});


// ======================================================
// CREATE WORK ORDER
// ======================================================
app.post('/api/work-orders', async (req, res) => {
  console.log('📝 Create Work Order API called');
  console.log('📦 Request body:', req.body);

  try {
    const {
      salesOrderId,
      customerId,
      customerName,
      projectName,
      productWork,
      quantity,
      unit,
      dueDate,
      assignedTeam,
      priority,
      status,
      notes,
    } = req.body;

    // -------- VALIDATION --------
    if (!customerName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required',
      });
    }

    if (!projectName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    if (!productWork?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product / Work is required',
      });
    }

    if (quantity === undefined || quantity === null || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero',
      });
    }

    // -------- WORK ORDER NO --------
    const workOrderNo = await generateWorkOrderNumber();

    // -------- CREATE --------
    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNo,
        salesOrderId: salesOrderId || null,
        customerId: customerId || null,
        customerName: customerName.trim(),
        projectName: projectName.trim(),
        productWork: productWork.trim(),
        quantity: Number(quantity),
        unit: unit || 'Nos',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTeam: assignedTeam?.trim() || null,
        priority: priority || 'Medium',
        status: status || 'Draft',
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      workOrder,
    });
  } catch (error) {
    console.error('❌ Create Work Order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create work order',
      details: error.message,
    });
  }
});


// ======================================================
// UPDATE WORK ORDER
// ======================================================

app.put('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      customer,
      project,
      product,
      quantity,
      startDate,
      dueDate,
      assignedTo,
      notes,
      status
    } = req.body;

    const existing =
      await prisma.workOrder.findUnique({
        where: {
          id
        }
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    const workOrder =
      await prisma.workOrder.update({
        where: {
          id
        },

        data: {
          customer:
            customer !== undefined
              ? customer.trim()
              : existing.customer,

          project:
            project !== undefined
              ? project.trim()
              : existing.project,

          product:
            product !== undefined
              ? product.trim()
              : existing.product,

          quantity:
            quantity !== undefined
              ? Number(quantity)
              : existing.quantity,

          startDate:
            startDate
              ? new Date(startDate)
              : null,

          dueDate:
            dueDate
              ? new Date(dueDate)
              : null,

          assignedTo:
            assignedTo?.trim() || null,

          notes:
            notes?.trim() || null,

          status:
            status || existing.status
        }
      });

    res.json({
      success: true,
      message: 'Work order updated successfully',
      workOrder
    });

  } catch (error) {
    console.error(
      '❌ Update Work Order error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to update work order',
      details: error.message
    });
  }
});


// ======================================================
// UPDATE WORK ORDER STATUS
// ======================================================

app.patch(
  '/api/work-orders/:id/status',
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        'Draft',
        'Approved',
        'InProduction',
        'Completed',
        'Cancelled'
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid work order status'
        });
      }

      const workOrder =
        await prisma.workOrder.update({
          where: {
            id
          },

          data: {
            status
          }
        });

      res.json({
        success: true,
        message: 'Work order status updated successfully',
        workOrder
      });

    } catch (error) {
      console.error(
        '❌ Update Work Order status error:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'Failed to update work order status',
        details: error.message
      });
    }
  }
);


// ======================================================
// DELETE WORK ORDER
// ======================================================

app.delete('/api/work-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing =
      await prisma.workOrder.findUnique({
        where: {
          id
        }
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    await prisma.workOrder.delete({
      where: {
        id
      }
    });

    res.json({
      success: true,
      message: 'Work order deleted successfully'
    });

  } catch (error) {
    console.error(
      '❌ Delete Work Order error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to delete work order',
      details: error.message
    });
  }
});


// ---------- Shared helpers ----------

function sendApiError(res, error, message = "Request failed") {
  console.error(message, error);

  if (error?.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  if (error?.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "This record already exists",
    });
  }

  return res.status(500).json({
    success: false,
    message,
  });
}

async function getCustomerAndLeadLinks(body) {
  const customerId = body.customerId || null;

  const leadEnquiryId =
    body.leadEnquiryId !== undefined &&
    body.leadEnquiryId !== null &&
    body.leadEnquiryId !== ""
      ? Number(body.leadEnquiryId)
      : null;

  let customer = null;
  let lead = null;

  if (customerId) {
    customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error("CUSTOMER_NOT_FOUND");
    }
  }

  if (leadEnquiryId !== null) {
    if (!Number.isInteger(leadEnquiryId)) {
      throw new Error("INVALID_LEAD_ID");
    }

    lead = await prisma.leadEnquiry.findUnique({
      where: { id: leadEnquiryId },
    });

    if (!lead) {
      throw new Error("LEAD_NOT_FOUND");
    }

    if (customer && lead.customerId && lead.customerId !== customer.id) {
      throw new Error("LEAD_CUSTOMER_MISMATCH");
    }

    if (!customer && lead.customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: lead.customerId },
      });
    }
  }

  return { customer, lead, customerId: customer?.id || null, leadEnquiryId };
}

// ---------- Lead / Enquiry ----------

app.get("/api/lead-enquiries", async (req, res) => {
  try {
    const leads = await prisma.leadEnquiry.findMany({
      include: {
        customer: true,
        siteMeasurements: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, leads });
  } catch (error) {
    return sendApiError(res, error, "Unable to fetch lead enquiries");
  }
});

app.post("/api/lead-enquiries", async (req, res) => {
  try {
    const {
      customerName,
      companyName = "",
      phone,
      email = "",
      source = "Direct",
      requirement,
      budget = "",
      followUpDate,
      priority = "Medium",
      status = "New",
      customerId: suppliedCustomerId,
    } = req.body;

    if (!customerName?.trim() || !phone?.trim() || !requirement?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone and requirement are required",
      });
    }

    const lead = await prisma.$transaction(async (tx) => {
      let customer = null;

      if (suppliedCustomerId) {
        customer = await tx.customer.findUnique({
          where: { id: suppliedCustomerId },
        });

        if (!customer) {
          throw new Error("CUSTOMER_NOT_FOUND");
        }
      } else {
        // Reuse a customer by phone when possible.
        customer = await tx.customer.findFirst({
          where: { phone: phone.trim() },
        });
      }

      // If there is no matching CRM customer, create one.
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerName.trim(),
            company: companyName.trim() || customerName.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
            status: "Lead",
          },
        });
      }

      return tx.leadEnquiry.create({
        data: {
          customerName: customerName.trim(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          source,
          requirement: requirement.trim(),
          budget,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          priority,
          status,
          customerId: customer.id,
        },
        include: {
          customer: true,
          siteMeasurements: true,
        },
      });
    });

    return res.status(201).json({ success: true, lead });
  } catch (error) {
    if (error.message === "CUSTOMER_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "Selected CRM customer was not found",
      });
    }

    return sendApiError(res, error, "Unable to create lead enquiry");
  }
});

app.put("/api/lead-enquiries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const existing = await prisma.leadEnquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lead enquiry not found",
      });
    }

    const body = req.body;
    const data = {};

    const stringFields = [
      "customerName",
      "companyName",
      "phone",
      "email",
      "source",
      "requirement",
      "budget",
      "priority",
      "status",
    ];

    for (const field of stringFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    if (body.followUpDate !== undefined) {
      data.followUpDate = body.followUpDate
        ? new Date(body.followUpDate)
        : null;
    }

    if (body.customerId !== undefined) {
      if (body.customerId === null || body.customerId === "") {
        data.customerId = null;
      } else {
        const customer = await prisma.customer.findUnique({
          where: { id: body.customerId },
        });

        if (!customer) {
          return res.status(400).json({
            success: false,
            message: "Selected CRM customer was not found",
          });
        }

        data.customerId = customer.id;
      }
    }

    const lead = await prisma.leadEnquiry.update({
      where: { id },
      data,
      include: {
        customer: true,
        siteMeasurements: true,
      },
    });

    return res.json({ success: true, lead });
  } catch (error) {
    return sendApiError(res, error, "Unable to update lead enquiry");
  }
});

app.delete("/api/lead-enquiries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.leadEnquiry.delete({ where: { id } });

    return res.json({ success: true, message: "Lead enquiry deleted" });
  } catch (error) {
    return sendApiError(res, error, "Unable to delete lead enquiry");
  }
});

// ---------- Site Visit / Measurement ----------

app.get("/api/site-measurements", async (req, res) => {
  try {
    const measurements = await prisma.siteMeasurement.findMany({
      include: {
        customer: true,
        leadEnquiry: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, measurements });
  } catch (error) {
    return sendApiError(res, error, "Unable to fetch site measurements");
  }
});

app.post("/api/site-measurements", async (req, res) => {
  try {
    const body = req.body;

    if (
      !body.customerName?.trim() ||
      !body.siteAddress?.trim() ||
      !body.visitDate ||
      !body.roomType?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, site address, visit date and room type are required",
      });
    }

    const links = await getCustomerAndLeadLinks(body);

    // Use the linked records as the source of truth when available.
    const customerName = links.customer?.name || body.customerName.trim();
    const leadId = links.lead ? String(links.lead.id) : body.leadId || null;

    const measurement = await prisma.siteMeasurement.create({
      data: {
        visitId: body.visitId || `SV-${Date.now()}`,
        customerName,
        leadId,
        projectName: body.projectName || null,
        siteAddress: body.siteAddress.trim(),
        visitDate: new Date(body.visitDate),
        assignedTo: body.assignedTo || null,
        roomType: body.roomType.trim(),
        furnitureType: body.furnitureType || null,
        lengthMm: body.lengthMm === "" || body.lengthMm == null
          ? null : Number(body.lengthMm),
        widthMm: body.widthMm === "" || body.widthMm == null
          ? null : Number(body.widthMm),
        heightMm: body.heightMm === "" || body.heightMm == null
          ? null : Number(body.heightMm),
        unit: body.unit || "mm",
        customerNotes: body.customerNotes || null,
        remarks: body.remarks || null,
        status: body.status || "Scheduled",
        customerId: links.customerId,
        leadEnquiryId: links.leadEnquiryId,
      },
      include: {
        customer: true,
        leadEnquiry: true,
      },
    });

    return res.status(201).json({ success: true, measurement });
  } catch (error) {
    if (
      ["CUSTOMER_NOT_FOUND", "LEAD_NOT_FOUND", "INVALID_LEAD_ID",
       "LEAD_CUSTOMER_MISMATCH"].includes(error.message)
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return sendApiError(res, error, "Unable to create site measurement");
  }
});

app.put("/api/site-measurements/:id", async (req, res) => {
  try {
    const existing = await prisma.siteMeasurement.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Site measurement not found",
      });
    }

    const body = req.body;
    const links = await getCustomerAndLeadLinks(body);
    const data = {};

    const stringFields = [
      "visitId",
      "customerName",
      "leadId",
      "projectName",
      "siteAddress",
      "assignedTo",
      "roomType",
      "furnitureType",
      "unit",
      "customerNotes",
      "remarks",
      "status",
    ];

    for (const field of stringFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    if (body.visitDate !== undefined) {
      data.visitDate = new Date(body.visitDate);
    }

    for (const field of ["lengthMm", "widthMm", "heightMm"]) {
      if (body[field] !== undefined) {
        data[field] =
          body[field] === "" || body[field] === null
            ? null
            : Number(body[field]);
      }
    }

    if (body.customerId !== undefined || body.leadEnquiryId !== undefined) {
      data.customerId = links.customerId;
      data.leadEnquiryId = links.leadEnquiryId;

      if (links.customer) data.customerName = links.customer.name;
      if (links.lead) data.leadId = String(links.lead.id);
    }

    const measurement = await prisma.siteMeasurement.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: true,
        leadEnquiry: true,
      },
    });

    return res.json({ success: true, measurement });
  } catch (error) {
    if (
      ["CUSTOMER_NOT_FOUND", "LEAD_NOT_FOUND", "INVALID_LEAD_ID",
       "LEAD_CUSTOMER_MISMATCH"].includes(error.message)
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return sendApiError(res, error, "Unable to update site measurement");
  }
});

app.delete("/api/site-measurements/:id", async (req, res) => {
  try {
    await prisma.siteMeasurement.delete({
      where: { id: req.params.id },
    });

    return res.json({
      success: true,
      message: "Site measurement deleted",
    });
  } catch (error) {
    return sendApiError(res, error, "Unable to delete site measurement");
  }
});


// ======================================================
// ESTIMATION & BOQ APIs
// Existing PostgreSQL + Prisma setup
// Add these routes before app.listen(...)
// ======================================================

function estimationNumber() {
  return `EST-${Date.now()}`;
}

function validNumber(value, fieldName, minimum = 0) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < minimum) {
    throw new Error(`${fieldName} must be a valid number >= ${minimum}.`);
  }

  return number;
}

// GET: List estimations
app.get("/api/estimations", async (req, res) => {
  try {
    const estimations = await prisma.estimation.findMany({
      include: {
        customer: true,
        leadEnquiry: true,
        siteMeasurement: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      estimations,
    });
  } catch (error) {
    console.error("GET /api/estimations:", error);
    sendApiError(res, error, "Unable to load estimations.");
  }
});

// GET: One estimation
app.get("/api/estimations/:id", async (req, res) => {
  try {
    const estimation = await prisma.estimation.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        leadEnquiry: true,
        siteMeasurement: true,
      },
    });

    if (!estimation) {
      return res.status(404).json({
        success: false,
        message: "Estimation not found.",
      });
    }

    res.json({ success: true, estimation });
  } catch (error) {
    console.error("GET /api/estimations/:id:", error);
    sendApiError(res, error, "Unable to load estimation.");
  }
});

// Shared validation and payload builder
async function buildEstimationData(body) {
  const customerId = String(body.customerId || "").trim();
  const leadEnquiryId = Number(body.leadEnquiryId);
  const siteMeasurementId = String(body.siteMeasurementId || "").trim();

  if (!customerId || !siteMeasurementId || !Number.isInteger(leadEnquiryId)) {
    throw new Error(
      "CRM Customer, Lead Enquiry and Site Visit / Measurement are required."
    );
  }

  const [customer, lead, measurement] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.leadEnquiry.findUnique({ where: { id: leadEnquiryId } }),
    prisma.siteMeasurement.findUnique({
      where: { id: siteMeasurementId },
    }),
  ]);

  if (!customer) throw new Error("Selected CRM customer was not found.");
  if (!lead) throw new Error("Selected Lead Enquiry was not found.");
  if (!measurement) {
    throw new Error("Selected Site Visit / Measurement was not found.");
  }

  // Prevent mismatched Customer, Lead and Site Visit links.
  if (lead.customerId && lead.customerId !== customerId) {
    throw new Error("Selected Lead Enquiry belongs to another customer.");
  }

  if (measurement.customerId && measurement.customerId !== customerId) {
    throw new Error("Selected Site Visit belongs to another customer.");
  }

  if (
    measurement.leadEnquiryId != null &&
    Number(measurement.leadEnquiryId) !== leadEnquiryId
  ) {
    throw new Error("Selected Site Visit belongs to another Lead Enquiry.");
  }

  const lengthMm = validNumber(body.lengthMm, "Length", 0.000001);
  const widthMm = validNumber(body.widthMm, "Width", 0.000001);
  const quantity = validNumber(body.quantity, "Quantity", 1);

  if (!Number.isInteger(quantity)) {
    throw new Error("Quantity must be a whole number.");
  }

  const wastagePercent = validNumber(
    body.wastagePercent ?? 0,
    "Wastage percentage"
  );
  const ratePerSqft = validNumber(body.ratePerSqft ?? 0, "Rate per sq.ft");
  const costPerUnit = validNumber(body.costPerUnit ?? 0, "Cost per unit");
  const pricingPercent = validNumber(
    body.pricingPercent ?? 0,
    "Pricing percentage"
  );

  if (wastagePercent > 100 || pricingPercent >= 100) {
    throw new Error(
      "Wastage must not exceed 100%, and pricing percentage must be below 100%."
    );
  }

  const pricingMethod = body.pricingMethod || "markup";

  if (!["markup", "margin"].includes(pricingMethod)) {
    throw new Error("Pricing method must be markup or margin.");
  }

  const unitAreaSqft = (lengthMm * widthMm) / 92903.04;
  const baseAreaSqft = unitAreaSqft * quantity;
  const procurementAreaSqft =
    baseAreaSqft * (1 + wastagePercent / 100);

  const sellingPricePerUnit =
    pricingMethod === "margin"
      ? costPerUnit / (1 - pricingPercent / 100)
      : costPerUnit * (1 + pricingPercent / 100);

  const baseAmount = procurementAreaSqft * ratePerSqft;
  const totalSellingPrice = sellingPricePerUnit * quantity;

  return {
    customerId,
    leadEnquiryId,
    siteMeasurementId,

    projectName: String(body.projectName || "").trim() || null,
    notes: String(body.notes || "").trim() || null,

    lengthMm,
    widthMm,
    unit: String(body.unit || "mm"),
    quantity,
    wastagePercent,
    ratePerSqft,

    costPerUnit,
    pricingMethod,
    pricingPercent,

    edges: body.edges ?? {},
    bomItems: Array.isArray(body.bomItems) ? body.bomItems : [],
    derivedQuantities: {
      unitAreaSqft,
      baseAreaSqft,
      procurementAreaSqft,
      ...(
        body.derivedQuantities &&
        typeof body.derivedQuantities === "object" &&
        !Array.isArray(body.derivedQuantities)
          ? body.derivedQuantities
          : {}
      ),
    },

    baseAmount,
    sellingPricePerUnit,
    totalSellingPrice,

    status: String(body.status || "Draft"),
  };
}

// POST: Create estimation and save BOQ details
app.post("/api/estimations", async (req, res) => {
  try {
    const data = await buildEstimationData(req.body || {});

    const estimation = await prisma.estimation.create({
      data: {
        estimationNumber: estimationNumber(),
        ...data,
      },
      include: {
        customer: true,
        leadEnquiry: true,
        siteMeasurement: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Estimation and BOQ saved successfully.",
      estimation,
    });
  } catch (error) {
    console.error("POST /api/estimations:", error);

    if (
      error instanceof Error &&
      !("code" in error)
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    sendApiError(res, error, "Unable to save estimation.");
  }
});

// PUT: Update an existing estimation
app.put("/api/estimations/:id", async (req, res) => {
  try {
    const existing = await prisma.estimation.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Estimation not found.",
      });
    }

    const data = await buildEstimationData(req.body || {});

    const estimation = await prisma.estimation.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: true,
        leadEnquiry: true,
        siteMeasurement: true,
      },
    });

    res.json({
      success: true,
      message: "Estimation updated successfully.",
      estimation,
    });
  } catch (error) {
    console.error("PUT /api/estimations/:id:", error);

    if (error instanceof Error && !("code" in error)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    sendApiError(res, error, "Unable to update estimation.");
  }
});

// DELETE: Delete an estimation and its stored BOQ
app.delete("/api/estimations/:id", async (req, res) => {
  try {
    const existing = await prisma.estimation.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Estimation not found.",
      });
    }

    await prisma.estimation.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Estimation deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/estimations/:id:", error);
    sendApiError(res, error, "Unable to delete estimation.");
  }
});

// ============================================================
// QUOTATION MANAGEMENT APIs
// Add before app.listen(...)
// Requires existing: const prisma = new PrismaClient();
// ============================================================

function quotationNumberOrError(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function quotationDateOrNull(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date.");
  }

  return date;
}

function normalizeQuotationItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one quotation item.");
  }

  return items.map((item) => {
    const itemName = String(item.itemName || "").trim();
    const quantity = Number(item.quantity);
    const rate = Number(item.rate);
    const unit = String(item.unit || "NOS").trim();

    if (!itemName) {
      throw new Error("Every quotation item needs a name.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Item quantity must be greater than zero.");
    }

    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error("Item rate cannot be negative.");
    }

    return {
      itemName,
      description: item.description
        ? String(item.description).trim()
        : null,
      quantity,
      unit,
      rate,
      amount: Number((quantity * rate).toFixed(2)),
    };
  });
}

function buildQuotationTotals(items, gstRate) {
  const subtotal = Number(
    items
      .reduce((sum, item) => sum + item.quantity * item.rate, 0)
      .toFixed(2),
  );

  const gstAmount = Number(
    (subtotal * (gstRate / 100)).toFixed(2),
  );

  return {
    subtotal,
    gstAmount,
    grandTotal: Number((subtotal + gstAmount).toFixed(2)),
  };
}

function quotationPayload(body) {
  const quotationNo = quotationNumberOrError(body.quotationNo);

  if (!quotationNo) {
    throw new Error("Quotation number is required.");
  }

  const customerId = String(body.customerId || "").trim();
  const customerName = String(body.customerName || "").trim();
  const projectName = String(body.projectName || "").trim();
  const quotationDate = quotationDateOrNull(body.quotationDate);

  if (!customerId) throw new Error("Select a CRM customer.");
  if (!customerName) throw new Error("Customer name is required.");
  if (!projectName) throw new Error("Project name is required.");
  if (!quotationDate) throw new Error("Quotation date is required.");

  const validUntil = quotationDateOrNull(body.validUntil);

  if (validUntil && validUntil < quotationDate) {
    throw new Error("Validity date cannot be before quotation date.");
  }

  const gstRate = Number(body.gstRate ?? 18);

  if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
    throw new Error("GST percentage must be between 0 and 100.");
  }

  const allowedStatuses = [
    "Draft",
    "Sent",
    "Accepted",
    "Rejected",
    "Expired",
  ];

  const status = String(body.status || "Draft");

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid quotation status.");
  }

  const items = normalizeQuotationItems(body.items);
  const totals = buildQuotationTotals(items, gstRate);

  return {
    quotationNo,
    customerId,
    customerName,
    projectName,
    estimateId: body.estimateId
      ? String(body.estimateId)
      : null,
    quotationDate,
    validUntil,
    status,
    gstRate,
    notes: body.notes ? String(body.notes).trim() : null,
    ...totals,
    items,
  };
}

async function validateQuotationLinks(data) {
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
    select: { id: true, name: true },
  });

  if (!customer) {
    const error = new Error("Selected CRM customer was not found.");
    error.statusCode = 400;
    throw error;
  }

  if (data.estimateId) {
    const estimate = await prisma.estimation.findUnique({
      where: { id: data.estimateId },
      select: { id: true, customerId: true },
    });

    if (!estimate) {
      const error = new Error("Selected estimation was not found.");
      error.statusCode = 400;
      throw error;
    }

    if (estimate.customerId !== data.customerId) {
      const error = new Error(
        "Selected estimation belongs to a different customer.",
      );
      error.statusCode = 400;
      throw error;
    }
  }
}

// GET: list quotations with items
app.get("/api/quotations", async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, quotations });
  } catch (error) {
    console.error("GET /api/quotations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load quotations.",
    });
  }
});

// GET: one quotation
app.get("/api/quotations/:id", async (req, res) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found.",
      });
    }

    res.json({ success: true, quotation });
  } catch (error) {
    console.error("GET /api/quotations/:id:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load quotation.",
    });
  }
});

// POST: create quotation and items in one transaction
app.post("/api/quotations", async (req, res) => {
  try {
    const data = quotationPayload(req.body);

    await validateQuotationLinks(data);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNo: data.quotationNo,
        customerId: data.customerId,
        customerName: data.customerName,
        projectName: data.projectName,
        estimateId: data.estimateId,
        quotationDate: data.quotationDate,
        validUntil: data.validUntil,
        status: data.status,
        gstRate: data.gstRate,
        notes: data.notes,
        subtotal: data.subtotal,
        gstAmount: data.gstAmount,
        grandTotal: data.grandTotal,
        items: {
          create: data.items.map((item) => ({
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({
      success: true,
      message: "Quotation created successfully.",
      quotation,
    });
  } catch (error) {
    console.error("POST /api/quotations:", error);

    const statusCode =
      error.statusCode ||
      (error.code === "P2002" ? 409 : 400);

    res.status(statusCode).json({
      success: false,
      message:
        error.code === "P2002"
          ? "This quotation number already exists."
          : error.message || "Failed to create quotation.",
    });
  }
});

// PUT: update quotation and replace its item rows
app.put("/api/quotations/:id", async (req, res) => {
  try {
    const data = quotationPayload(req.body);

    await validateQuotationLinks(data);

    const existing = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found.",
      });
    }

    const quotation = await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({
        where: { quotationId: req.params.id },
      });

      return tx.quotation.update({
        where: { id: req.params.id },
        data: {
          quotationNo: data.quotationNo,
          customerId: data.customerId,
          customerName: data.customerName,
          projectName: data.projectName,
          estimateId: data.estimateId,
          quotationDate: data.quotationDate,
          validUntil: data.validUntil,
          status: data.status,
          gstRate: data.gstRate,
          notes: data.notes,
          subtotal: data.subtotal,
          gstAmount: data.gstAmount,
          grandTotal: data.grandTotal,
          items: {
            create: data.items.map((item) => ({
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              rate: item.rate,
              amount: item.amount,
            })),
          },
        },
        include: { items: true },
      });
    });

    res.json({
      success: true,
      message: "Quotation updated successfully.",
      quotation,
    });
  } catch (error) {
    console.error("PUT /api/quotations/:id:", error);

    res.status(
      error.statusCode || (error.code === "P2002" ? 409 : 400),
    ).json({
      success: false,
      message:
        error.code === "P2002"
          ? "This quotation number already exists."
          : error.message || "Failed to update quotation.",
    });
  }
});

// DELETE: quotation and its items
app.delete("/api/quotations/:id", async (req, res) => {
  try {
    const existing = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found.",
      });
    }

    await prisma.quotation.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Quotation deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/quotations/:id:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete quotation.",
    });
  }
});

/* ================= SALES ORDERS API ================= */

function salesOrderError(res, error, message) {
  console.error(message, error);
  return res.status(500).json({
    success: false,
    message,
  });
}

// GET: list sales orders
app.get("/api/sales-orders", async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      salesOrders: orders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
      })),
    });
  } catch (error) {
    return salesOrderError(
      res,
      error,
      "Unable to load sales orders.",
    );
  }
});

// GET: one sales order
app.get("/api/sales-orders/:id", async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found.",
      });
    }

    return res.json({
      success: true,
      salesOrder: {
        ...order,
        totalAmount: Number(order.totalAmount),
      },
    });
  } catch (error) {
    return salesOrderError(
      res,
      error,
      "Unable to load sales order.",
    );
  }
});

// POST: create sales order
app.post("/api/sales-orders", async (req, res) => {
  try {
    const {
      orderNo,
      customerId,
      customerName,
      projectName,
      quotationId,
      orderDate,
      deliveryDate,
      status,
      progress,
      totalAmount,
      items,
      notes,
    } = req.body;

    if (
      !customerName ||
      !String(customerName).trim() ||
      !projectName ||
      !String(projectName).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name and project name are required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one sales order item is required.",
      });
    }

    const normalizedItems = items.map((item) => ({
      itemName: String(item.itemName || "").trim(),
      description: String(item.description || ""),
      quantity: Number(item.quantity),
      unit: String(item.unit || "NOS"),
      rate: Number(item.rate),
      amount: Number(item.quantity) * Number(item.rate),
    }));

    const invalidItem = normalizedItems.some(
      (item) =>
        !item.itemName ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.rate) ||
        item.rate < 0,
    );

    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: "Check item names, quantities and rates.",
      });
    }

    // Calculate amount on the server instead of trusting the browser.
    const calculatedTotal = normalizedItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const generatedOrderNo =
      String(orderNo || "").trim() ||
      `SO-${new Date().getFullYear()}-${Date.now()}`;

    const order = await prisma.salesOrder.create({
      data: {
        orderNo: generatedOrderNo,
        customerId: customerId ? String(customerId) : null,
        customerName: String(customerName).trim(),
        projectName: String(projectName).trim(),
        quotationId: quotationId ? String(quotationId) : null,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        deliveryDate: deliveryDate
          ? new Date(deliveryDate)
          : null,
        status: String(status || "Approved"),
        progress: Math.min(
          100,
          Math.max(0, Number(progress ?? 10)),
        ),
        totalAmount: calculatedTotal,
        items: normalizedItems,
        notes: notes ? String(notes) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Sales order created successfully.",
      salesOrder: {
        ...order,
        totalAmount: Number(order.totalAmount),
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Sales order number already exists. Try again.",
      });
    }

    return salesOrderError(
      res,
      error,
      "Unable to create sales order.",
    );
  }
});

// PUT: update sales order
app.put("/api/sales-orders/:id", async (req, res) => {
  try {
    const existing = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found.",
      });
    }

    const body = req.body;
    const data = {};

    if (body.customerId !== undefined) {
      data.customerId = body.customerId
        ? String(body.customerId)
        : null;
    }

    if (body.customerName !== undefined) {
      if (!String(body.customerName).trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer name cannot be empty.",
        });
      }
      data.customerName = String(body.customerName).trim();
    }

    if (body.projectName !== undefined) {
      if (!String(body.projectName).trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name cannot be empty.",
        });
      }
      data.projectName = String(body.projectName).trim();
    }

    if (body.quotationId !== undefined) {
      data.quotationId = body.quotationId
        ? String(body.quotationId)
        : null;
    }

    if (body.orderDate !== undefined) {
      data.orderDate = new Date(body.orderDate);
    }

    if (body.deliveryDate !== undefined) {
      data.deliveryDate = body.deliveryDate
        ? new Date(body.deliveryDate)
        : null;
    }

    if (body.status !== undefined) {
      data.status = String(body.status);
    }

    if (body.progress !== undefined) {
      const progress = Number(body.progress);
      if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          message: "Progress must be between 0 and 100.",
        });
      }
      data.progress = progress;
    }

    if (body.items !== undefined) {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one item is required.",
        });
      }

      const normalizedItems = body.items.map((item) => ({
        itemName: String(item.itemName || "").trim(),
        description: String(item.description || ""),
        quantity: Number(item.quantity),
        unit: String(item.unit || "NOS"),
        rate: Number(item.rate),
        amount: Number(item.quantity) * Number(item.rate),
      }));

      if (
        normalizedItems.some(
          (item) =>
            !item.itemName ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0 ||
            !Number.isFinite(item.rate) ||
            item.rate < 0,
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Check item names, quantities and rates.",
        });
      }

      data.items = normalizedItems;
      data.totalAmount = normalizedItems.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
    }

    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes) : null;
    }

    const updated = await prisma.salesOrder.update({
      where: { id: req.params.id },
      data,
    });

    return res.json({
      success: true,
      message: "Sales order updated successfully.",
      salesOrder: {
        ...updated,
        totalAmount: Number(updated.totalAmount),
      },
    });
  } catch (error) {
    return salesOrderError(
      res,
      error,
      "Unable to update sales order.",
    );
  }
});

// DELETE: delete sales order
app.delete("/api/sales-orders/:id", async (req, res) => {
  try {
    const existing = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found.",
      });
    }

    await prisma.salesOrder.delete({
      where: { id: req.params.id },
    });

    return res.json({
      success: true,
      message: "Sales order deleted successfully.",
    });
  } catch (error) {
    return salesOrderError(
      res,
      error,
      "Unable to delete sales order.",
    );
  }
});
// ==========================================

// ADD material requirement to an existing BOM
app.post("/api/material-requirements", async (req, res) => {
  try {
    const {
      bomId,
      materialCode,
      materialName,
      requiredQty,
      availableQty,
      unit,
      unitCost,
    } = req.body;

    if (!bomId || !materialName) {
      return res.status(400).json({
        error: "BOM ID and material name are required",
      });
    }

    if (
      requiredQty === undefined ||
      !Number.isFinite(Number(requiredQty)) ||
      Number(requiredQty) < 0
    ) {
      return res.status(400).json({
        error: "Required quantity must be a non-negative number",
      });
    }

    const bom = await prisma.bom.findUnique({
      where: { id: bomId },
    });

    if (!bom) {
      return res.status(404).json({ error: "BOM not found" });
    }

    const record = await prisma.bomMaterial.create({
      data: {
        bomId,
        materialCode: materialCode || "",
        materialName,
        requiredQty: Number(requiredQty),
        availableQty: Number(availableQty || 0),
        unit: unit || "Pieces",
        unitCost: Number(unitCost || 0),
      },
      include: { bom: true },
    });

    res.status(201).json({
      ...record,
      shortageQty: Math.max(
        0,
        record.requiredQty - record.availableQty
      ),
      estimatedCost: record.requiredQty * record.unitCost,
    });
  } catch (error) {
    console.error("Create material requirement error:", error);
    res.status(500).json({
      error: "Failed to create material requirement",
    });
  }
});

// UPDATE material requirement
app.put("/api/material-requirements/:id", async (req, res) => {
  try {
    const {
      materialCode,
      materialName,
      requiredQty,
      availableQty,
      unit,
      unitCost,
    } = req.body;

    const data = {};

    if (materialCode !== undefined) data.materialCode = materialCode;
    if (materialName !== undefined) data.materialName = materialName;
    if (unit !== undefined) data.unit = unit;

    for (const key of ["requiredQty", "availableQty", "unitCost"]) {
      if (req.body[key] !== undefined) {
        const value = Number(req.body[key]);

        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            error: `${key} must be a non-negative number`,
          });
        }

        data[key] = value;
      }
    }

    const record = await prisma.bomMaterial.update({
      where: { id: req.params.id },
      data,
      include: { bom: true },
    });

    res.json({
      ...record,
      shortageQty: Math.max(
        0,
        record.requiredQty - record.availableQty
      ),
      estimatedCost: record.requiredQty * record.unitCost,
    });
  } catch (error) {
    console.error("Update material requirement error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Material requirement not found",
      });
    }

    res.status(500).json({
      error: "Failed to update material requirement",
    });
  }
});

// DELETE material requirement
app.delete("/api/material-requirements/:id", async (req, res) => {
  try {
    await prisma.bomMaterial.delete({
      where: { id: req.params.id },
    });
    return res.json({
      success: true,
      message: "Material requirement deleted successfully",
    });
  } catch (error) {
    console.error("Delete material requirement error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Material requirement not found",
      });
    }
    return res.status(500).json({error: "Failed to delete material requirement",});
  }
});
    // PAYAL DECOR - BOM APIs
// ==========================================

// GET all BOMs with materials
app.get("/api/bom", async (req, res) => {
  try {
    const records = await prisma.bom.findMany({
      include: { materials: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(records);
  } catch (error) {
    console.error("Fetch BOM error:", error);
    res.status(500).json({ error: "Failed to fetch BOM records" });
  }
});

// GET one BOM by ID
app.get("/api/bom/:id", async (req, res) => {
  try {
    const record = await prisma.bom.findUnique({
      where: { id: req.params.id },
      include: { materials: true },
    });

    if (!record) {
      return res.status(404).json({ error: "BOM not found" });
    }

    res.json(record);
  } catch (error) {
    console.error("Fetch BOM error:", error);
    res.status(500).json({ error: "Failed to fetch BOM" });
  }
});

// CREATE BOM with materials
app.post("/api/bom", async (req, res) => {
  try {
    const {
      bomNo,
      bomName,
      project,
      workOrderNo,
      status,
      notes,
      materials,
    } = req.body;

    if (!bomNo || !bomName || !workOrderNo) {
      return res.status(400).json({
        error: "BOM number, BOM name and Work Order number are required",
      });
    }

    if (materials !== undefined && !Array.isArray(materials)) {
      return res.status(400).json({
        error: "Materials must be an array",
      });
    }

    const record = await prisma.bom.create({
      data: {
        bomNo,
        bomName,
        project: project || null,
        workOrderNo,
        status: status || "Draft",
        notes: notes || null,
        materials: {
          create: (materials || []).map((item) => ({
            materialCode: item.materialCode || "",
            materialName: item.materialName,
            requiredQty: Number(item.requiredQty),
            availableQty: Number(item.availableQty || 0),
            unit: item.unit || "Pieces",
            unitCost: Number(item.unitCost || 0),
          })),
        },
      },
      include: { materials: true },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("Create BOM error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "This BOM number already exists",
      });
    }

    res.status(500).json({ error: "Failed to create BOM" });
  }
});

// UPDATE BOM and replace its materials
app.put("/api/bom/:id", async (req, res) => {
  try {
    const {
      bomNo,
      bomName,
      project,
      workOrderNo,
      status,
      notes,
      materials,
    } = req.body;

    if (materials !== undefined && !Array.isArray(materials)) {
      return res.status(400).json({
        error: "Materials must be an array",
      });
    }

    const existing = await prisma.bom.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "BOM not found" });
    }

    const record = await prisma.$transaction(async (tx) => {
      if (materials !== undefined) {
        await tx.bomMaterial.deleteMany({
          where: { bomId: req.params.id },
        });
      }

      return tx.bom.update({
        where: { id: req.params.id },
        data: {
          ...(bomNo !== undefined && { bomNo }),
          ...(bomName !== undefined && { bomName }),
          ...(project !== undefined && { project }),
          ...(workOrderNo !== undefined && { workOrderNo }),
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes }),
          ...(materials !== undefined && {
            materials: {
              create: materials.map((item) => ({
                materialCode: item.materialCode || "",
                materialName: item.materialName,
                requiredQty: Number(item.requiredQty),
                availableQty: Number(item.availableQty || 0),
                unit: item.unit || "Pieces",
                unitCost: Number(item.unitCost || 0),
              })),
            },
          }),
        },
        include: { materials: true },
      });
    });

    res.json(record);
  } catch (error) {
    console.error("Update BOM error:", error);
    res.status(500).json({ error: "Failed to update BOM" });
  }
});

// DELETE BOM (its materials are cascade-deleted)
app.delete("/api/bom/:id", async (req, res) => {
  try {
    const existing = await prisma.bom.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "BOM not found" });
    }

    await prisma.bom.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "BOM deleted successfully" });
  } catch (error) {
    console.error("Delete BOM error:", error);
    res.status(500).json({ error: "Failed to delete BOM" });
  }
});

// ==========================================
// MATERIAL REQUIREMENT APIs
// Uses the existing BomMaterial model
// ==========================================

// GET all material requirements
app.get("/api/material-requirements", async (req, res) => {
  try {
    const records = await prisma.bomMaterial.findMany({
      include: { bom: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      records.map((item) => ({
        ...item,
        shortageQty: Math.max(
          0,
          item.requiredQty - item.availableQty
        ),
        estimatedCost: item.requiredQty * item.unitCost,
      }))
    );
  } catch (error) {
    console.error("Fetch material requirements error:", error);

    return res.status(500).json({
      error: "Failed to fetch material requirements",
    });
  }
});
/* ==========================================
   PAYAL DECOR - PRODUCTION MODULE APIs
   Add before app.listen(...)
========================================== */

const PRODUCTION_STAGES = [
  "Pending",
  "Cutting",
  "Edge Banding",
  "CNC",
  "Assembly",
  "Finishing",
  "QC",
  "Ready",
];

// ==========================================
// GET PRODUCTION DASHBOARD
// ==========================================
app.get("/api/production/dashboard", async (req, res) => {
  try {
    const jobs = await prisma.productionJob.findMany({
      select: { currentStage: true },
    });

    const counts = Object.fromEntries(
      PRODUCTION_STAGES.map((stage) => [stage, 0])
    );

    for (const job of jobs) {
      if (Object.hasOwn(counts, job.currentStage)) {
        counts[job.currentStage]++;
      }
    }

    res.json({
      total: jobs.length,
      counts,
    });
  } catch (error) {
    console.error("Production dashboard error:", error);
    res.status(500).json({
      message: "Failed to load production dashboard",
    });
  }
});

// ==========================================
// GET ALL PRODUCTION JOBS WITH BOM MATERIALS
// ==========================================
app.get("/api/production", async (req, res) => {
  try {
    const jobs = await prisma.productionJob.findMany({
      include: {
        bom: {
          include: {
            materials: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(jobs);
  } catch (error) {
    console.error("Get production jobs error:", error);
    res.status(500).json({
      message: "Failed to load production jobs",
    });
  }
});

// ==========================================
// GET BOM LIST FOR PRODUCTION DROPDOWN
// ==========================================
app.get("/api/production/boms", async (req, res) => {
  try {
    const boms = await prisma.bom.findMany({
      include: {
        materials: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(boms);
  } catch (error) {
    console.error("Get production BOMs error:", error);
    res.status(500).json({
      message: "Failed to load BOM list",
    });
  }
});

// ==========================================
// GET ONE BOM WITH MATERIALS
// ==========================================
app.get("/api/production/boms/:id", async (req, res) => {
  try {
    const bom = await prisma.bom.findUnique({
      where: { id: req.params.id },
      include: {
        materials: true,
      },
    });

    if (!bom) {
      return res.status(404).json({
        message: "BOM not found",
      });
    }

    res.json(bom);
  } catch (error) {
    console.error("Get production BOM error:", error);
    res.status(500).json({
      message: "Failed to load BOM details",
    });
  }
});
/* ==========================================
   CREATE PRODUCTION JOB
========================================== */
app.post("/api/production", async (req, res) => {
  try {
    const {
      workOrderNo,
      productName,
      quantity,
      currentStage,
      department,
      deadline,
      notes,
      bomId,
    } = req.body;

    if (
      typeof workOrderNo !== "string" ||
      !workOrderNo.trim() ||
      typeof productName !== "string" ||
      !productName.trim()
    ) {
      return res.status(400).json({
        message: "Work Order Number and Product Name are required",
      });
    }

    const qty = quantity === undefined ? 1 : Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number",
      });
    }

    if (
      currentStage !== undefined &&
      !PRODUCTION_STAGES.includes(currentStage)
    ) {
      return res.status(400).json({
        message: "Invalid production stage",
      });
    }

    let selectedBom = null;

    if (bomId) {
      selectedBom = await prisma.bom.findUnique({
        where: { id: bomId },
        include: { materials: true },
      });

      if (!selectedBom) {
        return res.status(404).json({
          message: "Selected BOM was not found",
        });
      }
    }

    const job = await prisma.productionJob.create({
      data: {
        workOrderNo: workOrderNo.trim(),
        productName: productName.trim(),
        quantity: qty,
        currentStage: currentStage || "Pending",
        department:
          typeof department === "string" && department.trim()
            ? department.trim()
            : "Production",
        deadline: deadline ? new Date(deadline) : null,
        notes: typeof notes === "string" ? notes : null,
        bomId: selectedBom ? selectedBom.id : null,
      },
      include: {
        bom: {
          include: {
            materials: true,
          },
        },
      },
    });

    res.status(201).json(job);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This Work Order Number already exists in Production",
      });
    }

    console.error("Create production job error:", error);
    res.status(500).json({
      message: "Failed to create production job",
    });
  }
});
/* ==========================================
   UPDATE PRODUCTION STAGE
========================================== */
app.patch("/api/production/:id/stage", async (req, res) => {
  try {
    const { currentStage, department } = req.body;

    if (!PRODUCTION_STAGES.includes(currentStage)) {
      return res.status(400).json({
        message: "Invalid production stage",
      });
    }

    const data = {
      currentStage,
    };

    if (typeof department === "string" && department.trim()) {
      data.department = department.trim();
    }

    const job = await prisma.productionJob.update({
      where: { id: req.params.id },
      data,
      include: {
        bom: {
          include: {
            materials: true,
          },
        },
      },
    });

    res.json(job);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Production job not found",
      });
    }

    console.error("Update production stage error:", error);
    res.status(500).json({
      message: "Failed to update production stage",
    });
  }
});

// ==========================================
// DELETE PRODUCTION JOB
// ==========================================
app.delete("/api/production/:id", async (req, res) => {
  try {
    const job = await prisma.productionJob.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Production job deleted successfully",
      id: job.id,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Production job not found",
      });
    }

    console.error("Delete production job error:", error);
    res.status(500).json({
      message: "Failed to delete production job",
    });
  }
});

/* ===== END PRODUCTION MODULE APIs ===== */

/* =============== END SALES ORDERS API =============== */


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
