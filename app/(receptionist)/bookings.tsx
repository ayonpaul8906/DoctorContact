import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Legacy Bookings route redirected to Appointments screen.
 */
export default function ReceptionistBookingsRedirect() {
  return <Redirect href="/(receptionist)/appointments" />;
}
