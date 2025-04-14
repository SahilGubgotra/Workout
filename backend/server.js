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
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// MongoDB connection function
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Don't throw the error, let the app continue running
        // but log it for debugging
    }
};

// Connect to MongoDB
connectDB();

// Handle MongoDB connection errors
mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Please try again.');
});

// Route for the home page
app.get('/', (req, res) => {
    res.render('index');
});

// Route for each day's page
app.get('/:day', async (req, res) => {
    const day = req.params.day.toLowerCase();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    if (validDays.includes(day)) {
        try {
            // Check MongoDB connection
            if (mongoose.connection.readyState !== 1) {
                throw new Error('Database not connected');
            }

            let workout = await Workout.findOne({ day }).lean();
            if (!workout) {
                workout = { rest: false, exercises: [] };
            }
            res.render('day', { day, data: workout });
        } catch (error) {
            console.error('Error fetching workout:', error);
            // Send a user-friendly error message
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
app.post('/save-day', async (req, res) => {
    const { day, rest, exercise } = req.body;
    
    try {
        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

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
        console.error('Error saving workout:', error);
        res.status(500).send('Error saving workout. Please try again.');
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).render('error', { 
        message: 'Page not found',
        error: {}
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 