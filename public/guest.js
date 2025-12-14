(function() {    const currentEmail = localStorage.getItem('userEmail');

    if (!currentEmail) {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        localStorage.setItem('userEmail', guestId);
        console.log('✅ Guest Mode Activated:', guestId);
    }

    localStorage.removeItem('userRole'); 
})();