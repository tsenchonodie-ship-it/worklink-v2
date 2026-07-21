const express = require('express');
const router = express.Router();

router.get('/worker/dashboard', (req, res) => {
  res.json({
    overview: {
      todaysJobs: 3,
      upcomingBookings: 5,
      monthlyEarnings: 18000,
      completedJobs: 12,
    },
    bookings: [
      {
        id: 101,
        status: 'confirmed',
        booking_date: '2026-07-21',
        booking_time: '10:00',
        category: { name: 'Plumbing' },
        customer: { full_name: 'Aisha Khan' },
      },
      {
        id: 102,
        status: 'pending',
        booking_date: '2026-07-22',
        booking_time: '14:30',
        category: { name: 'Electrical' },
        customer: { full_name: 'Meera Rao' },
      },
    ],
    notifications: [
      { id: 1, title: 'New booking', message: 'A new job request is waiting for approval.', type: 'announcement' },
      { id: 2, title: 'Reminder', message: 'Please confirm your upcoming service.', type: 'reminder' },
    ],
    reviews: [
      { id: 1, comment: 'Very reliable and punctual.', rating: 5 },
    ],
  });
});

module.exports = router;
