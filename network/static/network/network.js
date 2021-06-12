document.addEventListener('DOMContentLoaded', () => {

    // Use buttons to toggle between views
    const btn_all_posts = document.querySelector('#btn-all-posts');
    if (btn_all_posts) {
        btn_all_posts.addEventListener('click', () => load_container('all'));
    }
    const btn_following = document.querySelector('#btn-following');
    if (btn_following) {
        btn_following.addEventListener('click', () => load_container('following'));
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
    load_container('all', 1);
});

function load_container(type, page) {

    // Get all posts
    if (type === 'all') {
        document.querySelector("#posts-title").innerHTML = "All Posts";
        const profile_card = document.querySelector("#profile-card");
        if (profile_card) {
            profile_card.innerHTML = "";
        }
        const new_post_body = document.querySelector('#new-post-body');
        if (new_post_body) {
            new_post_body.value = '';
            new_post_body.focus();
        }
        get_posts('all', page);
    }

    // Get following posts
    if (type === 'following') {
        document.querySelector("#posts-title").innerHTML = "Following";
        const profile_card = document.querySelector("#profile-card");
        if (profile_card) {
            profile_card.innerHTML = "";
        }
        const new_post_body = document.querySelector('#new-post-body');
        if (new_post_body) {
            new_post_body.value = '';
            new_post_body.focus();
        }
        get_posts('following', page);
    }
}

function load_profile(data) {
    // Hide post textarea
    const new_post_card = document.querySelector("#new-post-card");
    new_post_card.hidden = true;

    // Show user name
    document.querySelector("#posts-title").innerHTML = `${data.profile.user_first_name} ${data.profile.user_last_name}`;

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

    posts_push(data);

    window.scrollTo(0, 0);
}

function create_post() {
    // Get params
    const body = document.querySelector('#new-post-body').value;

    // Create post
    fetch('/posts/create', {
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
                load_container('all');
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

function get_posts(type = "all", page = 1) {
    const url = type === "all" ? '/posts/all' : '/posts/following';

    // Load posts
    fetch(`${url}?page=${page}`, { method: 'GET' })
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
    const posts_list = document.querySelector(`#posts-list`)
    posts_list.innerHTML = "";

    data.posts.map(element => {
        const card = document.createElement("div");
        const author_div = document.createElement("div");
        const author = document.createElement("span");
        const edit_div = document.createElement("div");
        const edit_link = document.createElement("span");
        const body_div = document.createElement("div");
        const body = document.createElement("span");
        const timestamp = document.createElement("span");
        const heart_icon = document.createElement("i");
        const number_of_like = document.createElement("span");
        const likes_container = document.createElement("div");
        const comment_div = document.createElement("div");
        const comment_link = document.createElement("a");

        card.className = "card post-card";
        card.id = `post-card-id-${element.id}`;

        author.className = "h5";
        author.innerHTML = `<strong>${element.user__first_name}</strong>`;
        author.style.cursor = "pointer";
        author.onclick = () => { get_profile(element.user__id) };
        author_div.appendChild(author);
        author_div.style.marginBottom = "10px";
        card.appendChild(author_div);

        if (element.is_logged) {
            edit_link.innerHTML = "Edit";
            edit_link.id = `edit-link-${element.id}`;
            edit_link.onclick = () => { load_to_edit(element.id); };
            edit_link.style.color = "blue";
            edit_link.style.cursor = "pointer";
            edit_div.id = `edit-div-${element.id}`;
            edit_div.appendChild(edit_link)
            card.appendChild(edit_div);
        }

        body.innerHTML = element.body;
        body.id = `body-${element.id}`;
        body_div.id = `body-div-${element.id}`;
        body_div.appendChild(body);
        card.appendChild(body_div);

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
        card.appendChild(likes_container);

        comment_link.innerHTML = "Comment";
        comment_link.style.color = "gray";
        comment_link.style.textDecoration = "none";
        comment_link.href = "#";
        comment_div.appendChild(comment_link);
        card.appendChild(comment_div);

        posts_list.appendChild(card);
    });

    update_pagination(data);
}

function get_profile(user_id, page) {
    // Load profile
    fetch(`/profile?user_id=${user_id}&page=${page}`, { method: 'GET' })
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

function update_pagination(data) {
    const actual_section = document.querySelector("#posts-title").innerHTML;

    const pages = Number(data.pages);
    const actual_page = Number(data.actual_page);

    // Only for Profile page
    const user_id = data.posts[0].user__id;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    // Previous button
    const li_previous = document.createElement("li");
    if (actual_page === 1) {
        li_previous.className = "page-item disabled";
        const span_previous = document.createElement("span");
        span_previous.className = "page-link";
        span_previous.innerText = "Previous";
        li_previous.appendChild(span_previous);
    } else {
        li_previous.className = "page-item";
        const anchor_previous = document.createElement("a");
        anchor_previous.href = "#";
        anchor_previous.className = "page-link";
        anchor_previous.innerText = "Previous";

        if (actual_section === "All Posts") {
            anchor_previous.onclick = () => { load_container("all", actual_page - 1); };
        } else if (actual_section === "Following") {
            anchor_previous.onclick = () => { load_container("following", actual_page - 1); };
        } else {
            anchor_previous.onclick = () => { get_profile(user_id, actual_page - 1); };
        }

        li_previous.appendChild(anchor_previous);
    }

    // Add previous to ul
    ul.appendChild(li_previous);

    for (let index = 1; index <= pages; index++) {
        const li_page = document.createElement("li");
        if (index === actual_page) {
            li_page.setAttribute("aria-current", "page");
            li_page.className = "page-item active";
            const span_page = document.createElement("span");
            span_page.className = "page-link";
            span_page.innerText = index.toString();
            li_page.appendChild(span_page);
        } else {
            li_page.className = "page-item";
            const anchor_page = document.createElement("a");
            anchor_page.href = "#";
            anchor_page.className = "page-link";
            anchor_page.innerText = index.toString();
            if (actual_section === "All Posts") {
                anchor_page.onclick = () => { load_container("all", index); };
            } else if (actual_section === "Following") {
                anchor_page.onclick = () => { load_container("following", index); };
            } else {
                anchor_page.onclick = () => { get_profile(user_id, index); };
            }

            li_page.appendChild(anchor_page);
        }

        ul.appendChild(li_page);
    }

    // Next button
    const li_next = document.createElement("li");
    if (actual_page === pages) {
        li_next.className = "page-item disabled";
        const span_next = document.createElement("span");
        span_next.className = "page-link";
        span_next.innerText = "Next";
        li_next.appendChild(span_next);
    } else {
        li_next.className = "page-item";
        const anchor_next = document.createElement("a");
        anchor_next.href = "#";
        anchor_next.className = "page-link";
        anchor_next.innerText = "Next";
        if (actual_section === "All Posts") {
            anchor_next.onclick = () => { load_container("all", actual_page + 1); };
        } else if (actual_section === "Following") {
            anchor_next.onclick = () => { load_container("following", actual_page + 1); };
        } else {
            anchor_next.onclick = () => { get_profile(user_id, actual_page + 1); };
        }

        li_next.appendChild(anchor_next);
    }

    ul.appendChild(li_next);

    document.querySelector("#pagination-container").innerHTML = "";
    document.querySelector("#pagination-container").appendChild(ul);
}

function load_to_edit(post_id) {
    const body = document.querySelector(`#body-${post_id}`);
    const body_div = document.querySelector(`#body-div-${post_id}`);
    const edit_link = document.querySelector(`#edit-link-${post_id}`);
    const edit_div = document.querySelector(`#edit-div-${post_id}`);

    body.hidden = true;

    edit_link.innerHTML = "Save";
    edit_link.onclick = () => { update_post(post_id, textarea.value) };

    const textarea = document.createElement("textarea");
    textarea.id = `edit-body-input-${post_id}`;
    textarea.value = body.innerHTML;
    body_div.appendChild(textarea);

    const cancel_link = document.createElement("a");
    cancel_link.innerHTML = "Cancel";
    cancel_link.href = "#";
    cancel_link.id = `cancel-link-${post_id}`;
    cancel_link.style.marginLeft = "10px";
    cancel_link.onclick = () => { unload_to_edit(post_id); };
    edit_div.appendChild(cancel_link)

    textarea.focus();
}

function unload_to_edit(post_id) {
    const body = document.querySelector(`#body-${post_id}`);
    const body_div = document.querySelector(`#body-div-${post_id}`);
    const edit_link = document.querySelector(`#edit-link-${post_id}`);
    const edit_div = document.querySelector(`#edit-div-${post_id}`);

    body.hidden = false;

    edit_link.innerHTML = "Edit";
    edit_link.onclick = () => { load_to_edit(post_id) };

    const textarea = document.querySelector(`#edit-body-input-${post_id}`);
    body.innerHTML = textarea.value;
    body_div.removeChild(textarea);

    const cancel_link = document.querySelector(`#cancel-link-${post_id}`);
    edit_div.removeChild(cancel_link)
}

function update_post(post_id, body) {
    // Update post
    fetch('/posts/update', {
        method: 'POST',
        body: JSON.stringify({
            body,
            post_id,
        })
    })
        .then(response => response.json())
        .then(result => {
            const { error, message } = result;

            if (error) {
                alert(`Oh-oh: ${error}`);
            } else {
                unload_to_edit(post_id);
            }
        })
        .catch(error => {
            alert(`Oh-oh: ${error}`);
        });
}
