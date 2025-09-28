from django.contrib import admin
from .models import Post, Comment, Category, Tag, Like, Profile

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'is_published', 'created_at')
    list_filter = ('is_published', 'categories')
    search_fields = ('title', 'content')

admin.site.register(Comment)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Like)
admin.site.register(Profile)
