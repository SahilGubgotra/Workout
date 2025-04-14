import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workout from './models/Workout.js';

// Load environment variables
dotenv.config();

// Setting up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection options
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
    maxPoolSize: 10,
    minPoolSize: 1,
};

// Initialize MongoDB connection promise
let dbConnection = null;

// MongoDB connection function
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI environment variable is not set');
            throw new Error('Database configuration is missing');
        }

        if (!dbConnection) {
            console.log('Initiating MongoDB connection...');
            dbConnection = await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
            console.log('MongoDB connected successfully');
        }
        return dbConnection;
    } catch (error) {
        console.error('MongoDB connection error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        throw error;
    }
};

// Middleware to ensure database connection
const ensureDbConnected = async (req, res, next) => {
    try {
        if (!dbConnection || mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        next();
    } catch (error) {
        console.error('Database connection middleware error:', error);
        res.status(500).render('error', {
            message: 'Unable to connect to database. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Express middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Application error:', {
        message: err.message,
        stack: err.stack,
        code: err.code
    });
    res.status(500).render('error', {
        message: 'Something went wrong! Please try again.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Route for the home page
app.get('/', (req, res) => {
    res.render('index');
});

// Route for each day's page
app.get('/:day', ensureDbConnected, async (req, res) => {
    const day = req.params.day.toLowerCase();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    if (validDays.includes(day)) {
        try {
            let workout = await Workout.findOne({ day }).lean();
            if (!workout) {
                workout = { rest: false, exercises: [] };
            }
            res.render('day', { day, data: workout });
        } catch (error) {
            console.error('Error fetching workout:', {
                message: error.message,
                stack: error.stack,
                day: day
            });
            res.status(500).render('error', {
                message: 'Unable to load workout data. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    } else {
        res.status(404).send('Day not found');
    }
});

// Route to handle form submission
app.post('/save-day', ensureDbConnected, async (req, res) => {
    const { day, rest, exercise } = req.body;
    
    try {
        if (rest === 'true') {
            await Workout.findOneAndUpdate(
                { day },
                { rest: true, exercises: [] },
                { upsert: true, new: true }
            );
        } else {
            await Workout.findOneAndUpdate(
                { day },
                { 
                    rest: false,
                    $push: { exercises: exercise }
                },
                { upsert: true, new: true }
            );
        }
        res.redirect(`/${day}`);
    } catch (error) {
        console.error('Error saving workout:', {
            message: error.message,
            stack: error.stack,
            day: day,
            rest: rest,
            exercise: exercise
        });
        res.status(500).render('error', {
            message: 'Error saving workout. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found',
        error: {}
    });
});

// Connect to MongoDB before starting the server
if (process.env.NODE_ENV !== 'production') {
    // For local development
    app.listen(PORT, async () => {
        try {
            await connectDB();
            console.log(`Server is running on http://localhost:${PORT}`);
        } catch (error) {
            console.error('Failed to start server:', error);
        }
    });
} else {
    // For Vercel deployment
    try {
        // Establish initial connection
        connectDB().then(() => {
            console.log('Initial MongoDB connection established for serverless environment');
        }).catch((error) => {
            console.error('Initial MongoDB connection failed:', error);
        });
    } catch (error) {
        console.error('Error during serverless initialization:', error);
    }
}

export default app; 