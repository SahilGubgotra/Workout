import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        lowercase: true
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

// Ensure only one document per day
workoutSchema.index({ day: 1 }, { unique: true });

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout; 