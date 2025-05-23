from app.extensions import db # Import db from extensions
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON # In case we switch to PostgreSQL

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False) # Increased length for stronger hashes
    email = db.Column(db.String(120), unique=True, nullable=False)
    points = db.Column(db.Integer, default=0) # Points for gamification
    current_streak = db.Column(db.Integer, default=0) # Current activity streak
    last_activity_date = db.Column(db.Date, nullable=True) # Last date of activity for streak
    progress = db.relationship('UserProgress', backref='user', lazy=True)

    # Flask-Login integration
    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    lessons = db.relationship('Lesson', backref='course', lazy=True)

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text) # This could be markdown or HTML
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    order = db.Column(db.Integer)
    exercises = db.relationship('Exercise', backref='lesson', lazy=True)
    progress = db.relationship('UserProgress', backref='lesson', lazy=True)


class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    exercise_type = db.Column(db.String(50), nullable=False) # e.g., 'multiple_choice', 'fill_in_the_blank'
    question = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON) # Store as JSON string
    correct_answer = db.Column(db.String(255), nullable=False)
    progress = db.relationship('UserProgress', backref='exercise', lazy=True)


class UserProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercise.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    score = db.Column(db.Integer, nullable=True)
    last_attempt_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    last_answer = db.Column(db.String(255), nullable=True) # To store the user's last submitted answer

    def __repr__(self):
        return f'<UserProgress user_id={self.user_id} lesson_id={self.lesson_id} exercise_id={self.exercise_id} completed={self.completed}>'
