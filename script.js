let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timer;
let timeRemaining = 4 * 60 * 60; // 4 hours in seconds

const welcomeScreen = document.getElementById('welcomeScreen');
const startBtn = document.getElementById('startBtn');
const questionContainer = document.getElementById('questionContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn'); // Nouveau bouton "Terminer"
const submitBtn = document.getElementById('submitBtn');
const resultsContainer = document.getElementById('results');
const reviewAnswersBtn = document.getElementById('reviewAnswersBtn'); // Nouveau bouton de révision
const examForm = document.getElementById('examForm');
const progressBar = document.querySelector('.progress-bar');
const timerDisplay = document.getElementById('timer');
const reviewSection = document.getElementById('reviewSection');

// Connecter les boutons à leurs fonctions
startBtn.addEventListener('click', startExam);
finishBtn.addEventListener('click', submitExam);
submitBtn.addEventListener('click', submitExam);
reviewAnswersBtn.addEventListener('click', reviewAnswers);

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
        const data = await response.json();
        questions = data;
        
        // Mélange des questions une fois qu'elles sont chargées
        shuffleArray(questions);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de charger les questions. Veuillez vérifier le fichier questions.json.');
    }
}

// Fonction pour démarrer l'examen
function startExam() {
    hideAllSections();
    examForm.style.display = 'block';
    progressBar.style.display = 'block';
    timerDisplay.style.display = 'block';
    renderQuestion();
    startTimer();
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
    // Rendre le bouton "Suivant" visible sauf sur la dernière question
    nextBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'inline-block';
    // Rendre le bouton "Terminer" toujours visible pendant l'examen
    finishBtn.style.display = 'inline-block';
    // Rendre le bouton "Soumettre l'Examen" visible uniquement sur la dernière question
    submitBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';
}

// Gère la soumission de l'examen
function submitExam() {
    saveCurrentAnswer();
    calculateScore();
    hideAllSections();
    resultsContainer.style.display = 'block';
    clearInterval(timer);
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

    // Mise à jour du score numérique
    document.getElementById('scoreNumerator').textContent = score;
    document.getElementById('scoreDenominator').textContent = questions.length;

    // Mise à jour de la jauge
    const gaugeFill = document.getElementById('gaugeFill');
    gaugeFill.style.width = `${percentage}%`;

    // Mise à jour du feedback et de sa couleur
    const feedbackText = getFeedback(percentage);
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.textContent = feedbackText;
    feedbackDiv.className = 'feedback ' + getFeedbackClass(percentage);
}

function getFeedback(percentage) {
    if (percentage >= 90) {
        return "Félicitations ! Vous avez un excellent score et êtes très bien préparé.";
    } else if (percentage >= 70) {
        return "Très bon résultat ! Vous êtes sur la bonne voie pour réussir l'examen.";
    } else {
        return "Continuez à vous entraîner. Revoyez les sujets pour améliorer votre score.";
    }
}

function getFeedbackClass(percentage) {
    if (percentage >= 90) return 'blue';
    if (percentage >= 70) return 'green';
    return 'red';
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

// Révision des réponses
function reviewAnswers() {
    hideAllSections();
    reviewSection.style.display = 'block';
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = ''; // Nettoyer le contenu précédent

    questions.forEach((q, index) => {
        const userChoice = userAnswers[index];
        const correctChoice = q.correct;

        const questionElement = document.createElement('div');
        // Ajout de la classe "unanswered" si la question n'a pas été répondue
        if (userChoice === undefined) {
            questionElement.className = 'review-question unanswered';
        } else {
            questionElement.className = 'review-question';
        }

        const questionHTML = `
            <h4>Question ${index + 1}: ${q.question}</h4>
            <ul class="review-options">
                ${q.options.map((option, optionIndex) => {
                    let className = '';
                    if (optionIndex === correctChoice) {
                        className = 'correct';
                    }
                    if (optionIndex === userChoice && userChoice !== correctChoice) {
                        className = 'incorrect';
                    }
                    return `<li class="review-option ${className}">${option}</li>`;
                }).join('')}
            </ul>
            <div class="review-explanation">
                <p><strong>Explication:</strong> ${q.explanation}</p>
            </div>
        `;
        questionElement.innerHTML = questionHTML;
        reviewContent.appendChild(questionElement);
    });
}

// Affiche la section des résultats et masque les autres
function showResults() {
    hideAllSections();
    resultsContainer.style.display = 'block';
}

// Masque toutes les sections principales
function hideAllSections() {
    welcomeScreen.style.display = 'none';
    examForm.style.display = 'none';
    progressBar.style.display = 'none';
    timerDisplay.style.display = 'none';
    resultsContainer.style.display = 'none';
    reviewSection.style.display = 'none';
}

// Redémarre l'examen
function restartExam() {
    currentQuestionIndex = 0;
    userAnswers = [];
    timeRemaining = 4 * 60 * 60;
    hideAllSections();
    welcomeScreen.style.display = 'block';
    loadQuestions();
}

// Initialisation de la page
window.onload = loadQuestions;
