import React from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet-async';
import SettingsComponent from '@/components/Settings/Settings';

const SettingsPage = () => {

  return (
    <>
      <Helmet>
        <title>Settings - Showroom Pro</title>
        <meta name="description" content="Configure company details, invoice settings, and manage data." />
      </Helmet>
      <SettingsComponent />
    </>
  );
};

export default SettingsPage;