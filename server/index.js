import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pkg from 'pg'
import { generateResponse } from './script.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// PostgreSQL connection
const { Pool } = pkg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

app.use(express.json())
app.use(cors())

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
app.post('/api/auth/register', async (req, res) => {
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
    res.status(500).json({ message: 'Error creating user' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('Login attempt for email:', email)

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

    if (result.rows.length === 0) {
      console.log('No user found with email:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
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

// New route for token verification
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
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
app.post('/api/generate', authenticateToken, async (req, res) => {
  const prompt = req.body.prompt
  try {
    const response = await generateResponse(prompt)
    res.status(200).json({ response })
  } catch (error) {
    console.error('Error generating content:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/quiz/save-attempt', authenticateToken, async (req, res) => {
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

app.get('/api/quiz/history', authenticateToken, async (req, res) => {
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
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
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
app.post('/api/flashcards/generate', authenticateToken, async (req, res) => {
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