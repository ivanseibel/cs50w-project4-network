
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes
    path("posts/create", views.create_post, name="create_post"),
    path("likes", views.like, name="like"),
    path("posts/update", views.update_post, name="update_post"),
    path("posts/all", views.load_posts, name="load_posts"),
    path("posts/following", views.load_following_posts,
         name="load_following_posts"),
    path("profile", views.load_profile, name="load_profile"),
    path("follow", views.follow_unfollow, name="follow_unfollow"),
]
