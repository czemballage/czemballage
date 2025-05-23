from flask import url_for, session
from app.models import User, UserProgress, Exercise
from werkzeug.security import generate_password_hash
from datetime import date, timedelta
from app.app import db # Import db directly for easier access in tests

# Helper function to log in a user
def login(client, username, password):
    return client.post(url_for('login'), data=dict(
        email=f'{username}@example.com', # Assuming email is username@example.com
        password=password
    ), follow_redirects=True)

# Helper function to register a user
def register(client, username, email, password):
    return client.post(url_for('register'), data=dict(
        username=username,
        email=email,
        password=password,
        confirm_password=password
    ), follow_redirects=True)


def test_view_courses_unauthenticated(client, init_database, new_course):
    """Test that /courses redirects to login if not authenticated."""
    response = client.get(url_for('courses'), follow_redirects=True)
    assert response.status_code == 200
    assert b'Login' in response.data # Should be on login page

def test_view_courses_authenticated(client, new_user, init_database, new_course):
    """Test that /courses is accessible when authenticated."""
    # Register and login the user
    register(client, 'testuser', 'test@example.com', 'password123')
    # login(client, 'testuser', 'password123') # Registration logs in user

    response = client.get(url_for('courses'))
    assert response.status_code == 200
    assert b'Available Courses' in response.data
    assert bytes(new_course.title, 'utf-8') in response.data

def test_submit_correct_exercise_first_time(client, new_user, new_exercise):
    """Test submitting a correct answer for the first time."""
    # Register and login the user
    register(client, new_user.username, new_user.email, 'password123')

    response = client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Correct!' in response.data
    assert b'You earned 10 points!' in response.data

    with client.application.app_context():
        user = User.query.filter_by(username=new_user.username).first()
        progress = UserProgress.query.filter_by(user_id=user.id, exercise_id=new_exercise.id).first()
        
        assert progress is not None
        assert progress.completed is True
        assert progress.score == 1
        assert user.points == 10
        assert user.last_activity_date == date.today()
        assert user.current_streak == 1

def test_submit_incorrect_exercise(client, new_user, new_exercise):
    """Test submitting an incorrect answer."""
    register(client, new_user.username, new_user.email, 'password123')

    incorrect_answer = "wrong"
    response = client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': incorrect_answer
    }, follow_redirects=True)

    assert response.status_code == 200
    assert b'Incorrect. The correct answer was: ' + bytes(new_exercise.correct_answer, 'utf-8') in response.data
    assert b'You earned 10 points!' not in response.data # No points for incorrect answer

    with client.application.app_context():
        user = User.query.filter_by(username=new_user.username).first()
        progress = UserProgress.query.filter_by(user_id=user.id, exercise_id=new_exercise.id).first()

        assert progress is not None
        assert progress.completed is True # Still marked as completed
        assert progress.score == 0
        assert user.points == 0 # No points
        assert user.last_activity_date == date.today() # Activity is recorded
        assert user.current_streak == 1

def test_submit_correct_exercise_second_time(client, new_user, new_exercise):
    """Test submitting a correct answer again (no new points)."""
    register(client, new_user.username, new_user.email, 'password123')

    # First submission (correct)
    client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    # Second submission (correct again)
    response = client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    assert response.status_code == 200
    assert b'Correct!' in response.data
    assert b'You earned 10 points!' not in response.data # No new points

    with client.application.app_context():
        user = User.query.filter_by(username=new_user.username).first()
        progress = UserProgress.query.filter_by(user_id=user.id, exercise_id=new_exercise.id).first()
        
        assert progress.score == 1
        assert user.points == 10 # Points should remain 10

def test_streak_increment(client, new_user, new_exercise):
    """Test streak increment on consecutive days."""
    register(client, new_user.username, new_user.email, 'password123')
    
    with client.application.app_context():
        user = User.query.filter_by(username=new_user.username).first()
        # Simulate activity yesterday
        user.last_activity_date = date.today() - timedelta(days=1)
        user.current_streak = 1
        user.points = 0 # Reset points for clarity
        db.session.commit()

    # Submit exercise today
    client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    with client.application.app_context():
        user_reloaded = User.query.filter_by(username=new_user.username).first()
        assert user_reloaded.current_streak == 2
        assert user_reloaded.last_activity_date == date.today()

def test_streak_reset(client, new_user, new_exercise):
    """Test streak reset after a gap in activity."""
    register(client, new_user.username, new_user.email, 'password123')

    with client.application.app_context():
        user = User.query.filter_by(username=new_user.username).first()
        # Simulate activity 2 days ago
        user.last_activity_date = date.today() - timedelta(days=2)
        user.current_streak = 5 # Some old streak
        user.points = 0
        db.session.commit()

    # Submit exercise today
    client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    with client.application.app_context():
        user_reloaded = User.query.filter_by(username=new_user.username).first()
        assert user_reloaded.current_streak == 1 # Streak resets to 1
        assert user_reloaded.last_activity_date == date.today()

def test_streak_same_day_activity(client, new_user, new_exercise, new_lesson):
    """Test that multiple activities on the same day do not increment streak more than once."""
    register(client, new_user.username, new_user.email, 'password123')

    # First activity today
    client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    with client.application.app_context():
        user = User.query.filter_by(username=new_user.username).first()
        assert user.current_streak == 1
        assert user.last_activity_date == date.today()
        initial_points = user.points

    # Create another exercise for the same lesson to test a second submission
    with client.application.app_context():
        exercise2 = Exercise(
            lesson_id=new_lesson.id, # Same lesson as new_exercise
            exercise_type="multiple_choice",
            question="What is 2+2?",
            options='["2", "3", "4", "5"]',
            correct_answer="4"
        )
        db.session.add(exercise2)
        db.session.commit()
        exercise2_id = exercise2.id
    
    # Second activity on the same day
    client.post(url_for('submit_exercise', exercise_id=exercise2_id), data={
        'answer': "4"
    }, follow_redirects=True)

    with client.application.app_context():
        user_reloaded = User.query.filter_by(username=new_user.username).first()
        assert user_reloaded.current_streak == 1 # Streak remains 1
        assert user_reloaded.last_activity_date == date.today()
        assert user_reloaded.points == initial_points + 10 # Points should increase for new exercise


def test_lesson_completion_display(client, new_user, new_lesson, new_exercise):
    """Test that after completing all exercises in a lesson, a completion message is shown."""
    register(client, new_user.username, new_user.email, 'password123')

    # Submit the only exercise in the lesson
    client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    # View the lesson detail page again
    response = client.get(url_for('lesson_detail', lesson_id=new_lesson.id))
    assert response.status_code == 200
    assert b'Congratulations! You have completed all exercises for this lesson.' in response.data
    assert b'Next Exercise or Check Progress' not in response.data # No "Next Exercise" button if all done
    assert bytes(new_exercise.question, 'utf-8') not in response.data # The exercise form should not be there

def test_view_lesson_with_uncompleted_exercise(client, new_user, new_lesson, new_exercise):
    """Test viewing a lesson with an uncompleted exercise shows the exercise form."""
    register(client, new_user.username, new_user.email, 'password123')

    response = client.get(url_for('lesson_detail', lesson_id=new_lesson.id))
    assert response.status_code == 200
    assert bytes(new_exercise.question, 'utf-8') in response.data # Exercise question should be present
    assert b'Your Answer' in response.data # Form label
    assert b'Congratulations! You have completed all exercises for this lesson.' not in response.data
    assert b'Next Exercise or Check Progress' not in response.data # This appears after completing one

def test_view_lesson_after_completing_one_of_two_exercises(client, new_user, new_lesson, new_exercise):
    """Test viewing a lesson after completing one exercise, when another one exists."""
    register(client, new_user.username, new_user.email, 'password123')

    # Create a second exercise for the lesson
    with client.application.app_context():
        exercise2 = Exercise(
            lesson_id=new_lesson.id,
            exercise_type="multiple_choice",
            question="What is 3+3?",
            options='["3", "6", "9"]',
            correct_answer="6"
        )
        db.session.add(exercise2)
        db.session.commit()
        # Ensure new_exercise is ordered first if not already
        new_exercise.order = 1 # Assuming an 'order' field or relying on ID order
        exercise2.order = 2
        db.session.commit()


    # Submit the first exercise
    client.post(url_for('submit_exercise', exercise_id=new_exercise.id), data={
        'answer': new_exercise.correct_answer
    }, follow_redirects=True)

    # View the lesson detail page again
    response = client.get(url_for('lesson_detail', lesson_id=new_lesson.id))
    assert response.status_code == 200
    assert bytes(exercise2.question, 'utf-8') in response.data # Second exercise question should be present
    assert b'Your Answer' in response.data # Form label for the second exercise
    assert b'Congratulations! You have completed all exercises for this lesson.' not in response.data
    # The completed exercise (new_exercise) should not be shown as an active form
    assert bytes(new_exercise.question, 'utf-8') not in response.data

    # Check if the "Next Exercise or Check Progress" link is present for the first exercise
    # This test is a bit tricky because the template logic shows the *next* incomplete exercise.
    # The logic for "Next Exercise" link in lesson_detail.html:
    # `<a href="{{ url_for('lesson_detail', lesson_id=lesson.id) }}" class="btn">Next Exercise or Check Progress</a>`
    # This link appears when `user_progress and user_progress.completed` is true for the *current* exercise being displayed.
    # However, the page will automatically display the *next* incomplete exercise.
    # So, to test this link, we'd need to see the previous completed exercise's feedback.
    # The current template logic might not directly show the completed exercise details and then the next one.
    # It shows the *next available* exercise. Let's adjust test_lesson_completion_display.
    # For this test, we confirm the *next* exercise is shown.
    assert b'Next Exercise or Check Progress' not in response.data # Because we are on the *next* exercise's form.

    # Let's refine the test_lesson_completion_display to be more specific
    # and add a test for when a completed exercise is re-visited (not directly possible with current nav)
    # The current flow is: complete -> page reloads -> shows next exercise or completion message.
    # So, the "Next Exercise or Check Progress" link is more of a "Refresh to see next/progress" button.
    # The template logic is `{% if user_progress and user_progress.completed %}` for the *current* `exercise` variable.
    # This means if we are *on* an exercise that is completed, that link appears.
    # If we have completed exercise 1, and exercise 2 is available, the page loads with exercise 2.
    # The `exercise` variable in the template will be exercise 2, which is not yet completed.
    # So the "Next Exercise" button as implemented (for a *completed* exercise) won't show in this flow.

    # Let's verify the user progress for the first exercise
    with client.application.app_context():
        progress1 = UserProgress.query.filter_by(user_id=new_user.id, exercise_id=new_exercise.id).first()
        assert progress1 is not None
        assert progress1.completed is True

        progress2 = UserProgress.query.filter_by(user_id=new_user.id, exercise_id=exercise2.id).first()
        assert progress2 is None # Not yet attempted
```
