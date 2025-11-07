const questions = [
    {
        question: "А когда с человеком может произойти дрожемент?",
        answers: [
            { answer: "Когда он влюбляется", correct: false },
            { answer: "Когда он идет шопиться", correct: false },
            { answer: "Когда он слышит смешную шутку", correct: false },
            { answer: "Когда он боится, пугается", correct: true }
        ],
        explanation: "Лексема «дрожемент» имплицирует состояние крайнего напряжения и страха: «У меня всегда дрожемент в ногах, когда копы подходят».",
        wasIncorrect: false,
        wasCorrect: false,
        animationPlayed: false
    },
    {
        question: "Говорят, Антон заовнил всех. Это еще как понимать?",
        answers: [
            { answer: "Как так, заовнил? Ну и хамло. Кто с ним теперь дружить-то будет?", correct: false },
            { answer: "Антон очень надоедливый и въедливый человек, всех задолбал", correct: false },
            { answer: "Молодец, Антон, всех победил!", correct: true },
            { answer: "Нет ничего плохого в том, что Антон тщательно выбирает себе друзей", correct: false }
        ],
        explanation: "Термин «заовнить» заимствован из английского языка, он происходит от слова own и переtranslates как «победить», «завладеть», «получить».",
        wasIncorrect: false,
        wasCorrect: false,
        animationPlayed: false
    },
    {
        question: "А фразу «заскамить мамонта» как понимать?",
        answers: [
            { answer: "Разозлить кого-то из родителей", correct: false },
            { answer: "Увлекаться археологией", correct: false },
            { answer: "Развести недотепу на деньги", correct: true },
            { answer: "Оскорбить пожилого человека", correct: false }
        ],
        explanation: "Заскамить мамонта — значит обмануть или развести на деньги. Почему мамонта? Потому что мошенники часто выбирают в жертвы пожилых людей (древних, как мамонты), которых легко обвести вокруг пальца.",
        wasIncorrect: false,
        wasCorrect: false,
        animationPlayed: false
    },
    {
        question: "Кто такие бефефе?",
        answers: [
            { answer: "Вши?", correct: false },
            { answer: "Милые котики, такие милые, что бефефе", correct: false },
            { answer: "Лучшие друзья", correct: true },
            { answer: "Люди, которые не держат слово", correct: false }
        ],
        explanation: "Бефефе — это лучшие друзья. Этакая аббревиатура от английского выражения best friends forever.",
        wasIncorrect: false,
        wasCorrect: false,
        animationPlayed: false
    }
];

let currentQuestions = [];
let correctAnswersCount = 0;
let answeredQuestions = {};
let questionsCompleted = false;

document.addEventListener('DOMContentLoaded', init);

function init() {
    currentQuestions = questions.map(q => ({
        ...q,
        wasIncorrect: false,
        wasCorrect: false,
        animationPlayed: false
    }));
    mixArray(currentQuestions);
    
    correctAnswersCount = 0;
    answeredQuestions = {};
    questionsCompleted = false;
    
    document.getElementById('no-questions').style.display = 'none'; 
    document.getElementById('final-stats').style.display = 'none';
    
    displayAllQuestions();
}

function mixArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    
    array.forEach(question => {
        mixAnswers(question.answers);
    });
}

function mixAnswers(answers) {
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }
}

function displayAllQuestions() {
    const questionsContainer = document.getElementById('questions-container');
    let questionsHTML = '';
    
    currentQuestions.forEach((question, questionIndex) => {
        const isAnswered = answeredQuestions[questionIndex] === true;
        const isFirstUnanswered = getFirstUnansweredIndex() === questionIndex;
        const wasIncorrect = question.wasIncorrect || false;
        const wasCorrect = question.wasCorrect || false;
        const animationPlayed = question.animationPlayed || false;
        
        if (animationPlayed) {
            questionsHTML += `
                <div class="question-container animation-completed" data-question-index="${questionIndex}">
                    <div class="question-text clickable">
                        <span>${questionIndex + 1}.</span> ${question.question}
                        ${wasCorrect ? '<div class="question-correct-marker">✓</div>' : ''}
                        ${wasIncorrect ? '<div class="question-incorrect-marker">✗</div>' : ''}
                        <div class="expand-icon">▼</div>
                    </div>
                </div>
            `;
            return;
        }
        
        const shouldShowIncorrectAnimation = wasIncorrect && !animationPlayed;
        const shouldShowCorrectContent = wasCorrect && !animationPlayed;
        
        questionsHTML += `
            <div class="question-container" data-question-index="${questionIndex}">
                <div class="question-text">
                    <span>${questionIndex + 1}.</span> ${question.question}
                    ${wasCorrect ? '<div class="question-correct-marker">✓</div>' : ''}
                    ${wasIncorrect ? '<div class="question-incorrect-marker">✗</div>' : ''}
                </div>
                <div class="answers-container ${shouldShowIncorrectAnimation ? 'incorrect-move' : ''} ${shouldShowCorrectContent ? 'correct-move' : ''}">
        `;
        
        question.answers.forEach((answer, answerIndex) => {
            const isDisabled = isAnswered || !isFirstUnanswered;
            const isCorrectAnswer = answer.correct;
            const showCorrect = wasCorrect && isCorrectAnswer && !animationPlayed;
            const showIncorrect = wasIncorrect && question.selectedAnswerIndex === answerIndex && !animationPlayed;
            
            let answerClasses = '';
            if (isDisabled) answerClasses += 'disabled ';
            if (showCorrect) answerClasses += 'correct ';
            if (showIncorrect) answerClasses += 'incorrect ';
            
            questionsHTML += `
                <div class="answer ${answerClasses.trim()}" 
                     data-question-index="${questionIndex}" 
                     data-answer-index="${answerIndex}"
                     ${isDisabled ? 'style="pointer-events: none;"' : ''}>
                    ${answer.answer}
                    <div class="marker correct-marker" style="display: ${showCorrect ? 'block' : 'none'};">✓</div>
                    <div class="marker incorrect-marker" style="display: ${showIncorrect ? 'block' : 'none'};">✗</div>
                </div>
            `;
        });
        
        questionsHTML += `
                </div>
            </div>
        `;
    });
    
    questionsContainer.innerHTML = questionsHTML;
    
    document.querySelectorAll('.answer:not(.disabled)').forEach(answer => {
        answer.addEventListener('click', handleAnswerClick);
    });
    
    if (Object.keys(answeredQuestions).length === currentQuestions.length) {
        showFinalStats();
        questionsCompleted = true;
    }

    document.querySelectorAll('.question-container.animation-completed .question-text.clickable').forEach(questionText => {
        questionText.addEventListener('click', handleQuestionClick);
    });
}

function handleAnswerClick(event) {
    const questionIndex = parseInt(event.currentTarget.dataset.questionIndex);
    const answerIndex = parseInt(event.currentTarget.dataset.answerIndex);
    
    const question = currentQuestions[questionIndex];
    const answer = question.answers[answerIndex];
    const isCorrect = answer.correct;
    
    answeredQuestions[questionIndex] = true;
    
    if (isCorrect) {
        event.currentTarget.classList.add('correct');
        correctAnswersCount++;
        question.wasCorrect = true;
        question.wasIncorrect = false;
        
        handleCorrectAnswerAnimation(questionIndex);
    } else {
        event.currentTarget.classList.add('incorrect');
        question.wasIncorrect = true;
        question.wasCorrect = false;
        
        handleIncorrectAnswerAnimation(questionIndex);
    }
}

function handleCorrectAnswerAnimation(questionIndex) {
    const question = currentQuestions[questionIndex];
    const questionElement = document.querySelector(`.question-container[data-question-index="${questionIndex}"]`);
    const answersContainer = questionElement.querySelector('.answers-container');
    
    if (!answersContainer) return;
    
    let explanationElement = document.getElementById(`explanation-${questionIndex}`);
    if (!explanationElement) {
        explanationElement = document.createElement('div');
        explanationElement.className = 'explanation';
        explanationElement.id = `explanation-${questionIndex}`;
        explanationElement.innerHTML = question.explanation;
        answersContainer.parentNode.insertBefore(explanationElement, answersContainer.nextSibling);
    }
    
    const incorrectAnswers = answersContainer.querySelectorAll('.answer:not(.correct)');
    
    incorrectAnswers.forEach(answer => {
        answer.classList.add('move-right-incorrect');
    });
    
    setTimeout(() => {
        explanationElement.style.display = 'block';
        explanationElement.classList.add('show-explanation');
        
        setTimeout(() => {
            const correctAnswer = answersContainer.querySelector('.answer.correct');
            if (correctAnswer) {
                correctAnswer.classList.add('move-right-final');
            }
            
            if (explanationElement) {
                explanationElement.classList.add('move-right-final');
            }
            
            setTimeout(() => {
                question.animationPlayed = true;
                displayAllQuestions();
            }, 1000);
        }, 1500); 
    }, 1000); 
}

function handleIncorrectAnswerAnimation(questionIndex) {
    const question = currentQuestions[questionIndex];
    const answersContainer = document.querySelector(`.question-container[data-question-index="${questionIndex}"] .answers-container`);
    
    if (!answersContainer) return;
    
    const allAnswers = answersContainer.querySelectorAll('.answer');
    
    allAnswers.forEach(answer => {
        answer.classList.add('move-right-incorrect');
    });
    
    setTimeout(() => {
        question.animationPlayed = true;
        displayAllQuestions();
    }, 1000);
}

function getFirstUnansweredIndex() {
    for (let i = 0; i < currentQuestions.length; i++) {
        if (answeredQuestions[i] !== true) {
            return i;
        }
    }
    return -1;
}

function showFinalStats() {
    const finalStatsElement = document.getElementById('final-stats');
    finalStatsElement.innerHTML = `
        <h2>Тест завершен!</h2>
        <p>Вы ответили правильно на ${correctAnswersCount} из ${currentQuestions.length} вопросов</p>
    `;
    finalStatsElement.style.display = 'block';
    
    document.getElementById('no-questions').style.display = 'block';
}

function handleQuestionClick(event) {
    const questionContainer = event.currentTarget.closest('.question-container');
    const questionIndex = parseInt(questionContainer.dataset.questionIndex);
    const question = currentQuestions[questionIndex];
    
    if (questionContainer.classList.contains('expanded')) {
        collapseQuestion(questionContainer);
    } else {
        document.querySelectorAll('.question-container.expanded').forEach(container => {
            if (container !== questionContainer) {
                collapseQuestion(container);
            }
        });
        expandQuestion(questionContainer, question);
    }
}

function expandQuestion(container, question) {
    container.classList.add('expanded');
    
    let expandedContent = container.querySelector('.expanded-content');
    if (!expandedContent) {
        expandedContent = document.createElement('div');
        expandedContent.className = 'expanded-content';
        container.appendChild(expandedContent);
    }
    
    const correctAnswer = question.answers.find(answer => answer.correct);
    
    expandedContent.innerHTML = `
        <div class="correct-answer-block">
            <div class="correct-answer-label">Правильный ответ:</div>
            <div class="correct-answer-text">${correctAnswer.answer}</div>
        </div>
        <div class="explanation-block">
            <div class="explanation-label">Пояснение:</div>
            <div class="explanation-text">${question.explanation}</div>
        </div>
    `;
}

function collapseQuestion(container) {
    container.classList.remove('expanded');
    const expandedContent = container.querySelector('.expanded-content');
    if (expandedContent) {
        expandedContent.remove();
    }
}