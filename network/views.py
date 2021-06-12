import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models.expressions import Case, When
from django.db.models.fields import BooleanField, CharField
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from network.models import Post
from django.core import serializers
from django.db.models import Value, Count
from django.core.paginator import Paginator

from .models import Following, Like, User


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password
            )

            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


@csrf_exempt
@login_required
def create_post(request):

    # Creating a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get data from request
    data = json.loads(request.body)

    # Get user author
    user = request.user

    # Get contents of post
    body = data.get("body", "")
    if not body or body == "":
        return JsonResponse({
            "error": "Post must have a content."
        }, status=400)

    post = Post(
        user=user,
        body=body,
    )
    post.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)


@csrf_exempt
def load_posts(request):

    # List all posts must be via GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # Get user author
    user = request.user

    # Get page number
    try:
        page = request.GET["page"]
    except:
        page = 1

    # Get all posts
    all_posts = Post.objects.values(
        "id",
        "body",
        "user__id",
        "user__username",
        "user__first_name",
        "created_at"
    ).annotate(like_count=Count('like'))

    # Return emails in reverse chronological order and add is_logged field
    posts = all_posts.order_by("-created_at").all().annotate(is_logged=Case(
        When(user__id=user.id,
             then=Value(True)),
        default=Value(False),
        output_field=BooleanField()))

    posts_page = Paginator(posts, 10)
    pages = posts_page.num_pages

    posts = posts_page.page(page)

    return JsonResponse({"pages": pages, "actual_page": int(page), "posts": list(posts)}, safe=False)


@ csrf_exempt
@ login_required
def load_profile(request):

    # List all posts must be via GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # Get logged user
    user = request.user

    # Get profile user and page
    profile_user_id = request.GET["user_id"]
    try:
        page = int(request.GET["page"])
    except:
        page = 1

    # Get posts
    posts = Post.objects.values(
        "id", "body", "user__id", "user__username", "user__first_name", "created_at").filter(user_id=profile_user_id)

    # Get user data
    number_of_following = Following.objects.filter(
        user_id=profile_user_id).count()
    number_of_followers = Following.objects.filter(
        follows_user_id=profile_user_id).count()
    profile_user = User.objects.get(pk=profile_user_id)
    is_same_user = str(profile_user_id) == str(user.id)
    is_following = Following.objects.filter(
        user_id=user.id, follows_user_id=profile_user_id).count() == 1

    profile = {
        "user_first_name": profile_user.first_name,
        "user_last_name": profile_user.last_name,
        "following": number_of_following,
        "followers": number_of_followers,
        "is_same_user": is_same_user,
        "is_following": is_following,
        "user_id": profile_user_id,
    }

    # Return emails in reverse chronological order and add is_logged field
    posts = posts.order_by("-created_at").all().annotate(is_logged=Case(
        When(user__id=user.id,
             then=Value(True)),
        default=Value(False),
        output_field=BooleanField()))

    posts_page = Paginator(posts, 10)
    pages = posts_page.num_pages
    posts = posts_page.page(page)

    return JsonResponse({"pages": pages, "actual_page": page, "profile": profile, "posts": list(posts)}, safe=False)


@ csrf_exempt
@ login_required
def follow_unfollow(request):

    # Creating a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get data from request
    data = json.loads(request.body)

    # Get user author
    user = request.user

    # Get user_id to follow/unfollow
    user_id = data.get("user_id", "")
    if not user_id or user_id == "":
        return JsonResponse({
            "error": "You must provide an user id."
        }, status=400)

    # Get type follow/unfollow
    type = data.get("type", "")
    if not type or type == "":
        return JsonResponse({
            "error": "You must provide a type."
        }, status=400)

    if type == "follow":
        follow = Following(user_id=user.id, follows_user_id=user_id)
        follow.save()
    else:
        Following.objects.get(
            user_id=user.id, follows_user_id=user_id).delete()

    return JsonResponse({"message": "Success."}, status=200)


@ csrf_exempt
@ login_required
def load_following_posts(request):

    # List all posts from following must be via GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # Get user
    user = request.user

    # Get page number
    try:
        page = request.GET["page"]
    except:
        page = 1

    # Get following user list
    following = Following.objects.filter(
        user_id=user.id).values_list("follows_user", flat=True)

    # Get posts from who I'm following
    posts_from_following = Post.objects.values(
        "id", "body", "user__id", "user__username", "user__first_name", "created_at").filter(user_id__in=following)

    # Return emails in reverse chronological order and add is_logged field
    posts = posts_from_following.order_by("-created_at").all().annotate(is_logged=Case(
        When(user__id=user.id,
             then=Value(True)),
        default=Value(False),
        output_field=BooleanField()))

    posts_page = Paginator(posts, 10)
    pages = posts_page.num_pages

    posts = posts_page.page(page)

    return JsonResponse({"pages": pages, "actual_page": int(page), "posts": list(posts)}, safe=False)


@csrf_exempt
@login_required
def update_post(request):

    # Updating a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get data from request
    data = json.loads(request.body)

    # Get user author
    user = request.user

    # Get contents of body
    body = data.get("body", "")
    if not body or body == "":
        return JsonResponse({
            "error": "Post must have a content."
        }, status=400)

    # Get contents of post user id
    post_id = data.get("post_id", "")
    if not post_id or post_id == "":
        return JsonResponse({
            "error": "You must provide the post id."
        }, status=400)

    post = Post.objects.get(pk=post_id)
    post_user_id = post.user_id

    if str(post_user_id) != str(user.id):
        return JsonResponse({
            "error": "You don't have permission to update this post."
        }, status=400)

    post.body = body
    post.save()

    return JsonResponse({"message": "Post updated successfully."}, status=200)


@csrf_exempt
@login_required
def like(request):

    # Creating a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get data from request
    data = json.loads(request.body)

    # Get user author
    user = request.user

    # Get contents of post
    post_id = data.get("post_id", "")
    if not post_id or post_id == "":
        return JsonResponse({
            "error": "You must provide a post id."
        }, status=400)

    # Check if is already liked
    liked = Like.objects.filter(post_id=post_id, user_id=user.id)

    # If already liked, delete
    if liked:
        liked.delete()
    else:
        liked = Like(user_id=user.id, post_id=post_id)
        liked.save()

    like_count = Like.objects.filter(post_id=post_id).count()

    return JsonResponse({"like_count": like_count}, status=200)
