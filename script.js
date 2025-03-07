document.addEventListener('DOMContentLoaded', function() {
    // تفعيل القائمة المتجاوبة
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('nav ul li a');

    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        navbar.classList.toggle('show');
        // Toggle menu icon
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navbar.classList.remove('show');
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navbar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navbar.classList.remove('show');
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
        }
    });

    // تفعيل الروابط النشطة في القائمة
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // زر التمرير لأعلى
    const scrollTopBtn = document.getElementById('scroll-top');

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });

    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // تصغير القائمة عند التمرير
    const header = document.querySelector('header');

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 100) {
            header.style.padding = '10px 0';
        } else {
            header.style.padding = '15px 0';
        }
    });

    // تفعيل فلترة المنتجات
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // إزالة الكلاس النشط من جميع الأزرار
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // إضافة الكلاس النشط للزر المضغوط
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // عرض أو إخفاء المنتجات حسب الفلتر
            productCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // تفعيل سلايدر الشهادات
    const testimonialsSlider = document.getElementById('testimonials-slider');
    const testimonialItems = document.querySelectorAll('.testimonial-item');
    const prevBtn = document.getElementById('prev-testimonial');
    const nextBtn = document.getElementById('next-testimonial');
    
    let currentIndex = 0;

    // إخفاء جميع الشهادات ما عدا الأولى
    for (let i = 1; i < testimonialItems.length; i++) {
        testimonialItems[i].style.display = 'none';
    }

    // التنقل للشهادة التالية
    function nextTestimonial() {
        testimonialItems[currentIndex].style.display = 'none';
        currentIndex = (currentIndex + 1) % testimonialItems.length;
        testimonialItems[currentIndex].style.display = 'block';
    }

    // التنقل للشهادة السابقة
    function prevTestimonial() {
        testimonialItems[currentIndex].style.display = 'none';
        currentIndex = (currentIndex - 1 + testimonialItems.length) % testimonialItems.length;
        testimonialItems[currentIndex].style.display = 'block';
    }

    // إضافة الأحداث للأزرار
    nextBtn.addEventListener('click', nextTestimonial);
    prevBtn.addEventListener('click', prevTestimonial);

    // تبديل الشهادات تلقائياً كل 5 ثوان
    setInterval(nextTestimonial, 5000);

    // تفعيل الأكورديون للأسئلة الشائعة
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // إغلاق جميع العناصر المفتوحة
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            
            // تبديل حالة العنصر المضغوط
            item.classList.toggle('active');
        });
    });

    // معالجة نموذج الاتصال
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // الحصول على قيم النموذج
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const service = document.getElementById('service').value;
        const message = document.getElementById('message').value;

        // التحقق من صحة البيانات (يمكن إضافة المزيد من التحقق)
        if (!name || !email || !phone || !service || !message) {
            showFormMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // محاكاة إرسال النموذج
        showFormMessage('تم استلام رسالتك بنجاح. سنتواصل معك قريباً!', 'success');
        contactForm.reset();
    });

    // عرض رسائل النموذج
    function showFormMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        
        // إخفاء الرسالة بعد 5 ثوان
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }

    // Add image error handling function to replace broken images with fallback
    function handleImageErrors() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.onerror = function() {
                // Replace broken images with fallback SVG representation
                this.src = createFallbackBoxSVG();
            }
        });
    }
    
    function createFallbackBoxSVG() {
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="30" width="120" height="90" fill="#8B0000" stroke="#222222" stroke-width="2"/><line x1="40" y1="30" x2="160" y2="30" stroke="#222222" stroke-width="2"/><line x1="40" y1="120" x2="160" y2="120" stroke="#222222" stroke-width="2"/></svg>');
    }
    
    handleImageErrors();
});
