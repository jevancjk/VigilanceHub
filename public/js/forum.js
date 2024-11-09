document.addEventListener('DOMContentLoaded', function () {
    // If forum.html is loaded, load its elements
    const postForm = document.getElementById('postForm');
    if (postForm) {
        loadPosts();

        postForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const postTitle = document.getElementById('postTitle').value;
            const postText = document.getElementById('postText').value;
            const userID = localStorage.getItem('userID');
            const username = localStorage.getItem('username');

            if (!userID) {
                alert('Error: You must be logged in to create a post.');
                return;
            }

            axios.post('http://127.0.0.1:3000/posts', {
                postTitle: postTitle,
                postText: postText,
                userID: userID,
                username: username
            }, { withCredentials: true })
            .then(response => {
                alert('Post submitted successfully!');
                document.getElementById('postTitle').value = '';
                document.getElementById('postText').value = '';
                loadPosts();
            })
            .catch(error => {
                console.error('Error submitting post:', error);
            });
        });
    }

    // If forum_page.html is loaded, load its elements
    const postID = new URLSearchParams(window.location.search).get('postID');
    const postDetails = document.getElementById('postDetails');
    if (postDetails && postID) {
        loadPostDetails(postID);
        loadComments(postID);

        document.getElementById('commentForm').addEventListener('submit', function (event) {
            event.preventDefault();
            const commentText = document.getElementById('commentText').value;

            axios.post(`http://127.0.0.1:3000/posts/${postID}/comments`, { commentText }, { withCredentials: true })
                .then(() => {
                    alert('Comment added successfully!');
                    document.getElementById('commentText').value = '';
                    loadComments(postID);
                })
                .catch(error => console.error(error));
        });
    }
});

// forum.html
function loadPosts() {
    const postsList = document.getElementById('posts-list');
    if (!postsList){
        return;
    }

    axios.get('http://127.0.0.1:3000/posts')
        .then(response => {
            const posts = response.data;
            postsList.innerHTML = '';

            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.innerHTML = `
                    <h4><a href="forum_post.html?postID=${post.postID}">${post.postTitle}</a></h4>
                    <p style="font-size: 12px; color: grey;">${formatDate(post.postDate)}</p>
                    <h5 style="font-size: 18px;">Posted by: <strong style="color: plum;">${post.username}</strong></h5>
                    <p class="display-post">${post.postText}</p><br>
                `;
                postsList.appendChild(postDiv);
            });
        })
        .catch(error => console.error(error));
}

// forum_post.html
function loadPostDetails(postID) {
    axios.get(`http://127.0.0.1:3000/posts/${postID}`)
        .then(response => {
            const post = response.data;
            const postDetails = document.getElementById('postDetails');
            if (postDetails) {
                postDetails.innerHTML = `
                    <h3 style="color: #75EAFF;">${post.postTitle}</h2>
                    <p style="font-size: 12px; color: grey;">${formatDate(post.postDate)}</p>
                    <h5>Posted by: <strong style="color: plum;">${post.username}</strong></h5>
                    <p>${post.postText}</p>
                `;
                $("#postTitle").text(`${post.postTitle}`);
            }
        })
        .catch(error => console.error(error));
}

function loadComments(postID) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList){
        return;
    }

    axios.get(`http://127.0.0.1:3000/posts/${postID}/comments`)
        .then(response => {
            const comments = response.data;
            commentsList.innerHTML = '';

            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.innerHTML = `
                <h5><strong style="color: khaki;">${comment.username}</strong> commented:</h5>
                <p>${comment.commentText}</p>
                <p style="font-size: 12px; color: grey;">${formatDate(comment.commentDate)}</p>
                `;
                commentsList.appendChild(commentDiv);
            });
        })
        .catch(error => console.error(error));
}

// Reformat the timestamp of posts/comments on frontend
function formatDate(timePosted) {
    const date = new Date(timePosted);
    const timestamp = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true // use 12-hour clock
    };
    return date.toLocaleString('en-GB', timestamp);
}
