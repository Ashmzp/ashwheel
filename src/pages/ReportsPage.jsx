import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { History, Car, Wrench, Users, BarChart3 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockReports from '@/components/Reports/StockReports';
import TrackVehicle from '@/components/Reports/TrackVehicle';
import TrackJobCard from '@/components/Reports/TrackJobCard';
import PartyWiseSaleReport from '@/components/Reports/PartyWiseSaleReport';
import MISReport from '@/components/Reports/MISReport';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import useReportStore from '@/stores/reportStore';

const ReportsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const { activeMainTab, setActiveMainTab } = useReportStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view && view !== activeMainTab) {
      setActiveMainTab(view);
    } else if (!view) {
      navigate(`?view=${activeMainTab}`, { replace: true });
    }
  }, [location.search, activeMainTab, setActiveMainTab, navigate]);

  const handleTabChange = (newTab) => {
    setActiveMainTab(newTab);
    navigate(`?view=${newTab}`, { replace: true });
  };

  const availableTabs = [
    { value: 'stock', label: 'Stock Reports', icon: History, component: <StockReports /> },
    { value: 'party-wise-sale', label: 'Party Wise Sale', icon: Users, component: <PartyWiseSaleReport /> },
    { value: 'track-vehicle', label: 'Track Vehicle', icon: Car, component: <TrackVehicle /> },
    { value: 'track-job-card', label: 'Track Job Card', icon: Wrench, component: <TrackJobCard /> },
    { value: 'mis-report', label: 'MIS Report', icon: BarChart3, component: <MISReport />, access: 'mis_report' },
  ];

  const accessibleTabs = availableTabs.filter(tab => !tab.access || canAccess(tab.access, 'read'));

  return (
    <>
      <Helmet>
        <title>Reports - Showroom Pro</title>
        <meta name="description" content="View and analyze real-time stock reports and track vehicle history." />
      </Helmet>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Tabs value={activeMainTab} onValueChange={handleTabChange}>
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              {accessibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <tab.icon className="mr-2 h-4 w-4" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {accessibleTabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

export default ReportsPage;