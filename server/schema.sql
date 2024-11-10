-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
    id SERIAL PRIMARY KEY,
    quiz_attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    selected_option TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for better query performance
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers(quiz_attempt_id);