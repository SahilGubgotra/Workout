document.addEventListener('DOMContentLoaded', () => {
    const day = window.location.pathname.substring(1);
    if (day && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day)) {
        loadWorkout(day);
    }
});

async function loadWorkout(day) {
    try {
        const response = await fetch(`/.netlify/functions/api/workout/${day}`);
        const data = await response.json();
        
        // Create workout form
        const container = document.querySelector('.container');
        container.innerHTML = `
            <h1>${day.charAt(0).toUpperCase() + day.slice(1)}'s Workout</h1>
            <div class="workout-form">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="restDay" ${data.rest ? 'checked' : ''}>
                        Rest Day
                    </label>
                </div>
                <div class="form-group" id="exerciseInput" ${data.rest ? 'style="display: none;"' : ''}>
                    <label for="exercise">Add Exercise:</label>
                    <input type="text" id="exercise" placeholder="Enter exercise">
                    <button onclick="addExercise('${day}')">Add</button>
                </div>
                <ul class="exercises-list">
                    ${data.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
                </ul>
            </div>
            <p><a href="/" class="day-link" style="margin-top: 1rem;">Back to Home</a></p>
        `;

        // Add event listener for rest day checkbox
        document.getElementById('restDay').addEventListener('change', async (e) => {
            const exerciseInput = document.getElementById('exerciseInput');
            exerciseInput.style.display = e.target.checked ? 'none' : 'block';
            
            await fetch('/.netlify/functions/api/workout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    day,
                    rest: e.target.checked
                })
            });

            if (e.target.checked) {
                document.querySelector('.exercises-list').innerHTML = '';
            }
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load workout data');
    }
}

async function addExercise(day) {
    const exerciseInput = document.getElementById('exercise');
    const exercise = exerciseInput.value.trim();
    
    if (!exercise) return;

    try {
        const response = await fetch('/.netlify/functions/api/workout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                day,
                exercise
            })
        });

        if (response.ok) {
            const li = document.createElement('li');
            li.textContent = exercise;
            document.querySelector('.exercises-list').appendChild(li);
            exerciseInput.value = '';
        } else {
            throw new Error('Failed to add exercise');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add exercise');
    }
} 