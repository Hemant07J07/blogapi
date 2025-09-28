# posts/views.py
from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, filters, status, generics, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotAuthenticated

from .models import Post, Comment, Like, Category, Tag, Profile
from .permissions import IsAuthorOrReadOnly
from .serializers import (
    PostSerializer,
    CommentSerializer,
    LikeSerializer,
    CategorySerializer,
    TagSerializer,
    ProfileSerializer,
)

class PostViewSet(viewsets.ModelViewSet):
    """
    CRUD for posts. Authors can edit/delete; others can read.
    """
    queryset = Post.objects.all().select_related('author').prefetch_related('tags', 'categories')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'tags__name', 'categories__name']
    ordering_fields = ['created_at', 'updated_at']

    def perform_create(self, serializer):
        # request.user will now be an actual user ( or the request will be rejected before this point )
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """
        Toggle like: POST /posts/{pk}/like/
        """
        post = self.get_object()
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False}, status=status.HTTP_200_OK)
        return Response({'liked': True}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.AllowAny])
    def comments(self, request, pk=None):
        """
        GET: list top-level comments for the post
        POST: create a comment on the post (auth required)
        """
        post = self.get_object()

        if request.method == 'GET':
            qs = post.comments.filter(parent__isnull=True)
            serializer = CommentSerializer(qs, many=True)
            return Response(serializer.data)

        # POST
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().select_related('user', 'post')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all().select_related('user')
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
