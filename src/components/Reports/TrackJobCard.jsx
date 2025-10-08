import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import HistorySection from './HistorySection';
import useReportStore from '@/stores/reportStore';

const TrackJobCard = () => {
    const { trackJobCard, setTrackJobCardState } = useReportStore();
    const { searchTerm } = trackJobCard || {}; // Safely destructure searchTerm
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const { data, isLoading, error } = useQuery({
        queryKey: ['trackJobCard', debouncedSearchTerm],
        queryFn: () => supabase.rpc('track_job_card_history', { p_search_term: debouncedSearchTerm }),
        enabled: !!debouncedSearchTerm,
    });

    const history = data?.data || [];

    return (
        <div>
            <div className="flex gap-2 mb-4">
                <Input 
                    placeholder="Search by Customer, Chassis, Reg No, or Invoice No..."
                    value={searchTerm || ''} // Ensure value is never undefined
                    onChange={(e) => setTrackJobCardState({ searchTerm: e.target.value })}
                />
            </div>
            {isLoading && <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            <div className="space-y-4">
                {history.map((item, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>Job Card for Chassis: {item.frame_no} / Reg: {item.reg_no}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <HistorySection title="Job Cards" data={item.job_cards} columns={['invoice_no', 'invoice_date', 'customer_name', 'job_type']} />
                            <HistorySection title="Workshop Purchases" data={item.workshop_purchases} columns={['invoice_no', 'invoice_date', 'party_name']} />
                            <HistorySection title="Workshop Purchase Returns" data={item.wp_returns} columns={['return_invoice_no', 'return_date', 'party_name']} />
                            <HistorySection title="Workshop Sales Returns" data={item.ws_returns} columns={['return_invoice_no', 'return_date', 'customer_name']} />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TrackJobCard;