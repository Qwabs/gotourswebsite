// Sample tour data

const tours = [
    { id: 'grand-canyon', name: 'Grand Canyon Explorer', duration: '3 days', price: 249, description: 'Guided hiking with national park entry, 2 nights lodge, meals.', image: 'https://via.placeholder.com/300x200?text=Grand+Canyon' },
    { id: 'safari-sunrise', name: 'Safari Sunrise', duration: '5 days', price: 825, description: 'Full safari experience with professional guide, tents, all terrain vehicle.', image: 'https://via.placeholder.com/300x200?text=Safari+Sunrise' },
    { id: 'island-getaway', name: 'Island Getaway', duration: '4 days', price: 680, description: 'Beach resort stay, island hopping and snorkeling package.', image: 'https://via.placeholder.com/300x200?text=Island+Getaway' },
    { id: 'northern-lights', name: 'Northern Lights Adventure', duration: '6 days', price: 1199, description: 'Aurora viewing, cozy cabin, expert photographer coach.', image: 'https://via.placeholder.com/300x200?text=Northern+Lights' },
    { id: 'alps-hiking', name: 'Alps Hiking Adventure', duration: '7 days', price: 950, description: 'Scenic hikes in the Swiss Alps with mountain guides and chalet stays.', image: 'https://via.placeholder.com/300x200?text=Alps+Hiking' },
    { id: 'amazon-rainforest', name: 'Amazon Rainforest Expedition', duration: '5 days', price: 720, description: 'Explore the Amazon with indigenous guides, wildlife spotting, and eco-lodges.', image: 'https://via.placeholder.com/300x200?text=Amazon+Rainforest' },
    { id: 'great-wall', name: 'Great Wall Trek', duration: '4 days', price: 550, description: 'Walk the ancient Great Wall of China with cultural insights and Beijing tours.', image: 'https://via.placeholder.com/300x200?text=Great+Wall' },
   
];

const tourCards = document.getElementById('tourCards');
const tourSelect = document.getElementById('tourSelect');
const bookingForm = document.getElementById('bookingForm');
const bookingSummary = document.getElementById('bookingSummary');
const clearBtn = document.getElementById('clearBtn');

function renderTours() {
    tourCards.innerHTML = tours.map(tour => `
        <article class="card tour-card">
            <img src="${tour.image}" alt="${tour.name}" class="tour-image">
            <h3>${tour.name}</h3>
            <p>${tour.description}</p>
            <p><strong>Duration:</strong> ${tour.duration}</p>
            <p><strong>From:</strong> $${tour.price.toFixed(2)}</p>
        </article>
    `).join('');

    tourSelect.innerHTML = '<option value="" disabled selected>Select a tour</option>' +
        tours.map(tour => `<option value="${tour.id}">${tour.name} - $${tour.price}</option>`).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'});
}

// Show booking summary with discount logic
function showBookingSummary(data) {
    const tourName = data.tourName || 'Unknown Tour';
    const baseTotal = data.baseTotal || 0;
    const discount = data.discount || 0;
    const total = data.total || baseTotal - discount;
    const discountMessage = discount > 0 ? `10% group discount applied` : `No discount applied`;

    bookingSummary.innerHTML = `
        <div class="card">
            <h3>Thank you, ${data.name}!</h3>
            <p>Your booking for <strong>${tourName}</strong> on <strong>${formatDate(data.startDate)}</strong> is confirmed.</p>
            <p><strong>Guests:</strong> ${data.guests}</p>
            <p><strong>Contact:</strong> ${data.email} | ${data.phone}</p>
            <p><strong>Base total:</strong> $${baseTotal.toFixed(2)}</p>
            <p><strong>Discount:</strong> ${discountMessage} (-$${discount.toFixed(2)})</p>
            <p><strong>Total after discount:</strong> $${total.toFixed(2)}</p>
            <p>We will contact you shortly with final details.</p>
        </div>
    `;
}

// Handle the form submission

bookingForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(bookingForm);
    const values = {
        tour: formData.get('tour'),
        startDate: formData.get('startDate'),
        guests: Number(formData.get('guests')),
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
    };

    const isTourValid = !!values.tour;
    const isDateValid = !!values.startDate;
    const isGuestsValid = values.guests > 0;
    const isNameValid = values.name.length > 0;
    const isEmailValid = values.email.length > 0;
    const isPhoneValid = values.phone.length > 0;

    if (!isTourValid || !isDateValid || !isGuestsValid || !isNameValid || !isEmailValid || !isPhoneValid) {
        alert('Please complete all booking details, including name, email, and phone number.');
        return;
    }

    // Calculate pricing on client-side
    const tour = tours.find(t => t.id === values.tour);
    const baseTotal = tour.price * values.guests;
    const discount = values.guests > 10 ? Number((baseTotal * 0.1).toFixed(2)) : 0;
    const total = baseTotal - discount;

    const booking = {
        ...values,
        tourName: tour.name,
        baseTotal,
        discount,
        total,
        booked_at: new Date().toLocaleString()
    };

    showBookingSummary(booking);
    localStorage.setItem('lastBooking', JSON.stringify(booking));
    bookingForm.reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').setAttribute('min', today);
    alert('Booking confirmed! Your booking has been saved.');
});

// Clear booking summary and reset form
clearBtn.addEventListener('click', () => {
    bookingForm.reset();
    bookingSummary.textContent = 'No booking yet. Fill out the form above.';
    localStorage.removeItem('lastBooking');
});

function loadLastBooking() {
    const stored = localStorage.getItem('lastBooking');
    if (stored) {
        const booking = JSON.parse(stored);
        showBookingSummary(booking);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    renderTours();
    loadLastBooking();
});
