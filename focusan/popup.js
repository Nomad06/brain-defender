
const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - percent / 100 * circumference;
    circle.style.strokeDashoffset = offset;
}

// Timer Logic
let timeLeft = 25 * 60; // 25 minutes
let initialTime = 25 * 60;
let timerId = null;
let isRunning = false;

const timeDisplay = document.getElementById('time');
const toggleBtn = document.getElementById('toggle-btn');
const statusDisplay = document.querySelector('.status');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update circle progress
    const percent = (timeLeft / initialTime) * 100;
    // Invert for countdown effect (full to empty)
    // Actually, let's go from empty to full or full to empty. 
    // Usually timers go full -> empty.
    // strokeDashoffset = 0 is full.
    // strokeDashoffset = circumference is empty.

    // We want it to start full (0 offset) and go to empty (circumference offset).
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = -offset; // Negative to rotate correct direction if needed, or just offset.
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    toggleBtn.textContent = 'Pause';
    statusDisplay.textContent = 'Focusing...';

    timerId = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            clearInterval(timerId);
            isRunning = false;
            toggleBtn.textContent = 'Start Focus';
            statusDisplay.textContent = 'Completed';
            // Play sound or notification here
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerId);
    toggleBtn.textContent = 'Resume';
    statusDisplay.textContent = 'Paused';
}

toggleBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

// Initialize
// Start with full ring
circle.style.strokeDashoffset = 0;
updateDisplay();
