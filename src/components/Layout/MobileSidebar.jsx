import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMobileSidebar } from '@/hooks/useMobileSidebar';
import Sidebar from '@/components/Layout/Sidebar';

const MobileSidebar = () => {
    const pathname = useLocation().pathname;
    const [isMounted, setIsMounted] = useState(false);

    const isOpen = useMobileSidebar((state) => state.isOpen);
    const onClose = useMobileSidebar((state) => state.onClose);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    if (!isMounted) {
        return null;
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="left" className="p-0 bg-secondary w-64">
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
};

export default MobileSidebar;