import React from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet-async';
import Bookings from '@/components/Bookings/Bookings';

const BookingsPage = () => {
  return (
    <>
      <Helmet>
        <title>Booking Management - Ashwheel</title>
        <meta name="description" content="Manage all your vehicle bookings, track statuses, and analyze booking data with powerful filtering and reporting tools." />
      </Helmet>
      <Bookings />
    </>
  );
};

export default BookingsPage;