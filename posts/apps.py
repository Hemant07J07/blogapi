from django.apps import AppConfig


class PostsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'posts'
    
    def ready(self):
        # Import signal handlers here so they are registered when Django starts.
        # Import inside ready() to avoid circular imports at module import time.
        import posts.signals  # noqa: F401