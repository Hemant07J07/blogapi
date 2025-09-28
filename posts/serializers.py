# posts/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Post, Comment, Category, Tag, Like, Profile

User = get_user_model()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]

class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    # counts (read-only)
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)

    # write-only helper fields for frontend to send IDs
    category_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "content",
            "excerpt",
            "cover_image",
            "categories",
            "tags",
            "is_published",
            "created_at",
            "updated_at",
            "likes_count",
            "comments_count",
            "category_ids",   # write-only
            "tag_ids",        # write-only
        ]
        read_only_fields = ("id", "slug", "author", "created_at", "updated_at")

    def create(self, validated_data):
        # pop helper lists
        category_ids = validated_data.pop("category_ids", [])
        tag_ids = validated_data.pop("tag_ids", [])

        # Determine author:
        # prefer 'author' passed from view (perform_create), otherwise look at request user
        author = validated_data.pop("author", None)
        if author is None:
            request = self.context.get("request")
            if request and request.user and request.user.is_authenticated:
                author = request.user
            else:
                raise serializers.ValidationError("Authentication required to create posts.")

        # create post
        post = Post.objects.create(author=author, **validated_data)

        # set many-to-many fields if any IDs were provided
        if category_ids:
            # optionally: validate ids exist
            post.categories.set(category_ids)
        if tag_ids:
            post.tags.set(tag_ids)

        return post

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "user", "body", "parent", "created_at"]
        read_only_fields = ("id", "user", "created_at")

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "post", "user", "created_at"]
        read_only_fields = ("id", "created_at")

class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Profile
        fields = ["user", "bio", "avatar"]
