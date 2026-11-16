from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        BUYER = 'buyer', 'Buyer'
        SELLER = 'seller', 'Seller'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_disabled = models.BooleanField(default=False)       # admin can disable account
    disabled_reason = models.TextField(blank=True, null=True)
    disabled_at = models.DateTimeField(blank=True, null=True)

    # AI-ready: preference fields (stubbed for Phase 9)
    pref_budget_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    pref_budget_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    pref_location = models.CharField(max_length=255, blank=True, null=True)
    pref_category = models.CharField(max_length=100, blank=True, null=True)
    pref_intended_use = models.CharField(max_length=255, blank=True, null=True)
    pref_amenities = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.email} ({self.role})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'


class SellerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    business_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='sellers/profiles/', blank=True, null=True)
    id_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_profiles'

    def __str__(self):
        return f'Seller profile — {self.user.email}'
