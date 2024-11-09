document.addEventListener("DOMContentLoaded", function() {
    // Display the user's username
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('displayUname').textContent = username;

        axios.get('http://127.0.0.1:3000/user-details', { withCredentials: true })
            .then(response => {
                // Set the avatar in the profile-pic div
                const avatarPath = response.data.avatar ? `/public/images/avatars/${response.data.avatar}` : `/public/images/avatars/default.png`;
                const profilePicDiv = document.querySelector('.profile-pic');
                profilePicDiv.style.backgroundImage = `url(${avatarPath})`;
                profilePicDiv.style.backgroundSize = 'cover';
                profilePicDiv.style.backgroundPosition = 'center';

                // Display user posts
                const postsContainer = document.getElementById('userPostsContainer');
                const posts = response.data.posts;

                if (posts && posts.length > 0) {
                    posts.forEach(post => {
                        const postLink = `http://127.0.0.1:5500/auth_pages/forum/forum_post.html?postID=${post.postID}`;
                        const postElement = document.createElement('div');
                        postElement.classList.add('post-item');
                        postElement.style.textAlign = 'center';
                        postElement.innerHTML = `<hr>
                            <h5 style="font-size: 16px;"><a href="${postLink}" style="text-decoration: none; color: #75EAFF;">${post.postTitle}</a></h5>
                            <p style="color: grey; font-size: 14px;">${formatDate(new Date(post.postDate))}</p>
                        `;
                        postsContainer.appendChild(postElement);
                    });
                } else {
                    const noPostsMsg = document.createElement('p');
                    noPostsMsg.innerHTML = `<hr>You have not uploaded any posts yet.`;
                    // noPostsMsg.textContent = 'You have not uploaded any posts yet.';
                    noPostsMsg.style.textAlign = 'center';
                    noPostsMsg.style.color = 'pink';
                    postsContainer.appendChild(noPostsMsg);
                }
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
            });

        // display user scores in the table in profile.html
        axios.get('http://127.0.0.1:3000/user-scores', { params: { username } })
            .then(response => {
                const scores = response.data;

                // By default, pull NULL score as '-'
                document.getElementById('pre_training').textContent = scores.pre_training || '-';
                document.getElementById('topic1').textContent = scores.topic1 || '-';
                document.getElementById('topic2').textContent = scores.topic2 || '-';
                document.getElementById('topic3').textContent = scores.topic3 || '-';
                document.getElementById('topic4').textContent = scores.topic4 || '-';
                document.getElementById('topic5').textContent = scores.topic5 || '-';
                document.getElementById('topic6').textContent = scores.topic6 || '-';
                document.getElementById('topic7').textContent = scores.topic7 || '-';
                document.getElementById('topic8').textContent = scores.topic8 || '-';
                document.getElementById('post_training').textContent = scores.post_training || '-';

                // Recommend which topics to focus more on
                const topicsToFocus = [];

                if (scores.topic1 < 5) topicsToFocus.push('1');
                if (scores.topic2 < 5) topicsToFocus.push('2');
                if (scores.topic3 < 5) topicsToFocus.push('3');
                if (scores.topic4 < 5) topicsToFocus.push('4');
                if (scores.topic5 < 5) topicsToFocus.push('5');
                if (scores.topic6 < 5) topicsToFocus.push('6');
                if (scores.topic7 < 5) topicsToFocus.push('7');
                if (scores.topic8 < 5) topicsToFocus.push('8');

                const focusTopics = document.getElementById('focusTopics');
                if (topicsToFocus.length > 0) {
                    focusTopics.style.marginTop = '5px';
                    focusTopics.textContent = `From your scores, do focus more on Topic(s) ${topicsToFocus.join(', ')} :)`;
                    focusTopics.style.color = 'yellow';
                } else {
                    focusTopics.textContent = "Great job! You're doing well in all topics.";
                }
            })
            .catch(error => {
                console.error('Error fetching user scores:', error);
            });
    }
});
