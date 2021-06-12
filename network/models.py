from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE)
    body = models.TextField(blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # def serialize(self):
    #     return {
    #         "id": self.id,
    #         "user": self.user.username,
    #         "body": self.body,
    #         "created_at": self.created_at,
    #         "updated_at": self.updated_at,
    #     }


class Following(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE)
    follows_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follows_user")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # def serialize(self):
    #     return {
    #         "id": self.id,
    #         "user": self.user.username,
    #         "follows_user": self.follows_user.username,
    #         "created_at": self.created_at,
    #         "updated_at": self.updated_at,
    #     }


class Like(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE)
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # def serialize(self):
    #     return {
    #         "id": self.id,
    #         "user": self.user.username,
    #         "post": self.post.id,
    #         "created_at": self.created_at,
    #         "updated_at": self.updated_at,
    #     }
