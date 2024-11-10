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
    res.status(500).json({ message: 'Error creating user' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
    res.json({ token })
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' })
  }
})

// New route for token verification
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user })
})

// Protected quiz routes
app.post('/generate', authenticateToken, async (req, res) => {
  const prompt = req.body.prompt
  try {
    const response = await generateResponse(prompt)
    res.status(200).json({ response })
  } catch (error) {
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
    res.status(500).json({ message: 'Error fetching quiz history' })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})