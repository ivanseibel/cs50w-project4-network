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
from django.db.models import Value

from .models import Following, User


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
@login_required
def load_posts(request):

    # List all posts must be via GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # Get user author
    user = request.user

    # Get following user list
    following = Following.objects.filter(
        user_id=user.id).values_list("follows_user", flat=True)

    # Get posts from who I'm following
    posts_from_following = Post.objects.values(
        "id", "body", "user__id", "user__username", "user__first_name", "created_at").filter(user_id__in=following)

    # Get my posts
    posts_from_myself = Post.objects.values(
        "id", "body", "user__id", "user__username", "user__first_name", "created_at").filter(user_id=user.id)

    # Join posts following + my
    all_posts = posts_from_following | posts_from_myself

    # Return emails in reverse chronological order and add is_logged field
    posts = all_posts.order_by("-created_at").all().annotate(is_logged=Case(
        When(user__id=user.id,
             then=Value(True)),
        default=Value(False),
        output_field=BooleanField()))

    return JsonResponse(list(posts), safe=False)
