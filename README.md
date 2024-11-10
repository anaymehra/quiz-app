# Code Quiz Generator

A dynamic quiz application built with React, featuring a user-friendly interface, customizable quizzes, and a statistics page to track quiz history. This project offers a seamless experience for quiz creation, taking, and result tracking.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication**: Secure login/logout with token-based authentication.
- **Quiz Creation**: Users can create quizzes with different topics and difficulty levels.
- **Recent Quizzes**: Displays a list of recently taken quizzes.
- **Statistics Page**: Shows detailed statistics of past quizzes, including scores and quiz dates.
- **Responsive Design**: Adapts to different screen sizes for an optimal experience.

## Tech Stack

- **Frontend**: React, Material UI
- **Backend**: Node.js, Express
- **Database**: MongoDB (for storing quiz data and user details)
- **API Integration**: Fetching quiz topics and questions

## Getting Started

To run this project locally, follow these steps:

### Prerequisites

- Node.js installed
- MongoDB instance running

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anaymehra/quiz-app
   cd code-quiz-generator
2. Install dependencies:
   ```bash
   npm install
3. Set up environment variables:
   Create a .env file in the server root directory and add the following keys:
   ```bash
   GEMINI_API=GeminiAPI
   DATABASE_URL=postgresql://user:password@localhost:5432/quiz-app
   JWT_SECRET=""
4. Start the development server:
   ```bash
   npm run dev
5. The application should now be running on http://localhost:3000.

## Usage
- **Login**: Use the login page to authenticate yourself.
- **Start a Quiz**: Choose a topic and difficulty level, then start the quiz.
- **View Recent Quizzes**: Access recent quizzes from the sidebar.
- **View Statistics**: Navigate to the statistics page to view your quiz history and scores.

## API Endpoints
- `GET /api/auth/verify` - Verifies user token and fetches user info.
- `GET /api/quiz/history` - Fetches the user's quiz history.
- `POST /api/quiz/start` - Starts a new quiz with selected parameters.
- `POST /api/auth/login` - Logs in the user and returns a token.

## Folder Structure
```java
.
├── public
├── src
│   ├── components
│   ├── codingConcepts.js
│   ├── App.jsx
│   └── main.jsx
├── .env
├── package.json
└── README.md
```
## Contributing
1. Fork the repository.
2. Create a new branch (git checkout -b feature/YourFeature).
3. Commit your changes (git commit -m 'Add some feature').
4. Push to the branch (git push origin feature/YourFeature).
5. Open a pull request.

## License
This project is licensed under the MIT License.


   
   
