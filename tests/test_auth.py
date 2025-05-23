from flask import url_for, session
from app.models import User
from werkzeug.security import check_password_hash

def test_register_user(client, init_database):
    """Test successful user registration."""
    response = client.post(url_for('register'), data={
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    }, follow_redirects=True)
    assert response.status_code == 200 # Should redirect to dashboard
    assert b'Dashboard' in response.data # Check if dashboard content is present
    
    with client.application.app_context():
        user = User.query.filter_by(email='newuser@example.com').first()
        assert user is not None
        assert user.username == 'newuser'
        assert check_password_hash(user.password_hash, 'password123')

def test_register_existing_username(client, new_user):
    """Test registration with an existing username."""
    response = client.post(url_for('register'), data={
        'username': new_user.username, # Existing username
        'email': 'another@example.com',
        'password': 'password123',
        'confirm_password': 'password123'
    })
    assert response.status_code == 200 # Stays on registration page
    assert b'That username is taken' in response.data
    assert b'Dashboard' not in response.data

def test_register_existing_email(client, new_user):
    """Test registration with an existing email."""
    response = client.post(url_for('register'), data={
        'username': 'anotheruser',
        'email': new_user.email, # Existing email
        'password': 'password123',
        'confirm_password': 'password123'
    })
    assert response.status_code == 200
    assert b'That email is taken' in response.data
    assert b'Dashboard' not in response.data

def test_login_logout_user(client, new_user):
    """Test successful login and logout."""
    # Create a user with a known password to test login
    with client.application.app_context():
        # new_user fixture already creates a user, but we need to set a known password
        # Or better, create a specific user for this test if new_user's password isn't controlled here
        # For now, assuming new_user fixture can be extended or we re-create one.
        # Let's assume new_user fixture has a known password or we modify it.
        # For simplicity, let's re-register a user whose password we know for sure for login
        client.post(url_for('register'), data={
            'username': 'loginuser',
            'email': 'login@example.com',
            'password': 'loginpassword',
            'confirm_password': 'loginpassword'
        }, follow_redirects=True)
        # Logout if registration auto-logs in
        client.get(url_for('logout'), follow_redirects=True)


    login_response = client.post(url_for('login'), data={
        'email': 'login@example.com',
        'password': 'loginpassword'
    }, follow_redirects=True)
    assert login_response.status_code == 200
    assert b'Dashboard' in login_response.data
    assert b'Login successful!' in login_response.data

    # Test accessing a protected route
    dashboard_response = client.get(url_for('dashboard'))
    assert dashboard_response.status_code == 200
    assert b'Welcome, loginuser!' in dashboard_response.data # Check for username

    logout_response = client.get(url_for('logout'), follow_redirects=True)
    assert logout_response.status_code == 200
    assert b'Home' in logout_response.data # Should redirect to home
    assert b'You have been logged out.' in logout_response.data
    
    # Check session for _user_id after logout
    with client.session_transaction() as sess:
        assert '_user_id' not in sess

    # Test accessing protected route after logout
    dashboard_after_logout = client.get(url_for('dashboard'), follow_redirects=True)
    assert dashboard_after_logout.status_code == 200 # Redirects to login
    assert b'Login' in dashboard_after_logout.data # Should be on login page
    assert b'Please log in to access this page' in dashboard_after_logout.data


def test_login_incorrect_credentials(client, new_user):
    """Test login with incorrect credentials."""
    response = client.post(url_for('login'), data={
        'email': new_user.email,
        'password': 'wrongpassword'
    }, follow_redirects=True)
    assert response.status_code == 200 # Stays on login page
    assert b'Login Unsuccessful. Please check email and password' in response.data
    assert b'Dashboard' not in response.data

def test_dashboard_access_unauthenticated(client):
    """Test /dashboard access when not authenticated."""
    response = client.get(url_for('dashboard'), follow_redirects=True)
    assert response.status_code == 200
    assert b'Login' in response.data # Should redirect to login
    assert b'Please log in to access this page' in response.data

def test_dashboard_access_authenticated(client, new_user):
    """Test /dashboard access when authenticated."""
    # Log in the user first
    # To ensure a clean state and known password, let's register and login this user
    client.post(url_for('register'), data={
        'username': 'auth_user',
        'email': 'auth@example.com',
        'password': 'authpassword',
        'confirm_password': 'authpassword'
    }, follow_redirects=True)
    # If registration auto-logs in, user is already logged in.
    # If not, uncomment the login lines:
    # client.post(url_for('login'), data={
    # 'email': 'auth@example.com',
    # 'password': 'authpassword'
    # }, follow_redirects=True)

    response = client.get(url_for('dashboard'))
    assert response.status_code == 200
    assert b'Dashboard' in response.data
    assert b'Welcome, auth_user' in response.data
    assert b'Login' not in response.data # Should not be on login page
