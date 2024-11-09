document.addEventListener('DOMContentLoaded', loadQuiz);

let currentQuestionIndex = 0;
let questions = [];
let userAnswers = [];

function loadQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizName = urlParams.get('quiz');

    axios.get(`http://127.0.0.1:3000/quiz-questions?quiz=${quizName}`, { withCredentials: true })
        .then(response => {
            questions = response.data.questions; // load questions from respective CSV
            if (questions.length > 0) {
                displayQuestion(0);
            }
        })
        .catch(error => {
            if (error.response && error.response.status === 401) {
                localStorage.setItem('reasonDenied', quizName === 'post_training' ? 'topicsIncomplete' : 'preTrainingIncomplete');
                window.location.href = '/misc_html/401.html';
            } else {
                console.error('Error loading quiz questions:', error);
            }
        });
}

function displayQuestion(index) {
    const questionData = questions[index];
    const form = document.getElementById('quizForm');
    form.innerHTML = `
        <div class="question">${questionData.question}</div><br>
        <button class="btn option-btn" onclick="checkAnswer('${questionData.correctAnswer}', 'A')">${questionData.optionA}</button>
        <button class="btn option-btn" onclick="checkAnswer('${questionData.correctAnswer}', 'B')">${questionData.optionB}</button>
        <button class="btn option-btn" onclick="checkAnswer('${questionData.correctAnswer}', 'C')">${questionData.optionC}</button>
        <button class="btn option-btn" onclick="checkAnswer('${questionData.correctAnswer}', 'D')">${questionData.optionD}</button>
    `;
}

// Function to check if the selected answer is correct
function checkAnswer(correctAnswer, selectedAnswer) {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        if (button.textContent === questions[currentQuestionIndex][`option${correctAnswer}`]) {
            button.classList.add('correct'); // Highlight correct answer
        } else if (button.textContent === questions[currentQuestionIndex][`option${selectedAnswer}`]) {
            button.classList.add('incorrect'); // Highlight selected wrong answer
        }
        button.disabled = true; // Disable all buttons after selection
    });

    userAnswers.push(selectedAnswer);

    // Move to the next question after a delay
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex); // Load the next question
        } else {
            submitQuiz();
        }
    }, 1500); 
}

// Function to submit the quiz answers
function submitQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizName = urlParams.get('quiz');

    axios.post('http://127.0.0.1:3000/submit-quiz', {
        quizName: quizName,
        answers: userAnswers // Send user's answers to the backend
    })
    .then(response => {
        const quizResult = document.getElementById('quizResult');
        const quizStatus = document.getElementById('quizStatus');
        
        // display user's result and button to exit quiz
        localStorage.setItem('score', response.data.score);
        quizResult.textContent = `You scored ${response.data.score}/${response.data.total}!`;
        quizResult.style.color = "#00BEA5";
        quizResult.style.visibility = "visible";
        quizStatus.textContent = "Click the button below to get your score updated and go back to the training menu."
        quizStatus.style.visibility = "visible";
        document.getElementById('exitQuizBtn').style.visibility = 'visible';
        document.getElementById('exitQuizBtn').disabled = false;
        document.getElementById('menuLink').style.visibility = 'hidden';
        document.getElementById('menuLink').disabled = true;
    })
    .catch(error => {
        console.error('Error submitting quiz:', error);
    });
}

function exitQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = localStorage.getItem('username');
    const quizName = urlParams.get('quiz');
    const score = localStorage.getItem('score');

    axios.post('http://127.0.0.1:3000/update-score', {
        username: username,
        quizName: quizName,
        score: score
    })
    .then(response => {
        setTimeout(() => {
            window.location.href = "http://127.0.0.1:5500/auth_pages/training_menu.html";
        }, 1000);
    })
    .catch(error => {
        console.error('Error updating score:', error);
        setTimeout(() => {
            window.location.href = "http://127.0.0.1:5500/auth_pages/training_menu.html";
        }, 1000);
    });
}
