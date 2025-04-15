import express from 'express';
import serverless from 'serverless-http';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define Workout Schema
const workoutSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    rest: {
        type: Boolean,
        default: false
    },
    exercises: {
        type: [String],
        default: []
    }
});

// Create Workout model
const Workout = mongoose.model('Workout', workoutSchema);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Sahil:Sahilhero@cluster0.wt6euol.mongodb.net/workout-tracker?retryWrites=true&w=majority';

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        const db = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        cachedDb = db;
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Routes
app.get('/api', (req, res) => {
    res.json({ message: 'Workout Tracker API' });
});

app.get('/api/workout/:day', async (req, res) => {
    try {
        await connectToDatabase();
        const day = req.params.day.toLowerCase();
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        if (!validDays.includes(day)) {
            return res.status(404).json({ error: 'Day not found' });
        }

        const workout = await Workout.findOne({ day }) || { rest: false, exercises: [] };
        res.json(workout);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/workout', async (req, res) => {
    try {
        await connectToDatabase();
        const { day, rest, exercise } = req.body;
        
        if (!day) {
            return res.status(400).json({ error: 'Day is required' });
        }

        if (rest === 'true') {
            await Workout.findOneAndUpdate(
                { day },
                { rest: true, exercises: [] },
                { upsert: true }
            );
        } else {
            await Workout.findOneAndUpdate(
                { day },
                { 
                    rest: false,
                    $push: { exercises: exercise }
                },
                { upsert: true }
            );
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something broke!' });
});

// Export the serverless function
export const handler = serverless(app); 