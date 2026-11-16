"""
Management command: create_admin

Creates an admin user account manually.

Usage:
    python manage.py create_admin --email admin@example.com --password Secret123! --first_name John --last_name Doe

If --password is omitted, a secure random password is generated and printed.
"""
import secrets
import string
from django.core.management.base import BaseCommand, CommandError
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create a new admin user account.'

    def add_arguments(self, parser):
        parser.add_argument('--email',      required=True,  help='Admin email address')
        parser.add_argument('--password',   required=False, help='Password (auto-generated if omitted)')
        parser.add_argument('--first_name', default='Admin',    help='First name')
        parser.add_argument('--last_name',  default='User',     help='Last name')

    def handle(self, *args, **options):
        email      = options['email'].strip().lower()
        first_name = options['first_name'].strip()
        last_name  = options['last_name'].strip()
        password   = options['password']

        if User.objects.filter(email=email).exists():
            raise CommandError(f'An account with email {email} already exists.')

        if not password:
            alphabet = string.ascii_letters + string.digits + '!@#$%'
            password = ''.join(secrets.choice(alphabet) for _ in range(16))
            self.stdout.write(f'  Auto-generated password: {password}')

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.ADMIN,
        )
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=['is_staff', 'is_superuser'])

        self.stdout.write(self.style.SUCCESS(
            f'\nAdmin account created successfully:\n'
            f'  Email    : {user.email}\n'
            f'  Name     : {user.full_name}\n'
            f'  Password : {password}\n'
            f'  Role     : {user.role}\n'
        ))
