import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Car, ShoppingCart, TrendingUp, Loader2, Calendar as CalendarIcon, Filter, Warehouse, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-date-range';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { getSettings } from '@/utils/db/settings';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const StatCard = ({ title, value, icon, description, isLoading }) => (
  <Card className="bg-secondary/50 hover:bg-secondary/70 transition-colors duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [stats, setStats] = useState({
    totalpurchaseqty: 0,
    registeredsaleqty: 0,
    nonregisteredsaleqty: 0,
    totalsaleqty: 0,
    totalcustomers: 0,
  });
  const [stockCount, setStockCount] = useState(0);
  const [openBookingsCount, setOpenBookingsCount] = useState(0);
  const [salesByPerson, setSalesByPerson] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSalesperson, setLoadingSalesperson] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [dateRange, setDateRange] = useState([
    {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      key: 'selection'
    }
  ]);
  const [partyNames, setPartyNames] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      try {
        const settings = await getSettings();
        setCompanyName(settings?.companyName || 'Dashboard');
      } catch (error) {
        console.error('Error fetching company name:', error);
      }

      try {
        const { data, error } = await supabase
          .from('purchases')
          .select('party_name')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const uniqueParties = [...new Set(data.map(item => item.party_name))];
        setPartyNames(uniqueParties);
      } catch (error) {
        console.error('Error fetching party names:', error);
      }
    };

    fetchInitialData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoadingStats(true);
    setLoadingSalesperson(true);
    setLoadingStock(true);
    setLoadingBookings(true);

    const startDate = format(dateRange[0].startDate, 'yyyy-MM-dd');
    const endDate = format(dateRange[0].endDate, 'yyyy-MM-dd');

    // Fetch dashboard stats
    const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats', {
      p_user_id: user.id,
      p_start_date: startDate,
      p_end_date: endDate,
      p_party_names: selectedParties.length > 0 ? selectedParties : null,
    });

    if (statsError) {
      toast({ title: 'Error fetching stats', description: statsError.message, variant: 'destructive' });
      setStats({ totalpurchaseqty: 0, registeredsaleqty: 0, nonregisteredsaleqty: 0, totalsaleqty: 0, totalcustomers: 0 });
    } else {
      setStats(statsData[0] || { totalpurchaseqty: 0, registeredsaleqty: 0, nonregisteredsaleqty: 0, totalsaleqty: 0, totalcustomers: 0 });
    }
    setLoadingStats(false);

    // Fetch sales by salesperson
    const { data: salesData, error: salesError } = await supabase.rpc('get_sales_by_salesperson', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (salesError) {
      toast({ title: 'Error fetching salesperson data', description: salesError.message, variant: 'destructive' });
      setSalesByPerson([]);
    } else {
      setSalesByPerson(salesData || []);
    }
    setLoadingSalesperson(false);

    // Fetch stock count
    const { count: stockDataCount, error: stockError } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (stockError) {
      toast({ title: 'Error fetching stock count', description: stockError.message, variant: 'destructive' });
      setStockCount(0);
    } else {
      setStockCount(stockDataCount || 0);
    }
    setLoadingStock(false);

    // Fetch open bookings count
    const { count: bookingsCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'Open');

    if (bookingsError) {
      toast({ title: 'Error fetching open bookings', description: bookingsError.message, variant: 'destructive' });
      setOpenBookingsCount(0);
    } else {
      setOpenBookingsCount(bookingsCount || 0);
    }
    setLoadingBookings(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, dateRange, selectedParties, toast]);

  const totalSalesByPerson = useMemo(() => {
    return salesByPerson.reduce((acc, curr) => acc + (curr.sales_count || 0), 0);
  }, [salesByPerson]);

  return (
    <>
      <Helmet>
        <title>Dashboard - {companyName}</title>
        <meta name="description" content={`Dashboard for ${companyName} with key performance indicators.`} />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-3xl font-bold">{companyName}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange[0].startDate, "dd LLL, y")} - {format(dateRange[0].endDate, "dd LLL, y")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <DateRange
                  editableDateInputs={true}
                  onChange={item => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter by Party</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Party Names</h4>
                  <div className="max-h-48 overflow-y-auto">
                    {partyNames.map(party => (
                      <div key={party} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`party-${party}`}
                          checked={selectedParties.includes(party)}
                          onChange={() => {
                            setSelectedParties(prev => 
                              prev.includes(party) 
                                ? prev.filter(p => p !== party)
                                : [...prev, party]
                            );
                          }}
                        />
                        <label htmlFor={`party-${party}`}>{party}</label>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" onClick={() => setSelectedParties([])} variant="ghost">Clear All</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Total Purchase" value={stats.totalpurchaseqty} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} description="Vehicles purchased" isLoading={loadingStats} />
          <StatCard title="Registered Sale" value={stats.registeredsaleqty} icon={<Car className="h-4 w-4 text-muted-foreground" />} description="Sales to registered customers" isLoading={loadingStats} />
          <StatCard title="Non-Registered Sale" value={stats.nonregisteredsaleqty} icon={<Car className="h-4 w-4 text-muted-foreground" />} description="Sales to non-registered customers" isLoading={loadingStats} />
          <StatCard title="Total Sale" value={stats.totalsaleqty} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} description="Total vehicles sold" isLoading={loadingStats} />
          <StatCard title="Vehicle Stock" value={stockCount} icon={<Warehouse className="h-4 w-4 text-muted-foreground" />} description="Vehicles in stock" isLoading={loadingStock} />
          <StatCard title="Open Bookings" value={openBookingsCount} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} description="Currently open bookings" isLoading={loadingBookings} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Person Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSalesperson ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : salesByPerson.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Person</TableHead>
                    <TableHead className="text-right">Vehicles Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByPerson.map((sale, index) => (
                    <TableRow key={index}>
                      <TableCell>{sale.sales_person_name}</TableCell>
                      <TableCell className="text-right">{sale.sales_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{totalSalesByPerson}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sales data for this period.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default Dashboard;