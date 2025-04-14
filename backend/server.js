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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

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
            let workout = await Workout.findOne({ day });
            if (!workout) {
                workout = { rest: false, exercises: [] };
            }
            res.render('day', { day, data: workout });
        } catch (error) {
            console.error('Error fetching workout:', error);
            res.status(500).send('Server error');
        }
    } else {
        res.status(404).send('Day not found');
    }
});

// Route to handle form submission
app.post('/save-day', async (req, res) => {
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
        console.error('Error saving workout:', error);
        res.status(500).send('Error saving workout');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 