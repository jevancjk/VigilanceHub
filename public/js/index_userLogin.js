document.addEventListener('DOMContentLoaded', function () {
    const userID = localStorage.getItem('userID');

    if (!userID) {
        alert('Error: You must be logged in to see updates.');
        return;
    }

    axios.get(`http://127.0.0.1:3000/user/${userID}/quiz-homepage`, { withCredentials: true })
        .then(response => {
            const updatesContainer = document.getElementById('undoneQuizzes');
            const quizStatus = response.data;
            const quizReminders = [];

            // if quiz score is null, display on update
            for (let i = 1; i <= 8; i++) {
                if (quizStatus[`topic${i}`] === null) {
                    quizReminders.push(`${i}`);
                }
            }

            const reminderDiv = document.createElement('div');
            reminderDiv.className = 'undone-quizzes';
            if (quizReminders.length > 0) {
                reminderDiv.innerHTML = `
                    <p><strong>You have yet to complete these topic quizzes:</strong> Topic(s) ${quizReminders.join(', ')}</p>
                `;
                updatesContainer.appendChild(reminderDiv);
            }
            else {
                reminderDiv.innerHTML = `
                    <p>You have completed all eight topic quizzes. Do try out the Post-Training quiz if you have not done so :)</p>
                `;
            }
            updatesContainer.appendChild(reminderDiv);
        })
        .catch(error => {
            console.error('Error fetching quiz status:', error);
        });

    axios.get(`http://127.0.0.1:3000/user/${userID}/latest-updates`, { withCredentials: true })
        .then(response => {
            const updatesContainer = document.getElementById('latestUpdates');
            const updates = response.data;

            if (updates.length === 0) {
                const noUpdatesDiv = document.createElement('div');
                noUpdatesDiv.innerHTML = '<p style="color: pink;">No new comments on your posts.</p><hr>';
                updatesContainer.appendChild(noUpdatesDiv);
            } else {
                updates.forEach(update => {
                    const updateDiv = document.createElement('div');
                    updateDiv.className = 'update';

                    const postLink = `http://127.0.0.1:5500/auth_pages/forum/forum_post.html?postID=${update.postID}`;
                    updateDiv.innerHTML = `
                        <p style="font-size: 15px;"><strong style="color: khaki;">${update.username}</strong> commented on your post: 
                        "<strong>${update.postTitle}</strong>" <br>on ${formatDate(update.commentDate)}. 
                        <a href="${postLink}">Go to your post</a>.</p><hr>
                    `;
                    updatesContainer.appendChild(updateDiv);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching updates:', error);
            updatesContainer.innerHTML = '<p>Error loading updates. Please try again later.</p>';
        });
});
