import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pkg from 'pg'
import { generateResponse } from './script.js'
import { OAuth2Client } from 'google-auth-library'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
//CORS configuration
app.use(cors({
  origin: ['https://quiz-app-kappa-peach.vercel.app', 'https://quiz-aua9jskcb-anaymehras-projects.vercel.app', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// For preflight requests
app.options('*', cors());
// PostgreSQL connection
const { Pool } = pkg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

app.use(express.json())


// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    )

    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.status(201).json({ token })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ message: 'User already exists.' })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('Login attempt for email:', email)

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

    if (result.rows.length === 0) {
      console.log('No user found with email:', email)
      return res.status(401).json({ message: 'No user found with email: ',email })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      console.log('Invalid password for email:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
    console.log('Login successful for email:', email)
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ message: 'Error logging in' })
  }
})

// Google Auth route
app.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }
    
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    const { email, name, sub: googleId, picture } = payload;
    
    // Check if user exists in database
    let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
    let user;
    
    if (result.rows.length === 0) {
      // Create a new user
      const username = name || email.split('@')[0]; // Generate username from name or email
      
      try {
        // Add user to database with error handling
        console.log('Creating new user with Google auth:', { username, email, googleId });
        
        // Check if users table has the expected columns
        const tableInfo = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users'
        `);
        
        const columns = tableInfo.rows.map(row => row.column_name);
        console.log('Available columns in users table:', columns);
        
        // Create query based on available columns
        let query = 'INSERT INTO users (username, email';
        let valuesList = [username, email];
        let placeholders = '$1, $2';
        let index = 3;
        
        if (columns.includes('google_id')) {
          query += ', google_id';
          valuesList.push(googleId);
          placeholders += `, $${index}`;
          index++;
        }
        
        if (columns.includes('profile_picture')) {
          query += ', profile_picture';
          valuesList.push(picture);
          placeholders += `, $${index}`;
          index++;
        }
        
        if (columns.includes('is_oauth_user')) {
          query += ', is_oauth_user';
          valuesList.push(true);
          placeholders += `, $${index}`;
          index++;
        }
        
        query += ') VALUES (' + placeholders + ') RETURNING id, username, email';
        
        if (columns.includes('profile_picture')) {
          query += ', profile_picture';
        }
        
        console.log('Executing query:', query);
        
        const insertResult = await pool.query(query, valuesList);
        user = insertResult.rows[0];
        console.log('User created successfully:', user);
      } catch (dbError) {
        console.error('Database error during user creation:', dbError);
        
        // Check if it's a duplicate key violation (user already exists)
        if (dbError.code === '23505') { // PostgreSQL unique constraint violation code
          // Try to fetch existing user again
          const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
          if (existingUser.rows.length > 0) {
            user = existingUser.rows[0];
            console.log('Found existing user after constraint violation:', user);
          } else {
            return res.status(500).json({ message: 'Error creating user - email already exists but cannot retrieve user' });
          }
        } else {
          return res.status(500).json({ 
            message: 'Error creating user account',
            details: dbError.message
          });
        }
      }
    } else {
      // Use existing user
      user = result.rows[0];
      console.log('Using existing user from database:', user);
      
      // If user exists but doesn't have google_id (signed up with email before)
      if (!user.google_id) {
        try {
          console.log('Updating existing user with Google info');
          const updateFields = ['google_id = $1'];
          const updateValues = [googleId];
          let valueIndex = 2;
          
          if (user.profile_picture === null && picture) {
            updateFields.push(`profile_picture = $${valueIndex}`);
            updateValues.push(picture);
            valueIndex++;
          }
          
          updateFields.push(`is_oauth_user = $${valueIndex}`);
          updateValues.push(true);
          valueIndex++;
          
          updateValues.push(user.id);
          
          const updateQuery = `
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE id = $${valueIndex-1}
          `;
          
          console.log('Executing update query:', updateQuery);
          await pool.query(updateQuery, updateValues);
        } catch (dbError) {
          console.error('Database error updating user with Google info:', dbError);
          // Continue anyway since we have the user
        }
      }
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // Send back token and user info
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        profilePicture: user.profile_picture || picture
      } 
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      message: 'Error with Google authentication', 
      details: error.message 
    });
  }
});

// New route for token verification
app.get('/auth/verify', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'Token is valid', user: result.rows[0] })
  } catch (error) {
    console.error('Error verifying token:', error)
    res.status(500).json({ message: 'Error verifying token' })
  }
})

// Protected quiz routes
app.post('/generate', authenticateToken, async (req, res) => {
  const prompt = req.body.prompt
  try {
    const response = await generateResponse(prompt)
    res.status(200).json({ response })
  } catch (error) {
    console.error('Error generating content:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/quiz/save-attempt', authenticateToken, async (req, res) => {
  try {
    const { topic, difficulty, score, totalQuestions, answers } = req.body
    const userId = req.user.userId

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const attemptResult = await client.query(
        'INSERT INTO quiz_attempts (user_id, topic, difficulty, score, total_questions) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, topic, difficulty, score, totalQuestions]
      )

      const attemptId = attemptResult.rows[0].id

      for (const answer of answers) {
        await client.query(
          'INSERT INTO quiz_answers (quiz_attempt_id, question_text, selected_option, is_correct) VALUES ($1, $2, $3, $4)',
          [attemptId, answer.question, answer.selectedOption, answer.isCorrect]
        )
      }

      await client.query('COMMIT')
      res.status(201).json({ message: 'Quiz attempt saved successfully' })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error saving quiz attempt:', error)
    res.status(500).json({ message: 'Error saving quiz attempt' })
  }
})

app.get('/quiz/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const result = await pool.query(
      `SELECT qa.*, array_agg(json_build_object(
        'question', qans.question_text,
        'selected_option', qans.selected_option,
        'is_correct', qans.is_correct
      )) as answers
      FROM quiz_attempts qa
      LEFT JOIN quiz_answers qans ON qa.id = qans.quiz_attempt_id
      WHERE qa.user_id = $1
      GROUP BY qa.id
      ORDER BY qa.created_at DESC`,
      [userId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching quiz history:', error)
    res.status(500).json({ message: 'Error fetching quiz history' })
  }
})

// Route for leaderboard
app.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        COUNT(qa.id) as total_quizzes,
        COALESCE(SUM(qa.score), 0) as total_score,
        COALESCE(AVG(qa.score::float / qa.total_questions::float * 100), 0) as average_score,
        (
          SELECT topic
          FROM quiz_attempts qa2
          WHERE qa2.user_id = u.id
          GROUP BY topic
          ORDER BY AVG(qa2.score::float / qa2.total_questions::float) DESC
          LIMIT 1
        ) as best_topic
      FROM 
        users u
      LEFT JOIN 
        quiz_attempts qa ON u.id = qa.user_id
      GROUP BY 
        u.id
      ORDER BY 
        average_score DESC, total_quizzes DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ message: 'Error fetching leaderboard' })
  }
})

// Route for FlashCard generation
app.post('/flashcards/generate', authenticateToken, async (req, res) => {
  const { topic } = req.body
  try {
    let promptTopic = topic

    if (!topic || topic === 'random') {
      // Generate a random programming topic
      const topics = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Data Structures', 'Algorithms']
      promptTopic = topics[Math.floor(Math.random() * topics.length)]
    }

    const prompt = `Generate 10 flashcards about the following topic: ${promptTopic}. Each flashcard should have a question on one side and a concise answer on the other. Provide the flashcards in JSON format with this structure:

    [
      {
        "question": "Question here",
        "answer": "Concise answer here"
      },
      ...
    ]

    Please respond only with the JSON data and nothing else.`

    const response = await generateResponse(prompt)
    
    // Remove any potential markdown code block syntax and trim whitespace
    const cleanedResponse = response.replace(/```json\s?|```/g, '').trim()
    
    // Parse the cleaned JSON
    const flashcards = JSON.parse(cleanedResponse)

    res.status(200).json({ flashcards, topic: promptTopic })
  } catch (error) {
    console.error('Error generating flashcards:', error)
    res.status(500).json({ message: 'Error generating flashcards', error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})