# Workout Tracker

A simple web application to track your daily workout routines.

## Project Structure

```
workout/
├── backend/
│   ├── data/         # JSON data storage
│   ├── server.js     # Express server
│   └── package.json  # Backend dependencies
└── frontend/
    ├── public/       # Static assets
    ├── views/        # EJS templates
    └── package.json  # Frontend dependencies
```

## Features

- Track workouts for each day of the week
- Mark days as rest days
- Add multiple exercises per day
- Simple and intuitive interface

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd workout
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

1. Start the server:
   ```bash
   cd backend
   node server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Technologies Used

- Node.js
- Express.js
- EJS templating
- JSON for data storage 