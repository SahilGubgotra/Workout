import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import * as mongoose from 'mongoose';
import dotenv from 'dotenv';

// Setting up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Basic middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

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

try {
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
} catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/:day', async (req, res) => {
    const day = req.params.day.toLowerCase();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    if (!validDays.includes(day)) {
        return res.status(404).send('Day not found');
    }

    try {
        const workout = await Workout.findOne({ day }) || { rest: false, exercises: [] };
        res.render('day', { day, data: workout });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error - please try again');
    }
});

app.post('/save-day', async (req, res) => {
    const { day, rest, exercise } = req.body;
    
    if (!day) {
        return res.status(400).send('Day is required');
    }

    try {
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
        res.redirect(`/${day}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error - please try again');
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something broke!');
});

// Export the Express API
export default app; 