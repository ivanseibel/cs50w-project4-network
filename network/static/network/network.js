document.addEventListener('DOMContentLoaded', () => {

    // Use buttons to toggle between views
    document.querySelector('#btn-all-posts').addEventListener('click', () => load_container('content-all-posts'));
    document.querySelector('#btn-following').addEventListener('click', () => load_container('content-following'));


    // To submit a new post
    document.querySelector('#create-post-form').onsubmit = () => {
        create_post();
        return false;
    };

    // To control post button disabled status 
    document.querySelector('#new-post-body').onkeyup = enable_post_button;

    // By default, load the inbox
    load_container('content-all-posts');
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