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
            '<i class="fas fa-times" style="color: #D32F2F;"></i>' : 
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

    // Page navigation system
    const pageLinks = document.querySelectorAll('.nav-link, .page-link');
    const pageSections = document.querySelectorAll('.page-section');
    
    // Function to show a specific page and hide others
    function showPage(pageId) {
        // Hide all pages
        pageSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected page
        const selectedPage = document.getElementById(pageId);
        if (selectedPage) {
            selectedPage.classList.add('active');
            
            // Update active state in navigation
            pageLinks.forEach(link => {
                if (link.getAttribute('data-page') === pageId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Update URL hash
            window.location.hash = pageId;
        }
    }
    
    // Add click event listeners to all page links
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
            
            // Close mobile menu if open
            if (navbar.classList.contains('show')) {
                navbar.classList.remove('show');
                body.style.overflow = '';
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                mobileMenuBtn.classList.remove('active');
            }
        });
    });
    
    // Check URL hash on load to navigate to the correct page
    function checkHash() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            showPage(hash);
        } else {
            // Default to home page
            showPage('home');
        }
    }
    
    // Check hash when page loads
    checkHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);

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

    // Add contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Here you would typically handle the form submission
            alert('شكراً لتواصلك معنا. سنرد عليك قريباً.');
            contactForm.reset();
        });
    }

    // Highlight active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinksForActive = document.querySelectorAll('nav ul li a');
    navLinksForActive.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Add console check to ensure the script is loading properly on GitHub Pages
    console.log('CZ emballage script loaded successfully');
    
    // Add a check for GitHub Pages environment
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
        console.log('Running on GitHub Pages');
        // Make any GitHub Pages specific adjustments here if needed
    }
});
