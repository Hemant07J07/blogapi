# posts/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

@receiver(post_save, sender=User)
def create_or_ensure_profile(sender, instance, created, **kwargs):
    """
    - If the user is newly created, create a Profile.
    - Otherwise, ensure a Profile exists (covers older users / previous missing signal registration).
    """
    if created:
        Profile.objects.create(user=instance)
    else:
        Profile.objects.get_or_create(user=instance)
