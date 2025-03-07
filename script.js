document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navbar = document.getElementById('navbar');
    const body = document.body;

    // Toggle mobile menu with animation
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        navbar.classList.toggle('show');
        body.style.overflow = navbar.classList.contains('show') ? 'hidden' : '';
        this.innerHTML = navbar.classList.contains('show') ? 
            '<i class="fas fa-times"></i>' : 
            '<i class="fas fa-bars"></i>';
        
        // Add animation effect
        if (navbar.classList.contains('show')) {
            this.classList.add('active');
        } else {
            this.classList.remove('active');
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navbar.classList.contains('show') && 
            !navbar.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            navbar.classList.remove('show');
            body.style.overflow = '';
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            mobileMenuBtn.classList.remove('active');
        }
    });

    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navbar.classList.contains('show')) {
                navbar.classList.remove('show');
                body.style.overflow = '';
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                mobileMenuBtn.classList.remove('active');
            }
        });
    });

    // Improved header scroll behavior
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const header = document.querySelector('header');
        
        if (currentScroll > lastScroll && currentScroll > 150) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
            
            // Add shadow when scrolled
            if (currentScroll > 10) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        }
        lastScroll = currentScroll;
    });

    // Add active class to nav links based on current section
    function updateActiveNavLink() {
        const navLinks = document.querySelectorAll('nav ul li a');
        // For now, we just keep the home link active
        // This would be expanded with actual section detection in a full site
    }
    
    // Initialize active link
    updateActiveNavLink();
});
