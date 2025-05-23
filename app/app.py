from flask import Flask, render_template, redirect, url_for, flash
from app.extensions import db
from app.models import User # Import User model
from app.forms import RegistrationForm, LoginForm # Import forms
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import os
import json # Added for parsing exercise options
from datetime import date, timedelta # For streak logic

login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key') # Add a secret key
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'login' # Set the login view

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    with app.app_context():
        from app.models import Course, Lesson, Exercise, UserProgress # Other models
        db.create_all()
        # Call function to populate DB with sample data
        populate_sample_data()

    @app.route('/')
    def home():
        return render_template('index.html') # Assuming you'll create an index.html

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        form = RegistrationForm()
        if form.validate_on_submit():
            hashed_password = generate_password_hash(form.password.data)
            user = User(username=form.username.data, email=form.email.data, password_hash=hashed_password)
            db.session.add(user)
            db.session.commit()
            flash('Your account has been created! You are now able to log in', 'success')
            login_user(user) # Log in user automatically
            return redirect(url_for('dashboard'))
        return render_template('register.html', form=form)

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        form = LoginForm()
        if form.validate_on_submit():
            user = User.query.filter_by(email=form.email.data).first()
            if user and check_password_hash(user.password_hash, form.password.data):
                login_user(user, remember=form.remember.data)
                flash('Login successful!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Login Unsuccessful. Please check email and password', 'danger')
        return render_template('login.html', form=form)

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('You have been logged out.', 'info')
        return redirect(url_for('home'))

    @app.route('/dashboard')
    @login_required
    def dashboard():
        return render_template('dashboard.html')

    @app.route('/courses')
    @login_required
    def courses():
        all_courses = Course.query.all()
        return render_template('courses.html', courses=all_courses)

    @app.route('/course/<int:course_id>')
    @login_required
    def course_detail(course_id):
        course = Course.query.get_or_404(course_id)
        lessons = Lesson.query.filter_by(course_id=course.id).order_by(Lesson.order).all()
        return render_template('course_detail.html', course=course, lessons=lessons)

    @app.route('/lesson/<int:lesson_id>', methods=['GET', 'POST']) # Allow POST for form submission if done on same page
    @login_required
    def lesson_detail(lesson_id):
        lesson = Lesson.query.get_or_404(lesson_id)
        # Fetch all exercises for the lesson, ordered
        all_exercises = Exercise.query.filter_by(lesson_id=lesson.id).order_by(Exercise.id).all()
        
        next_exercise = None
        last_completed_exercise_id = -1 # To track if we are on the last exercise

        for exercise_obj in all_exercises:
            user_progress = UserProgress.query.filter_by(
                user_id=current_user.id, 
                lesson_id=lesson.id, 
                exercise_id=exercise_obj.id,
                completed=True 
            ).first()
            if not user_progress:
                next_exercise = exercise_obj
                break
            last_completed_exercise_id = exercise_obj.id
        
        form = None
        user_progress_for_current_exercise = None
        lesson_complete = (next_exercise is None and len(all_exercises) > 0)

        if next_exercise:
            user_progress_for_current_exercise = UserProgress.query.filter_by(
                user_id=current_user.id,
                exercise_id=next_exercise.id
            ).first() # Fetch any attempt, even if not completed

            form = MultipleChoiceExerciseForm()
            try:
                options_list = json.loads(next_exercise.options) # Parse JSON string
                form.answer.choices = [(opt, opt) for opt in options_list]
            except json.JSONDecodeError:
                form.answer.choices = []
                flash("Error loading exercise options.", "danger")
        
        return render_template('lesson_detail.html', lesson=lesson, exercise=next_exercise, 
                               form=form, user_progress=user_progress_for_current_exercise,
                               lesson_complete=lesson_complete, last_completed_exercise_id=last_completed_exercise_id)

    @app.route('/submit_exercise/<int:exercise_id>', methods=['POST'])
    @login_required
    def submit_exercise(exercise_id):
        exercise = Exercise.query.get_or_404(exercise_id)
        lesson = Lesson.query.get_or_404(exercise.lesson_id) # Get lesson for redirect
        form = MultipleChoiceExerciseForm()
        
        try:
            options_list = json.loads(exercise.options)
            form.answer.choices = [(opt, opt) for opt in options_list]
        except json.JSONDecodeError:
            flash("Error processing exercise options during submission.", "danger")
            return redirect(url_for('lesson_detail', lesson_id=lesson.id))

        if form.validate_on_submit():
            submitted_answer = form.answer.data
            is_correct = (submitted_answer == exercise.correct_answer)
            score = 1 if is_correct else 0

            user_progress = UserProgress.query.filter_by(
                user_id=current_user.id,
                exercise_id=exercise.id
            ).first()

            awarded_new_points = False
            if user_progress:
                # Check if points should be awarded (correct answer and previously not scored or score was 0)
                if is_correct and (user_progress.score is None or user_progress.score == 0):
                    current_user.points = (current_user.points or 0) + 10 # Award 10 points
                    awarded_new_points = True
                
                user_progress.completed = True
                user_progress.score = score
                user_progress.last_answer = submitted_answer
                user_progress.last_attempt_at = db.func.now()
            else: # First attempt
                user_progress = UserProgress(
                    user_id=current_user.id,
                    lesson_id=lesson.id,
                    exercise_id=exercise.id,
                    completed=True,
                    score=score,
                    last_answer=submitted_answer
                )
                db.session.add(user_progress)
                if is_correct:
                    current_user.points = (current_user.points or 0) + 10 # Award 10 points
                    awarded_new_points = True
            
            # Update streak if the exercise was completed (regardless of first time correct)
            if user_progress.completed: # user_progress.completed is set to True above
                update_streak(current_user)

            db.session.commit()

            if is_correct:
                flash_message = 'Correct!'
                if awarded_new_points:
                    flash_message += ' You earned 10 points!'
                flash(flash_message, 'success')
            else:
                flash(f'Incorrect. The correct answer was: {exercise.correct_answer}', 'danger')
            
            return redirect(url_for('lesson_detail', lesson_id=lesson.id))
        else:
            # If form validation fails, re-render the lesson page with errors
            # This requires fetching the exercise and form setup again, similar to lesson_detail GET
            flash('Submission error. Please select an option.', 'warning')
            return redirect(url_for('lesson_detail', lesson_id=lesson.id))

    return app

def update_streak(user):
    today = date.today()
    if user.last_activity_date:
        if user.last_activity_date == today:
            # Already active today, do nothing to streak
            pass
        elif user.last_activity_date == today - timedelta(days=1):
            # Active yesterday, increment streak
            user.current_streak = (user.current_streak or 0) + 1
        else:
            # Gap in activity or first activity after a while
            user.current_streak = 1
    else:
        # First activity ever
        user.current_streak = 1
    
    user.last_activity_date = today
    # db.session.commit() # Commit is handled in the calling route after this function

def populate_sample_data():
    # Course 1: Introduction to Python
    course1_title = "Introduction to Python"
    course1 = Course.query.filter_by(title=course1_title).first()
    if not course1:
        course1 = Course(title=course1_title, description="Learn the fundamentals of Python programming.")
        db.session.add(course1)
        db.session.commit() # Commit course first to get ID

        lesson1_1 = Lesson(title="Variables and Data Types", content="<p>Content for Variables and Data Types.</p>", course_id=course1.id, order=1)
        lesson1_2 = Lesson(title="Control Flow (If/Else, Loops)", content="<p>Content for Control Flow.</p>", course_id=course1.id, order=2)
        db.session.add_all([lesson1_1, lesson1_2])
        db.session.flush() # Use flush to get IDs before full commit if needed, or commit as before.

        # Exercise for Lesson 1.1
        exercise1_1_1_question = "Which of the following is a valid Python variable name?"
        exercise1_1_1 = Exercise.query.filter_by(question=exercise1_1_1_question, lesson_id=lesson1_1.id).first()
        if not exercise1_1_1:
            exercise1_1_1 = Exercise(
                lesson_id=lesson1_1.id,
                exercise_type="multiple_choice",
                question=exercise1_1_1_question,
                options='["my-var", "1var", "my_var", "$var"]', # Stored as JSON string
                correct_answer="my_var"
            )
            db.session.add(exercise1_1_1)
        
        exercise1_1_2_question = "What is the data type of the value 10.5?"
        exercise1_1_2 = Exercise.query.filter_by(question=exercise1_1_2_question, lesson_id=lesson1_1.id).first()
        if not exercise1_1_2:
            exercise1_1_2 = Exercise(
                lesson_id=lesson1_1.id,
                exercise_type="multiple_choice",
                question=exercise1_1_2_question,
                options='["Integer", "Float", "String", "Boolean"]', # Stored as JSON string
                correct_answer="Float"
            )
            db.session.add(exercise1_1_2)


    # Course 2: Web Development Basics
    course2_title = "Web Development Basics"
    course2 = Course.query.filter_by(title=course2_title).first()
    if not course2:
        course2 = Course(title=course2_title, description="Understand the basics of HTML and CSS.")
        db.session.add(course2)
        db.session.commit() # Commit course first to get ID

        lesson2_1 = Lesson(title="HTML Fundamentals", content="<p>Content for HTML Fundamentals.</p>", course_id=course2.id, order=1)
        lesson2_2 = Lesson(title="CSS Basics", content="<p>Content for CSS Basics.</p>", course_id=course2.id, order=2)
        db.session.add_all([lesson2_1, lesson2_2])
        db.session.flush() # Use flush to get IDs before full commit if needed.

        # Exercise for Lesson 2.1
        exercise2_1_1_question = "Which HTML tag is used to define important text (bold)?"
        exercise2_1_1 = Exercise.query.filter_by(question=exercise2_1_1_question, lesson_id=lesson2_1.id).first()
        if not exercise2_1_1:
            exercise2_1_1 = Exercise(
                lesson_id=lesson2_1.id,
                exercise_type="multiple_choice",
                question=exercise2_1_1_question,
                options='["<b>", "<important>", "<strong>", "<i>"]', # Stored as JSON string
                correct_answer="<strong>"
            )
            db.session.add(exercise2_1_1)

    db.session.commit() # Final commit for all pending changes


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
