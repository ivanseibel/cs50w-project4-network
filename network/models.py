from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    user = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="posts")
    body = models.TextField(blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "body": self.body,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class Following(models.Model):
    user = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="follow_from")
    follows_user = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="follow_to")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "follows_user": self.user.username,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
