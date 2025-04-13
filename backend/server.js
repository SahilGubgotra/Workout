import express from 'express';
import bodyParser from 'body-parser';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setting up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

const workoutsFilePath = path.join(__dirname, 'data', 'workouts.json');

// Initialize workouts data if file doesn't exist
try {
    JSON.parse(readFileSync(workoutsFilePath, 'utf8'));
} catch (error) {
    writeFileSync(workoutsFilePath, JSON.stringify({}, null, 2), 'utf8');
}

// Load workouts data
let workouts = JSON.parse(readFileSync(workoutsFilePath, 'utf8'));

// Route for the home page
app.get('/', (req, res) => {
    res.render('index');
});

// Route for each day's page
app.get('/:day', (req, res) => {
    const day = req.params.day.toLowerCase();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (validDays.includes(day)) {
        res.render('day', { day: day, data: workouts[day] || { rest: false, exercises: [] } });
    } else {
        res.status(404).send('Day not found');
    }
});

// Route to handle form submission
app.post('/save-day', (req, res) => {
    const { day, rest, exercise } = req.body;
    if (rest === 'true') {
        workouts[day] = { rest: true, exercises: [] };
    } else {
        if (!workouts[day]) {
            workouts[day] = { rest: false, exercises: [] };
        }
        workouts[day].exercises.push(exercise);
    }

    writeFileSync(workoutsFilePath, JSON.stringify(workouts, null, 2), 'utf8');
    res.redirect(`/${day}`);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 