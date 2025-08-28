let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timer;
let timeRemaining = 4 * 60 * 60; // 4 hours in seconds

const questionContainer = document.getElementById('questionContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const resultsContainer = document.getElementById('results');
const examForm = document.getElementById('examForm');

// Fonction de mélange des questions (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Fonction pour charger les questions
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Erreur de chargement du fichier questions.json');
        }
        questions = await response.json();
        
        // Mélange des questions une fois qu'elles sont chargées
        shuffleArray(questions);
        
        // Une fois les questions chargées et mélangées, on affiche la première
        renderQuestion();
        startTimer();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger les questions. Veuillez vérifier le fichier questions.json.');
    }
}

// Fonction pour afficher la question actuelle
function renderQuestion() {
    if (questions.length === 0) return;

    const question = questions[currentQuestionIndex];
    questionContainer.innerHTML = `
        <div class="question">
            <div class="question-header">
                <span class="question-number">${currentQuestionIndex + 1}</span>
                <p class="question-text">${question.question}</p>
            </div>
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option">
                        <input type="radio" id="q${currentQuestionIndex}o${index}" name="q${currentQuestionIndex}" value="${index}" 
                            ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
                        <label for="q${currentQuestionIndex}o${index}">${option}</label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Écouter les changements pour sauvegarder la réponse
    document.querySelectorAll(`input[name="q${currentQuestionIndex}"]`).forEach(input => {
        input.addEventListener('change', (event) => {
            userAnswers[currentQuestionIndex] = parseInt(event.target.value);
        });
    });

    updateControls();
    updateProgressBar();
}

// Gère le passage à la question suivante ou précédente
function changeQuestion(direction) {
    saveCurrentAnswer();
    currentQuestionIndex += direction;
    renderQuestion();
}

// Sauvegarde la réponse de la question actuelle
function saveCurrentAnswer() {
    const selectedOption = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
    if (selectedOption) {
        userAnswers[currentQuestionIndex] = parseInt(selectedOption.value);
    }
}

// Met à jour les boutons de navigation
function updateControls() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'inline-block';
    submitBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';
}

// Gère la soumission de l'examen
function submitExam() {
    saveCurrentAnswer();
    calculateScore();
    examForm.style.display = 'none';
    resultsContainer.style.display = 'block';
}

// Calcule et affiche le score final
function calculateScore() {
    let score = 0;
    questions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        }
    });
    
    const percentage = (score / questions.length) * 100;
    document.getElementById('score').textContent = `${score} / ${questions.length} (${percentage.toFixed(0)}%)`;

    const feedbackText = getFeedback(percentage);
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.textContent = feedbackText;
    feedbackDiv.className = 'feedback ' + getFeedbackClass(percentage);
}

function getFeedback(percentage) {
    if (percentage >= 70) {
        return "Excellent! Vous êtes bien préparé pour l'examen officiel.";
    } else if (percentage >= 50) {
        return "Bonne tentative. Continuez à réviser pour améliorer votre score.";
    } else {
        return "Vous avez besoin de plus de révision. Concentrez-vous sur les concepts clés.";
    }
}

function getFeedbackClass(percentage) {
    if (percentage >= 70) return 'excellent';
    if (percentage >= 50) return 'good';
    return 'needs-improvement';
}

// Démarrage du minuteur
function startTimer() {
    timer = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            clearInterval(timer);
            submitExam();
        }
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        document.getElementById('timer').textContent = `Temps: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Mise à jour de la barre de progression
function updateProgressBar() {
    const progress = (currentQuestionIndex / questions.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

// Redémarre l'examen
function restartExam() {
    currentQuestionIndex = 0;
    userAnswers = [];
    timeRemaining = 4 * 60 * 60;
    resultsContainer.style.display = 'none';
    examForm.style.display = 'block';
    loadQuestions();
}

// Révision des réponses
function reviewAnswers() {
    alert("La fonctionnalité de révision des réponses n'est pas encore implémentée dans cette version.");
}

// Initialisation de la page
window.onload = loadQuestions;