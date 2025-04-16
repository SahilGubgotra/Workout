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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
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

// MongoDB Connection with retry logic
const connectWithRetry = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Retry options
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s
        });
        console.log('Successfully connected to MongoDB.');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

// Initial connection
connectWithRetry();

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(connectWithRetry, 5000);
});

// Routes
app.get('/', (req, res) => {
    res.send('Workout Tracker API is running');
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

// Start server only after MongoDB connects
mongoose.connection.once('open', () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Export the Express API
export default app; 