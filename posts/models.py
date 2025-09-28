# posts/models.py
from django.conf import settings
from django.db import models, IntegrityError
from django.utils.text import slugify
from django.urls import reverse
import time

# keep using the settings string (works for ForeignKey)
User = settings.AUTH_USER_MODEL

class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=250)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    content = models.TextField()          # store rich text (HTML from Quill)
    excerpt = models.CharField(max_length=500, blank=True)
    # Use TextField for cloud URLs (avoid URL length / validation DB errors)
    cover_image = models.TextField(blank=True)
    categories = models.ManyToManyField(Category, blank=True, related_name='posts')
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def _generate_unique_slug(self):
        base = slugify(self.title)[:250] or "post"
        slug = base
        n = 1
        # exclude the current instance when checking for uniqueness
        while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def save(self, *args, **kwargs):
        # ensure slug exists
        if not self.slug:
            self.slug = self._generate_unique_slug()

        # small retry if IntegrityError occurs (rare race condition on unique slug)
        tries = 0
        while True:
            try:
                super().save(*args, **kwargs)
                break
            except IntegrityError:
                tries += 1
                if tries > 3:
                    # re-raise after a few tries so we don't hide real problems
                    raise
                # slightly change slug and retry
                self.slug = f"{self.slug}-{tries}"
                time.sleep(0.05)

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    body = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.user} on {self.post}'

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post','user')

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    avatar = models.TextField(blank=True)  # allow long avatar URLs

    def __str__(self):
        return f'Profile: {self.user}'
