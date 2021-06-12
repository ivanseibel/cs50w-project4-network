from django.contrib import admin
from network.models import Following, Like, User, Post

# Register your models here.

admin.site.register(User)
admin.site.register(Post)
admin.site.register(Following)
admin.site.register(Like)
