// document.addEventListener("DOMContentLoaded", function() {
//     const username = localStorage.getItem('username');
//     if (!username) {
//         console.error('Username not found in localStorage');
//         return;
//     }

//     axios.get('http://127.0.0.1:3000/user-scores', { params: { username: username } })
//         .then(response => {
//             const scores = response.data;
//             checkPageAccess(scores);
//             handleTrainingMenu(scores);
//         })
//         .catch(error => {
//             console.error('Error fetching user scores:', error);
//         });
// });

// function handleTrainingMenu(scores) {
//     const topicScores = [
//         scores.topic1, scores.topic2, scores.topic3,
//         scores.topic4, scores.topic5, scores.topic6,
//         scores.topic7, scores.topic8
//     ];

//     const postTrgButton = document.getElementById('postTrgButton');

//     // Disable all topic buttons initially
//     const topicButtons = document.querySelectorAll('.topic-icon');
//     topicButtons.forEach(button => {
//         button.classList.add('disabled');
//     });

//     // If no pre-training score, prompt the user to complete Pre-Training Quiz
//     if (!scores.pre_training) {
//         alert('Hi there! Before you can commence with the training topics, please complete the Pre-Training Quiz first. More details will be given in the next page once you click the button.');
//         postTrgButton.classList.add('disabled');
//         return;
//     } else {
//         topicButtons.forEach(button => {
//             button.classList.remove('disabled');
//         });
//         // Disable post-training quiz until all topic quizzes are completed
//         const allTopicsCompleted = topicScores.every(score => score !== null);
//         if (allTopicsCompleted) {
//             alert('You have completed all eight topic quizzes. The Post-Training Quiz is now unlocked. You may continue reading the topics until you feel confident to take the quiz. All the best!')
//             postTrgButton.classList.remove('disabled');
//         } else {
//             alert('You have completed the Pre-Training Quiz. All topics are now unlocked and you may read them in any order as you wish. Do note that, to unlock the Post-Training Quiz, all eight topic quizzes must be completed. Enjoy your study with VigilanceHub!');
//             postTrgButton.classList.add('disabled');
//         }
//     }
// }

// function checkPageAccess(scores) {
//     const url = window.location.href;

//     // Blacklist of URLs to block if pre-training is not done
//     const blacklistPreTrg = [
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic1',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic2',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic3',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic4',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic5',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic6',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic7',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic8',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=1',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=2',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=3',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=4',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=5',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=6',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=7',
//         'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=8',
//         'http://127.0.0.1:5500/auth_pages/quiz/prep_postTrg.html',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=post_training'
//     ];

//     // Blacklist of URLs to block if pre-training is done but not all topics are completed
//     const blacklistPostTrg = [
//         'http://127.0.0.1:5500/auth_pages/quiz/prep_postTrg.html',
//         'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=post_training'
//     ];

//     // Block URLs if pre-training quiz is not done
//     if (!scores.pre_training && blacklistPreTrg.includes(url)) {
//         localStorage.setItem('reasonDenied', 'preTrainingIncomplete');
//         return401Err();
//     }

//     // Block post-training and post-training quiz URLs if not all topics are done
//     const allTopicsCompleted = areAllTopicsCompleted(scores);
//     if (scores.pre_training && !allTopicsCompleted && blacklistPostTrg.includes(url)) {
//         localStorage.setItem('reasonDenied', 'topicsIncomplete');
//         return401Err();
//     }
// }

// function areAllTopicsCompleted(scores) {
//     return [
//         scores.topic1, scores.topic2, scores.topic3,
//         scores.topic4, scores.topic5, scores.topic6,
//         scores.topic7, scores.topic8
//     ].every(score => score !== null);
// }

// function return401Err() {
//     window.location.href = '/misc_html/401.html';
// }

document.addEventListener("DOMContentLoaded", function() {
    const username = localStorage.getItem('username');
    if (!username) {
        console.error('Username not found in localStorage');
        return;
    }

    axios.get('http://127.0.0.1:3000/user-scores', { params: { username: username } })
        .then(response => {
            const scores = response.data;

            // training_menu.html
            if (document.getElementById('trgMenuContainer')) {
                handleTrainingMenu(scores);
            }
            
            // training_page.html
            if (document.getElementById('quizContainer') || document.getElementById('postTrgButton')) {
                checkPageAccess(scores);
            }
        })
        .catch(error => {
            console.error('Error fetching user scores:', error);
        });
});

function handleTrainingMenu(scores) {
    const topicScores = [
        scores.topic1, scores.topic2, scores.topic3,
        scores.topic4, scores.topic5, scores.topic6,
        scores.topic7, scores.topic8
    ];

    const postTrgButton = document.getElementById('postTrgButton');

    // Check if topic buttons exist on the current page
    const topicButtons = document.querySelectorAll('.topic-icon');
    if (topicButtons.length > 0) {
        // Disable all topic buttons initially
        topicButtons.forEach(button => {
            button.classList.add('disabled');
        });

        if (!scores.pre_training) {
            alert('Hi there! Before you can commence with the training topics, please complete the Pre-Training Quiz first. More details will be given in the next page once you click the button.');
            if (postTrgButton) postTrgButton.classList.add('disabled');
            return;
        } else {
            // Enable the 8 topic links
            topicButtons.forEach(button => {
                button.classList.remove('disabled');
            });
            // Disable post_training quiz until all topic quizzes are completed
            const allTopicsCompleted = topicScores.every(score => score !== null);
            if (allTopicsCompleted) {
                alert('You have completed all eight topic quizzes. The Post-Training Quiz is now unlocked. You may continue reading the topics until you feel confident to take the quiz. All the best!')
                if (postTrgButton) postTrgButton.classList.remove('disabled');
            } else {
                alert('You have completed the Pre-Training Quiz. All topics are now unlocked and you may read them in any order as you wish. Do note that, to unlock the Post-Training Quiz, all eight topic quizzes must be completed. Enjoy your study with VigilanceHub!');
                if (postTrgButton) postTrgButton.classList.add('disabled');
            }
        }
    }
}

function checkPageAccess(scores) {
    const url = window.location.href;

    // Blacklist of URLs to block if pre-training is not done
    const blacklistPreTrg = [
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic1',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic2',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic3',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic4',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic5',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic6',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic7',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=topic8',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=1',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=2',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=3',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=4',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=5',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=6',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=7',
        'http://127.0.0.1:5500/auth_pages/training_page.html?topicNo=8',
        'http://127.0.0.1:5500/auth_pages/quiz/prep_postTrg.html',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=post_training'
    ];

    // Blacklist of URLs to block if pre-training is done but not all topics are completed
    const blacklistPostTrg = [
        'http://127.0.0.1:5500/auth_pages/quiz/prep_postTrg.html',
        'http://127.0.0.1:5500/auth_pages/quiz/quiz_page.html?quiz=post_training'
    ];

    // Block URLs if pre-training quiz is not done
    if (!scores.pre_training && blacklistPreTrg.includes(url)) {
        localStorage.setItem('reasonDenied', 'preTrainingIncomplete');
        return401Err();
    }

    // Block post-training and post-training quiz URLs if not all topics are done
    const allTopicsCompleted = areAllTopicsCompleted(scores);
    if (scores.pre_training && !allTopicsCompleted && blacklistPostTrg.includes(url)) {
        localStorage.setItem('reasonDenied', 'topicsIncomplete');
        return401Err();
    }
}

function areAllTopicsCompleted(scores) {
    return [
        scores.topic1, scores.topic2, scores.topic3,
        scores.topic4, scores.topic5, scores.topic6,
        scores.topic7, scores.topic8
    ].every(score => score !== null);
}

function return401Err() {
    window.location.href = '/misc_html/401.html';
}
