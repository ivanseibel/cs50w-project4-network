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

    // By default, load the all posts
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
        const new_post_body = document.querySelector('#new-post-body');
        new_post_body.value = '';
        new_post_body.focus();
        get_posts();
    }
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
                console.log(result)
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
        card.appendChild(author);

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