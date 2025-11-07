document.addEventListener('DOMContentLoaded', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    
    if (!scrollButton) {
        return;
    }
    
    scrollButton.classList.remove('show');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollBottom = documentHeight - (scrollTop + windowHeight);
        
        if (scrollBottom <= 350) {
            scrollButton.classList.add('show');
        } else {
            scrollButton.classList.remove('show');
        }
    });
    
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

//---------------------------------

document.addEventListener('DOMContentLoaded', function() {
    
    const galleryImages = document.querySelectorAll('.project-image img');
    
    galleryImages.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            openModal(this);
        });
    });

    const modal = document.getElementById('imageModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

let currentScale = 1;
const scaleStep = 0.2;
const minScale = 0.5;
const maxScale = 3;

function openModal(img) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    
    modal.style.display = 'block';
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    
    currentScale = 1;
    modalImg.style.transform = 'translateY(-50%) scale(1)';
    
    modal.classList.add('fade-in');
    modalImg.classList.add('zoom-in');
    
    modalImg.addEventListener('wheel', handleWheelZoom);

    setTimeout(() => {
        modal.classList.remove('fade-in');
        modalImg.classList.remove('zoom-in');
    }, 300);

}

function handleWheelZoom(e) {
    e.preventDefault();
    
    if (e.deltaY < 0) {
        zoomIn();
    } else {
        zoomOut();
    }
}

function zoomIn() {
    if (currentScale < maxScale) {
        currentScale += scaleStep;
        updateZoom();
    }
}

function zoomOut() {
    if (currentScale > minScale) {
        currentScale -= scaleStep;
        updateZoom();
    }
}

function updateZoom() {
    const modalImg = document.getElementById('modalImage');
    modalImg.style.transform = `translateY(-50%) scale(${currentScale})`;
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    
    modal.style.display = 'none';
    modalImg.src = '';
    
    currentScale = 1;
}

// ---------------------------

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMobileMenu = document.getElementById('closeMobileMenu');

mobileMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; 
});

closeMobileMenu.addEventListener('click', function() {
    mobileMenu.classList.remove('active');
    document.body.style.overflow = ''; 
});

mobileMenu.addEventListener('click', function(e) {
    if (e.target === mobileMenu) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});