import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/NewSupabaseAuthContext';
import { formatDateTimeForInput } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import useFollowUpStore from '@/stores/followUpStore';

const StaffSearchInput = ({ value, onChange, suggestions }) => {
    const [inputValue, setInputValue] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const inputRef = useRef(null);

    const filteredSuggestions = useMemo(() => {
        if (!suggestions || !inputValue) return [];
        return suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()));
    }, [suggestions, inputValue]);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleSelect = (suggestion) => {
        setInputValue(suggestion);
        onChange(suggestion);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestionIndex > -1 && filteredSuggestions[suggestionIndex]) {
                handleSelect(filteredSuggestions[suggestionIndex]);
            } else {
                onChange(inputValue);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                id="followed_by"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => { onChange(inputValue); setShowSuggestions(false); }, 150)}
                onKeyDown={handleKeyDown}
                placeholder="Enter staff name..."
                autoComplete="off"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={suggestion}
                            className={cn("px-3 py-2 cursor-pointer hover:bg-accent", suggestionIndex === index && 'bg-accent')}
                            onMouseDown={() => handleSelect(suggestion)}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const FollowUpModal = ({ isOpen, onOpenChange, followUpData, onSave, staffList }) => {
    const { formData, setFormField, resetForm } = useFollowUpStore();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (followUpData) {
            setFormField('remark', followUpData.remark || '');
            setFormField('nextFollowUpDate', followUpData.next_follow_up_date ? format(new Date(followUpData.next_follow_up_date), 'yyyy-MM-dd') : '');
            setFormField('appointmentDateTime', followUpData.appointment_datetime ? formatDateTimeForInput(new Date(followUpData.appointment_datetime)) : '');
            setFormField('followedBy', followUpData.followed_up_by || '');
        }
    }, [followUpData, setFormField]);
    
    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    }

    const handleSubmit = async () => {
        if (!formData.remark && !formData.nextFollowUpDate && !formData.appointmentDateTime && !formData.followedBy) {
            toast({ title: 'No Changes', description: 'Please enter at least one value to save.', variant: 'default' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                user_id: user.id,
                remark: formData.remark,
                next_follow_up_date: formData.nextFollowUpDate || null,
                appointment_datetime: formData.appointmentDateTime || null,
                followed_up_by: formData.followedBy,
            };
            
            if(followUpData.source_type === 'Job Card') {
                payload.job_card_id = followUpData.source_id;
            } else {
                payload.vehicle_invoice_id = followUpData.source_id;
            }

            if (followUpData.follow_up_id) {
                payload.id = followUpData.follow_up_id;
            }
            
            const { error } = await supabase
                .from('workshop_follow_ups')
                .upsert(payload, { onConflict: 'id', ignoreDuplicates: false });

            if (error) throw error;
            toast({ title: 'Success', description: 'Follow-up saved successfully.' });
            onSave();
            handleClose();
        } catch (error) {
            toast({ title: 'Error', description: `Failed to save follow-up: ${error.message}`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!followUpData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Take Follow-up for {followUpData.customer_name}</DialogTitle>
                    <DialogDescription>
                        Vehicle: {followUpData.model_name} ({followUpData.chassis_no})
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="remark">New Remark</Label>
                        <Textarea id="remark" value={formData.remark} onChange={(e) => setFormField('remark', e.target.value)} placeholder="Enter new follow-up details..." />
                    </div>
                    <div>
                        <Label htmlFor="next_follow_up_date">Next Follow-up Date</Label>
                        <Input type="date" id="next_follow_up_date" value={formData.nextFollowUpDate} onChange={(e) => setFormField('nextFollowUpDate', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="appointment_datetime">Appointment Date & Time</Label>
                        <Input type="datetime-local" id="appointment_datetime" value={formData.appointmentDateTime} onChange={(e) => setFormField('appointmentDateTime', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="followed_by">Followed By</Label>
                        <StaffSearchInput
                            value={formData.followedBy}
                            onChange={(value) => setFormField('followedBy', value)}
                            suggestions={staffList}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Follow-up
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FollowUpModal;