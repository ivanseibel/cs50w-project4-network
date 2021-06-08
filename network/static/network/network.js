document.addEventListener('DOMContentLoaded', () => {

    // Use buttons to toggle between views
    const btn_all_posts = document.querySelector('#btn-all-posts');
    if (btn_all_posts) {
        btn_all_posts.addEventListener('click', () => load_container('content-all-posts'));
    }
    const btn_following = document.querySelector('#btn-following');
    if (btn_following) {
        btn_following.addEventListener('click', () => load_container('content-following'));
    }


    // To submit a new post
    const create_post_form = document.querySelector('#create-post-form');
    if (create_post_form) {
        create_post_form.onsubmit = () => {
            create_post();
            return false;
        };
    }

    // To control post button disabled status 
    const new_post_body = document.querySelector('#new-post-body');
    if (new_post_body) {
        new_post_body.onkeyup = enable_post_button;
    }

    // By default, load all posts
    if (btn_all_posts) {
        load_container('content-all-posts');
    }
});

function load_container(container_id) {

    // Show the mailbox and hide other views
    const containers = document.querySelectorAll('.content');
    containers.forEach(element => {
        element.hidden = element.id !== container_id;
    });

    // Get posts
    if (container_id === 'content-all-posts') {
        document.querySelector("#all-posts-title").innerHTML = "All Posts";
        document.querySelector("#profile-card").innerHTML = "";
        const new_post_body = document.querySelector('#new-post-body');
        new_post_body.value = '';
        new_post_body.focus();
        get_posts();
    }
}

function load_profile(data) {
    // Show the mailbox and hide other views
    const containers = document.querySelectorAll('.content');
    containers.forEach(element => {
        element.hidden = element.id === "content-following";
    });

    // Hide post textarea
    const new_post_card = document.querySelector("#new-post-card");
    new_post_card.hidden = true;

    // Show user name
    document.querySelector("#all-posts-title").innerHTML = `${data.profile.user_first_name} ${data.profile.user_last_name}`;

    // Clear and show the container
    const profile_card = document.querySelector("#profile-card");
    profile_card.innerHTML = "";
    profile_card.hidden = false;

    const following = document.createElement("span");
    following.innerHTML = `Following: ${data.profile.following}`;

    const followers = document.createElement("span");
    followers.style.marginLeft = "10px";
    followers.innerHTML = `Followers: ${data.profile.followers}`;

    profile_card.appendChild(following);
    profile_card.appendChild(followers);

    const follow_unfollow_link = document.createElement("a");
    const follow_unfollow = document.createElement("span");
    const is_same_user = data.profile.is_same_user;
    const is_following = data.profile.is_following;
    let type = "";
    if (!is_same_user) {
        type = is_following ? "unfollow" : "follow";
        follow_unfollow.innerHTML = type;
    }
    follow_unfollow_link.appendChild(follow_unfollow);
    follow_unfollow_link.style.marginLeft = "15px";
    follow_unfollow_link.style.color = "blue";
    follow_unfollow_link.style.cursor = "pointer";
    follow_unfollow_link.onclick = () => { follow(data.profile.user_id, type) }
    profile_card.appendChild(follow_unfollow_link);

    posts_push(data.posts);

    window.scrollTo(0, 0);
}

function create_post() {
    // Get params
    const body = document.querySelector('#new-post-body').value;

    // Create post
    fetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
            body,
        })
    })
        .then(response => response.json())
        .then(result => {
            const { error, message } = result;

            if (error) {
                alert(`Oh-oh: ${error}`);
            } else {
                alert(`Success: ${message}`);
                load_container('content-all-posts');
            }
        })
        .catch(error => {
            alert(`Oh-oh: ${error}`);
        });
}

function enable_post_button() {
    const new_post_body = document.querySelector("#new-post-body");
    document.querySelector("#post-btn").disabled = this.value.length === 0;
}

function get_posts() {
    // Load posts
    fetch('/posts/all', { method: 'GET' })
        .then(response => response.json())
        .then(result => {
            const { error } = result;

            if (error) {
                alert(`Oh-oh: ${error}`);
            } else {
                posts_push(result);
            }
        })
        .catch(error => {
            alert(`Oh-oh: ${error}`);
        });
}

function posts_push(data) {
    document.querySelector("#posts-list").innerHTML = "";

    data.map(element => {
        const card = document.createElement("div");
        const author_link = document.createElement("a");
        const author = document.createElement("p");
        const edit_link = document.createElement("a");
        const body = document.createElement("span");
        const timestamp = document.createElement("span");
        const heart_icon_link = document.createElement("a");
        const heart_icon = document.createElement("i");
        const number_of_like = document.createElement("span");
        const likes_container = document.createElement("div");
        const comment_link = document.createElement("a");

        card.className = "card post-card";
        card.id = `post-card-id-${element.id}`;

        author.className = "h5";
        author.innerHTML = `<strong>${element.user__first_name}</strong>`;

        author_link.appendChild(author);
        author_link.style.textDecoration = "none";
        author_link.style.color = "black";
        author_link.style.cursor = "pointer";
        author_link.onclick = () => { get_profile(element.user__id) };
        card.appendChild(author_link);

        edit_link.innerHTML = "Edit";
        edit_link.href = "#";
        card.appendChild(edit_link);

        body.innerHTML = element.body;
        card.appendChild(body);

        const date = new Date(element.created_at);
        timestamp.innerHTML = date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        timestamp.className = "small text-muted";
        card.appendChild(timestamp);

        heart_icon.className = element.like_count > 0 ? "bi-heart-fill" : "bi-heart";
        heart_icon.style.color = element.like_count > 0 ? "red" : null;

        heart_icon_link.href = "#";
        card.appendChild(heart_icon_link);
        heart_icon_link.appendChild(heart_icon);
        likes_container.appendChild(heart_icon_link);

        number_of_like.innerHTML = element.like_count > 0 ? element.like_count : 0;
        number_of_like.style.marginLeft = "5px";
        number_of_like.style.fontSize = "1.2rem";
        likes_container.appendChild(number_of_like);

        likes_container.style.display = "flex";
        likes_container.style.alignItems = "center";
        // likes_container.style.border = "1px solid black";
        card.appendChild(likes_container);

        comment_link.innerHTML = "Comment";
        comment_link.style.color = "gray";
        comment_link.style.textDecoration = "none";
        comment_link.href = "#";
        card.appendChild(comment_link);


        document.querySelector("#posts-list").appendChild(card);
    });
}

function get_profile(user_id) {
    // Load profile
    fetch(`/profile?user_id=${user_id}`, { method: 'GET' })
        .then(response => response.json())
        .then(result => {
            const { error } = result;

            if (error) {
                alert(`Oh-oh: ${error}`);
            } else {
                load_profile(result);
            }
        })
        .catch(error => {
            alert(`Oh-oh: ${error}`);
        });
}

function follow(user_id, type) {
    // Follow new user if type = follow and unfollow user if type = unfollow

    fetch('/follow', {
        method: 'POST',
        body: JSON.stringify({
            user_id: user_id,
            type: type,
        })
    })
        .then(response => response.json())
        .then(result => {
            const { error, message } = result;

            if (error) {
                alert(`Oh-oh: ${error}`);
            } else {
                get_profile(user_id);
            }
        })
        .catch(error => {
            alert(`Oh-oh: ${error}`);
        });
}