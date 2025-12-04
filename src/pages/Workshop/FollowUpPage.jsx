import React, { useState, useMemo, useEffect } from 'react';
import '@/styles/responsive.css';
import { Helmet } from 'react-helmet-async';
import { format, startOfToday } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/dateUtils';
import { useSettingsStore } from '@/stores/settingsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, PhoneCall, CheckCircle2, PhoneOutgoing, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateInput } from '@/components/ui/date-input';
import FollowUpModal from '@/components/Workshop/FollowUpModal';
import { exportToExcel } from '@/utils/excel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FollowUpItem = ({ item, onTakeFollowUp }) => {
    const isDone = item.remark || item.followed_up_by || item.next_follow_up_date || item.appointment_datetime;
    return (
        <Card className={`mb-4 border-l-4 ${isDone ? 'border-green-500' : 'border-blue-500'}`}>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-2 flex flex-col">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="font-semibold">{formatDate(item.source_date)}</span>
                    <span className={`text-xs font-bold ${item.source_type === 'Job Card' ? 'text-blue-600' : 'text-purple-600'}`}>{item.source_type}</span>
                </div>
                <div className="md:col-span-3 flex flex-col">
                    <span className="text-sm text-muted-foreground">Customer Details</span>
                    <span className="font-semibold">{item.customer_name}</span>
                    <div className="flex flex-col">
                        {item.mobile1 && (
                            <a href={`tel:${item.mobile1}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                <PhoneOutgoing size={14} /> {item.mobile1}
                            </a>
                        )}
                        {item.mobile2 && (
                            <a href={`tel:${item.mobile2}`} className="text-muted-foreground hover:underline flex items-center gap-1">
                                <PhoneOutgoing size={14} /> {item.mobile2}
                            </a>
                        )}
                    </div>
                </div>
                <div className="md:col-span-3 flex flex-col">
                    <span className="text-sm text-muted-foreground">Vehicle Details</span>
                    <span className="font-semibold">{item.model_name}</span>
                    <span>{item.chassis_no}</span>
                    <span>{item.reg_no || 'N/A'}</span>
                </div>
                <div className="md:col-span-2 flex flex-col">
                    <span className="text-sm text-muted-foreground">JC Details</span>
                    <span className="font-semibold">{item.job_type || 'N/A'}</span>
                    <span>{item.mechanic_name || 'N/A'}</span>
                    {item.kms_reading && <span className="text-xs">KMS: {item.kms_reading}</span>}
                </div>
                <div className="md:col-span-2 flex flex-col items-start md:items-end">
                    <span className="font-bold text-primary">Next Due: {formatDate(item.next_due_date)}</span>
                    <Button onClick={() => onTakeFollowUp(item)} size="sm" className="mt-2">
                        {isDone ? 'Update' : 'Take Follow-up'}
                    </Button>
                </div>
            </CardContent>
            {(item.remark || item.followed_up_by || item.leakage) && (
                <div className="border-t bg-muted/50 px-4 py-2 text-sm">
                    <p><span className="font-semibold">Last Remark:</span> {item.remark || 'N/A'}</p>
                    <p><span className="font-semibold">Followed By:</span> {item.followed_up_by || 'N/A'}</p>
                    {item.leakage && <p className="text-red-600"><span className="font-semibold">Leakage:</span> {item.leakage}</p>}
                </div>
            )}
        </Card>
    );
};

const FollowUpPage = () => {
    const todayStr = format(startOfToday(), 'yyyy-MM-dd');

    // Input State (Controlled by UI)
    const [dateRange, setDateRange] = useLocalStorage('followUpDateRange', { start: todayStr, end: todayStr });
    const [searchTerm, setSearchTerm] = useLocalStorage('followUpSearchTerm', '');
    const [customerType, setCustomerType] = useLocalStorage('followUpCustomerType', 'all');

    // Query State (Used for fetching) - Initialize with default values
    const [queryParams, setQueryParams] = useState({ dateRange: { start: todayStr, end: todayStr }, searchTerm: '', customerType: 'all' });
    const [activeTab, setActiveTab] = useLocalStorage('followUpActiveTab', 'all');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Report filters
    const [reportFilters, setReportFilters] = useState({
        source: 'all',
        status: 'all',
        remark: 'all',
        followedBy: 'all',
        searchText: ''
    });

    const pageSize = 100;
    const queryClient = useQueryClient();
    const { settings } = useSettingsStore();
    const { toast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);

    const followUpByList = useMemo(() => {
        const list = settings.workshop_settings?.follow_up_by_list || [];
        console.log('FollowUpPage - followUpByList:', list);
        console.log('FollowUpPage - settings:', settings);
        return list;
    }, [settings]);

    // Query Key depends on queryParams, not input state
    const queryKey = ['followUps', queryParams, activeTab, currentPage];

    const { data, isLoading, isPlaceholderData, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!queryParams) return { data: [], count: 0 };

            console.log('Fetching follow-ups:', queryParams);
            const { data, error } = await supabase.rpc('get_follow_ups_latest', {
                p_start_date: queryParams.dateRange.start,
                p_end_date: queryParams.dateRange.end,
                p_search_term: queryParams.searchTerm || '',
                p_customer_type: queryParams.customerType || 'all'
            });

            console.log('RPC Response - Data:', data);
            console.log('RPC Response - Error:', error);

            if (error) {
                console.error('RPC Error Details:', JSON.stringify(error, null, 2));
                toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
                throw error;
            }

            console.log('Raw data from DB:', data);
            console.log('Data length:', data?.length);
            return { data: data || [], count: data?.length || 0 };
        },
        enabled: !!queryParams, // Only fetch if queryParams are set (i.e., Search clicked)
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });

    const allFollowUps = data?.data || [];
    
    console.log('All follow-ups:', allFollowUps);
    console.log('All follow-ups length:', allFollowUps.length);
    
    // Get unique followed_by values for filter
    const uniqueFollowedBy = useMemo(() => {
        const values = new Set();
        allFollowUps.forEach(f => {
            if (f.followed_up_by) values.add(f.followed_up_by);
        });
        return Array.from(values).sort();
    }, [allFollowUps]);
    
    const stats = useMemo(() => {
        const leakage = allFollowUps.filter(f => f.leakage && f.leakage.trim() !== '').length;
        const nonLeakage = allFollowUps.filter(f => !f.leakage || f.leakage.trim() === '');
        const done = nonLeakage.filter(f => f.remark || f.followed_up_by || f.next_follow_up_date || f.appointment_datetime).length;
        const pending = nonLeakage.filter(f => !f.remark && !f.followed_up_by && !f.next_follow_up_date && !f.appointment_datetime).length;
        return { done, pending, leakage, total: nonLeakage.length };
    }, [allFollowUps]);
    
    const tabsData = useMemo(() => {
        const nonLeakage = allFollowUps.filter(f => !f.leakage || f.leakage.trim() === '');
        const result = {
            all: nonLeakage,
            pending: nonLeakage.filter(f => !f.remark && !f.followed_up_by && !f.next_follow_up_date && !f.appointment_datetime),
            done: nonLeakage.filter(f => f.remark || f.followed_up_by || f.next_follow_up_date || f.appointment_datetime),
            leakage: allFollowUps.filter(f => f.leakage && f.leakage.trim() !== ''),
        };
        console.log('Tabs data:', result);
        console.log('Active tab:', activeTab);
        console.log('Current tab data:', result[activeTab]);
        return result;
    }, [allFollowUps, activeTab]);
    
    const followUps = useMemo(() => {
        let filtered = tabsData[activeTab] || [];
        
        // Client-side search filter for better partial matching
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(f => 
                (f.customer_name && f.customer_name.toLowerCase().includes(term)) ||
                (f.mobile1 && f.mobile1.includes(term)) ||
                (f.mobile2 && f.mobile2.includes(term)) ||
                (f.chassis_no && f.chassis_no.toLowerCase().includes(term)) ||
                (f.reg_no && f.reg_no.toLowerCase().includes(term))
            );
        }
        
        return filtered;
    }, [tabsData, activeTab, searchTerm]);
    
    console.log('Final followUps for display:', followUps);
    const totalCount = followUps.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedFollowUps = followUps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSearch = () => {
        setCurrentPage(1);
        setQueryParams({
            dateRange,
            searchTerm,
            customerType
        });
    };

    const handleTakeFollowUp = (item) => {
        setSelectedFollowUp(item);
        setIsModalOpen(true);
    };

    const handleModalSave = () => {
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['followUps'] });
        refetch();
    };

    const handleExport = () => {
        const dataSource = activeTab === 'report' ? allFollowUps.filter(item => {
            // Apply same filters as report table
            if (reportFilters.source !== 'all' && item.source_type !== reportFilters.source) return false;
            if (reportFilters.status !== 'all') {
                const isDone = item.remark || item.followed_up_by || item.next_follow_up_date || item.appointment_datetime;
                const isLeakage = item.leakage && item.leakage.trim();
                if (reportFilters.status === 'leakage' && !isLeakage) return false;
                if (reportFilters.status === 'done' && (!isDone || isLeakage)) return false;
                if (reportFilters.status === 'pending' && (isDone || isLeakage)) return false;
            }
            if (reportFilters.remark !== 'all' && item.remark !== reportFilters.remark) return false;
            if (reportFilters.followedBy !== 'all' && item.followed_up_by !== reportFilters.followedBy) return false;
            if (reportFilters.searchText) {
                const search = reportFilters.searchText.toLowerCase();
                return (
                    item.customer_name?.toLowerCase().includes(search) ||
                    item.mobile1?.includes(search) ||
                    item.model_name?.toLowerCase().includes(search) ||
                    item.chassis_no?.toLowerCase().includes(search) ||
                    item.reg_no?.toLowerCase().includes(search)
                );
            }
            return true;
        }) : followUps;
        
        if (dataSource.length === 0) {
            toast({ title: "No data", description: "No data to export in the current view.", variant: "destructive" });
            return;
        }
        const dataToExport = dataSource.map(f => ({
            "Source Type": f.source_type,
            "Invoice Date": formatDate(f.source_date),
            "Last Service Date": formatDate(f.source_date),
            "Customer Name": f.customer_name,
            "Mobile 1": f.mobile1,
            "Mobile 2": f.mobile2,
            "Model": f.model_name,
            "Chassis No": f.chassis_no,
            "Reg No": f.reg_no,
            "KMS": f.kms_reading,
            "Job Type": f.job_type,
            "Mechanic": f.mechanic_name,
            "Next Due Date": formatDate(f.next_due_date),
            "Appointment Date Time": f.appointment_datetime ? formatDate(f.appointment_datetime) : '',
            "Last Remark": f.remark || '',
            "Followed By": f.followed_up_by || '',
            "Leakage": f.leakage || '',
            "Status": (f.leakage && f.leakage.trim()) ? 'Leakage' : (f.remark || f.followed_up_by || f.next_follow_up_date || f.appointment_datetime) ? 'Done' : 'Pending',
            "Created At": f.created_at ? formatDate(f.created_at) : '',
            "Updated At": f.updated_at ? formatDate(f.updated_at) : '',
        }));
        exportToExcel(dataToExport, `follow-ups-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}`);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <>
            <Helmet>
                <title>Follow-Up Module - Ashwheel</title>
                <meta name="description" content="Unified follow-up list for Job Cards and Vehicle Invoices." />
            </Helmet>
            <div className="container mx-auto p-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="page-title">Follow-Up List</h1>
                    <Button onClick={handleExport} variant="outline" disabled={isLoading || (activeTab === 'report' ? allFollowUps.length === 0 : followUps.length === 0)}>
                        <Download className="mr-2 h-4 w-4" /> {activeTab === 'report' ? 'Export Report' : 'Export Current Page'}
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="p-4 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="text-sm font-medium mb-1 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search Customer, Mobile, Chassis, Reg No..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-48">
                                <label className="text-sm font-medium mb-1 block">Customer Type</label>
                                <Select value={customerType} onValueChange={setCustomerType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Customers</SelectItem>
                                        <SelectItem value="registered">Registered</SelectItem>
                                        <SelectItem value="non-registered">Non-Registered</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-auto flex gap-2 items-end">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">From</label>
                                    <DateInput value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">To</label>
                                    <DateInput value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                                </div>
                            </div>

                            <Button onClick={handleSearch} className="w-full md:w-auto">
                                <Search className="mr-2 h-4 w-4" /> Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                        <TabsTrigger value="done">Done ({stats.done})</TabsTrigger>
                        <TabsTrigger value="leakage">Leakage ({stats.leakage})</TabsTrigger>
                        <TabsTrigger value="report">Report</TabsTrigger>
                    </TabsList>

                    <TabsContent value="report" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Follow-Up Report</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Date Range: {formatDate(queryParams?.dateRange?.start || dateRange.start)} to {formatDate(queryParams?.dateRange?.end || dateRange.end)}
                                </p>
                            </CardHeader>
                            <CardContent>
                                {!queryParams ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Please select date range and click Search to view report
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <Card className="bg-blue-50 border-blue-200">
                                                <CardContent className="p-6">
                                                    <p className="text-sm text-muted-foreground mb-2">Total Follow-ups</p>
                                                    <p className="text-4xl font-bold text-blue-600">{stats.total + stats.leakage}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Required in this period</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-green-50 border-green-200">
                                                <CardContent className="p-6">
                                                    <p className="text-sm text-muted-foreground mb-2">Done</p>
                                                    <p className="text-4xl font-bold text-green-600">{stats.done}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}% completed
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-yellow-50 border-yellow-200">
                                                <CardContent className="p-6">
                                                    <p className="text-sm text-muted-foreground mb-2">Pending</p>
                                                    <p className="text-4xl font-bold text-yellow-600">{stats.pending}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% remaining
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-red-50 border-red-200">
                                                <CardContent className="p-6">
                                                    <p className="text-sm text-muted-foreground mb-2">Leakage</p>
                                                    <p className="text-4xl font-bold text-red-600">{stats.leakage}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Lost customers</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        
                                        <div className="flex gap-4 mb-6">
                                            <Button onClick={handleExport} disabled={allFollowUps.length === 0}>
                                                <Download className="mr-2 h-4 w-4" /> Export Full Report
                                            </Button>
                                        </div>

                                        {/* Report Filters */}
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Source Type</label>
                                                <Select value={reportFilters.source} onValueChange={(val) => setReportFilters(prev => ({...prev, source: val}))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sources</SelectItem>
                                                        <SelectItem value="Job Card">Job Card</SelectItem>
                                                        <SelectItem value="Vehicle Invoice">Vehicle Invoice</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Status</label>
                                                <Select value={reportFilters.status} onValueChange={(val) => setReportFilters(prev => ({...prev, status: val}))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="done">Done</SelectItem>
                                                        <SelectItem value="leakage">Leakage</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Remark</label>
                                                <Select value={reportFilters.remark} onValueChange={(val) => setReportFilters(prev => ({...prev, remark: val}))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Remarks</SelectItem>
                                                        <SelectItem value="Ringing No Response">Ringing No Response</SelectItem>
                                                        <SelectItem value="Call Back">Call Back</SelectItem>
                                                        <SelectItem value="Not Reachable">Not Reachable</SelectItem>
                                                        <SelectItem value="Switched Off">Switched Off</SelectItem>
                                                        <SelectItem value="Wrong No">Wrong No</SelectItem>
                                                        <SelectItem value="Engaged/Busy">Engaged/Busy</SelectItem>
                                                        <SelectItem value="No Need Follow-Up">No Need Follow-Up</SelectItem>
                                                        <SelectItem value="Others">Others</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Followed By</label>
                                                <Select value={reportFilters.followedBy} onValueChange={(val) => setReportFilters(prev => ({...prev, followedBy: val}))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Staff</SelectItem>
                                                        {uniqueFollowedBy.map(name => (
                                                            <SelectItem key={name} value={name}>{name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Search in Table</label>
                                                <Input 
                                                    placeholder="Search customer, mobile, vehicle..."
                                                    value={reportFilters.searchText}
                                                    onChange={(e) => setReportFilters(prev => ({...prev, searchText: e.target.value}))}
                                                />
                                            </div>
                                        </div>

                                        {/* Complete Data Table */}
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-medium">Source</th>
                                                            <th className="px-4 py-3 text-left font-medium">Customer</th>
                                                            <th className="px-4 py-3 text-left font-medium">Mobile</th>
                                                            <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                                                            <th className="px-4 py-3 text-left font-medium">Chassis No</th>
                                                            <th className="px-4 py-3 text-left font-medium">Next Due</th>
                                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                                            <th className="px-4 py-3 text-left font-medium">Remark</th>
                                                            <th className="px-4 py-3 text-left font-medium">Created At</th>
                                                            <th className="px-4 py-3 text-left font-medium">Updated At</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {allFollowUps.filter(item => {
                                                            // Apply report filters
                                                            if (reportFilters.source !== 'all' && item.source_type !== reportFilters.source) return false;
                                                            if (reportFilters.status !== 'all') {
                                                                const isDone = item.remark || item.followed_up_by || item.next_follow_up_date || item.appointment_datetime;
                                                                const isLeakage = item.leakage && item.leakage.trim();
                                                                if (reportFilters.status === 'leakage' && !isLeakage) return false;
                                                                if (reportFilters.status === 'done' && (!isDone || isLeakage)) return false;
                                                                if (reportFilters.status === 'pending' && (isDone || isLeakage)) return false;
                                                            }
                                                            if (reportFilters.remark !== 'all' && item.remark !== reportFilters.remark) return false;
                                                            if (reportFilters.followedBy !== 'all' && item.followed_up_by !== reportFilters.followedBy) return false;
                                                            if (reportFilters.searchText) {
                                                                const search = reportFilters.searchText.toLowerCase();
                                                                return (
                                                                    item.customer_name?.toLowerCase().includes(search) ||
                                                                    item.mobile1?.includes(search) ||
                                                                    item.model_name?.toLowerCase().includes(search) ||
                                                                    item.chassis_no?.toLowerCase().includes(search) ||
                                                                    item.reg_no?.toLowerCase().includes(search)
                                                                );
                                                            }
                                                            return true;
                                                        }).map((item, idx) => (
                                                            <tr key={item.id || idx} className="border-t hover:bg-muted/50">
                                                                <td className="px-4 py-3">
                                                                    <span className={`text-xs font-semibold ${item.source_type === 'Job Card' ? 'text-blue-600' : 'text-purple-600'}`}>
                                                                        {item.source_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 font-medium">{item.customer_name}</td>
                                                                <td className="px-4 py-3">{item.mobile1}</td>
                                                                <td className="px-4 py-3">{item.model_name}</td>
                                                                <td className="px-4 py-3">{item.chassis_no}</td>
                                                                <td className="px-4 py-3">{formatDate(item.next_due_date)}</td>
                                                                <td className="px-4 py-3">
                                                                    {item.leakage && item.leakage.trim() ? (
                                                                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Leakage</span>
                                                                    ) : (item.remark || item.followed_up_by || item.next_follow_up_date || item.appointment_datetime) ? (
                                                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Done</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-muted-foreground">{item.remark || '-'}</td>
                                                                <td className="px-4 py-3 text-xs">{item.created_at ? formatDate(item.created_at) : '-'}</td>
                                                                <td className="px-4 py-3 text-xs">{item.updated_at ? formatDate(item.updated_at) : '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="mt-4">
                        {(isLoading || isPlaceholderData) && (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {!isLoading && !isPlaceholderData && (
                            <div>
                                {paginatedFollowUps.length > 0 ? (
                                    <>
                                        <div className="mb-4 text-sm text-muted-foreground">
                                            Showing {paginatedFollowUps.length} of {totalCount} results
                                        </div>
                                        {paginatedFollowUps.map((item) => (
                                            <FollowUpItem key={`${item.source_id}-${item.follow_up_id || 'new'}`} item={item} onTakeFollowUp={handleTakeFollowUp} />
                                        ))}

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center space-x-2 py-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage <= 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                                <div className="text-sm font-medium">
                                                    Page {currentPage} of {totalPages}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage >= totalPages}
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Card>
                                        <CardContent className="p-16 text-center text-muted-foreground">
                                            {!queryParams ? "Select filters and click Search to view data." : "No follow-ups found."}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>
            {isModalOpen && (
                <FollowUpModal
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    followUpData={selectedFollowUp}
                    onSave={handleModalSave}
                    staffList={followUpByList}
                />
            )}
        </>
    );
};

export default FollowUpPage;