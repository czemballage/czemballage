document.addEventListener('DOMContentLoaded', function() {
    // تفعيل القائمة المتجاوبة
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbar = document.getElementById('navbar');

    mobileMenuBtn.addEventListener('click', function() {
        navbar.classList.toggle('show');
    });

    // تفعيل الروابط النشطة في القائمة
    const navLinks = document.querySelectorAll('nav ul li a');
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

    // تفعيل تأثيرات الظهور عند التمرير
    function revealSections() {
        const sections = document.querySelectorAll('.section-padding');
        
        const revealSection = function() {
            sections.forEach(section => {
                const sectionTop = section.getBoundingClientRect().top;
                const triggerPoint = window.innerHeight * 0.85;
                
                if (sectionTop < triggerPoint) {
                    section.classList.add('visible');
                }
            });
        };
        
        window.addEventListener('scroll', revealSection);
        revealSection(); // للتحقق من العناصر المرئية عند التحميل
    }
    
    revealSections();

    // إضافة تأثيرات ثلاثية الأبعاد عند التحريك بالماوس
    function add3DEffects() {
        const cards = document.querySelectorAll('.product-card, .service-card, .feature-item');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left; // موقع الماوس بالنسبة لعرض العنصر
                const y = e.clientY - rect.top; // موقع الماوس بالنسبة لارتفاع العنصر
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
                setTimeout(() => {
                    this.style.transition = 'transform 0.4s ease';
                }, 100);
            });
        });
    }
    
    add3DEffects();

    // تحسين محاكاة الصندوق ثلاثي الأبعاد
    function create3DBox() {
        const boxes = document.querySelectorAll('.hero-image svg, .about-image svg');
        
        boxes.forEach(box => {
            box.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 25;
                const rotateY = (centerX - x) / 25;
                
                this.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${-rotateY}deg) translateZ(50px)`;
            });
            
            box.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.transition = 'transform 0.6s ease';
            });
        });
    }
    
    create3DBox();

    // تحسين معالجة أخطاء الصور ليشمل SVG ثلاثي الأبعاد للصناديق
    function handleImageErrors() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.onerror = function() {
                // Replace broken images with 3D fallback SVG box
                this.src = createFallback3DBoxSVG();
            }
        });
    }
    
    function createFallback3DBoxSVG() {
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg"><polygon points="40,30 160,30 160,120 40,120" fill="#8B0000" stroke="#222222" stroke-width="2"/><polygon points="160,30 180,50 180,140 160,120" fill="#5c0000" stroke="#222222" stroke-width="2"/><polygon points="40,120 160,120 180,140 60,140" fill="#6b0000" stroke="#222222" stroke-width="2"/></svg>');
    }
    
    handleImageErrors();
});
