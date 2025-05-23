import pytest
from app.app import create_app, db
from app.models import User, Course, Lesson, Exercise, UserProgress

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # Use in-memory SQLite for tests
        "WTF_CSRF_ENABLED": False,  # Disable CSRF for testing forms
        "LOGIN_DISABLED": False, # Ensure login is enabled for auth tests
        "SERVER_NAME": "localhost.localdomain" # Required for url_for outside of request context
    })

    with app.app_context():
        db.create_all()
        yield app # Teardown is handled after all tests in the session are done
        db.drop_all()

@pytest.fixture()
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture()
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()

@pytest.fixture(scope='function')
def init_database(app):
    """Fixture to create and teardown database for each test function."""
    with app.app_context():
        db.create_all()
        yield db # provide the db object to tests
        db.session.remove() # remove session
        db.drop_all() # clear all data

@pytest.fixture(scope='function')
def new_user(init_database):
    """Fixture to create a new user."""
    with init_database.app.app_context():
        user = User(username='testuser', email='test@example.com', password_hash='hashedpassword')
        init_database.session.add(user)
        init_database.session.commit()
        return user

@pytest.fixture(scope='function')
def new_course(init_database):
    """Fixture to create a new course."""
    with init_database.app.app_context():
        course = Course(title="Test Course", description="A course for testing.")
        init_database.session.add(course)
        init_database.session.commit()
        return course

@pytest.fixture(scope='function')
def new_lesson(init_database, new_course):
    """Fixture to create a new lesson associated with new_course."""
    with init_database.app.app_context():
        lesson = Lesson(title="Test Lesson", content="<p>Test lesson content.</p>", course_id=new_course.id, order=1)
        init_database.session.add(lesson)
        init_database.session.commit()
        return lesson

@pytest.fixture(scope='function')
def new_exercise(init_database, new_lesson):
    """Fixture to create a new multiple-choice exercise associated with new_lesson."""
    with init_database.app.app_context():
        exercise = Exercise(
            lesson_id=new_lesson.id,
            exercise_type="multiple_choice",
            question="What is 1+1?",
            options='["1", "2", "3", "4"]',
            correct_answer="2"
        )
        init_database.session.add(exercise)
        init_database.session.commit()
        return exercise
