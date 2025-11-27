import React, { useState, useMemo } from 'react';
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
import { Download, Loader2, PhoneCall, CheckCircle2, PhoneOutgoing, Search } from 'lucide-react';
import FollowUpModal from '@/components/Workshop/FollowUpModal';
import { exportToExcel } from '@/utils/excel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const FollowUpItem = ({ item, onTakeFollowUp }) => {
    const isDone = !!item.followed_up_by;
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

const StatCard = ({ title, value, icon, color }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent className="card-compact">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </CardContent>
    </Card>
);

const FollowUpPage = () => {
    const todayStr = format(startOfToday(), 'yyyy-MM-dd');
    const [dateRange, setDateRange] = useLocalStorage('followUpDateRange', { start: todayStr, end: todayStr });
    const [searchTerm, setSearchTerm] = useLocalStorage('followUpSearchTerm', '');
    const [activeTab, setActiveTab] = useLocalStorage('followUpActiveTab', 'all');
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const queryClient = useQueryClient();
    const { settings } = useSettingsStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);

    const followUpByList = useMemo(() => settings.workshop_settings?.follow_up_by_list || [], [settings]);
    
    const queryKey = ['followUps', dateRange, debouncedSearchTerm];

    const { data: followUps = [], isLoading, isPlaceholderData } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_follow_ups_v3', {
                p_start_date: dateRange.start,
                p_end_date: dateRange.end,
                p_search_term: debouncedSearchTerm,
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!dateRange.start && !!dateRange.end,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleTakeFollowUp = (item) => {
        setSelectedFollowUp(item);
        setIsModalOpen(true);
    };

    const handleModalSave = () => {
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['followUps'] });
    };

    const handleExport = () => {
        if (tabsData[activeTab].length === 0) {
            alert("No data to export in the current view.");
            return;
        }
        const dataToExport = tabsData[activeTab].map(f => ({
            "Source Date": formatDate(f.source_date),
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
            "Last Remark": f.remark,
            "Followed By": f.followed_up_by,
        }));
        exportToExcel(dataToExport, `follow-ups-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}`);
    };

    const stats = useMemo(() => {
        const leakage = followUps.filter(f => !!f.leakage).length;
        const nonLeakage = followUps.filter(f => !f.leakage);
        const done = nonLeakage.filter(f => !!f.followed_up_by).length;
        const pending = nonLeakage.filter(f => !f.followed_up_by).length;
        return { done, pending, leakage, total: nonLeakage.length };
    }, [followUps]);
    
    const tabsData = useMemo(() => {
        const today = format(startOfToday(), 'yyyy-MM-dd');
        const nonLeakage = followUps.filter(f => !f.leakage);
        return {
            all: nonLeakage.filter(f => f.next_due_date <= today),
            pending: nonLeakage.filter(f => !f.followed_up_by && f.next_due_date <= today),
            done: nonLeakage.filter(f => !!f.followed_up_by && f.next_due_date <= today),
            leakage: followUps.filter(f => !!f.leakage),
        };
    }, [followUps]);

    return (
        <>
            <Helmet>
                <title>Follow-Up Module - Ashwheel</title>
                <meta name="description" content="Unified follow-up list for Job Cards and Vehicle Invoices." />
            </Helmet>
            <div className="container mx-auto p-4 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="page-title">Follow-Up List</h1>
                    <Button onClick={handleExport} variant="outline" disabled={isLoading}><Download className="mr-2 h-4 w-4" /> Export to Excel</Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Total Follow-ups" value={stats.total} icon={<PhoneCall className="h-4 w-4 text-muted-foreground" />} color="text-blue-500" />
                    <StatCard title="Pending Follow-ups" value={stats.pending} icon={<PhoneCall className="h-4 w-4 text-muted-foreground" />} color="text-orange-500" />
                    <StatCard title="Done Follow-ups" value={stats.done} icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />} color="text-green-500" />
                    <StatCard title="Leakage" value={stats.leakage} icon={<PhoneCall className="h-4 w-4 text-muted-foreground" />} color="text-red-500" />
                </div>

                <Card>
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                         <div className="relative w-full md:w-auto md:flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search Customer, Mobile, Chassis, Reg No..."
                                className="pl-10 max-w-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center items-center">
                            <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} />
                            <span>to</span>
                            <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} />
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                        <TabsTrigger value="done">Done ({stats.done})</TabsTrigger>
                        <TabsTrigger value="leakage">Leakage ({stats.leakage})</TabsTrigger>
                    </TabsList>
                    
                    {(isLoading || isPlaceholderData) && (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    
                    {!isLoading && !isPlaceholderData && ['all', 'pending', 'done', 'leakage'].map(tabValue => (
                        <TabsContent key={tabValue} value={tabValue}>
                            <div>
                                {tabsData[tabValue].length > 0 ? (
                                    tabsData[tabValue].map((item) => (
                                        <FollowUpItem key={`${item.source_id}-${item.follow_up_id || 'new'}`} item={item} onTakeFollowUp={handleTakeFollowUp} />
                                    ))
                                ) : (
                                    <Card>
                                        <CardContent className="p-16 text-center text-muted-foreground">
                                            No follow-ups found in this category.
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    ))}
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