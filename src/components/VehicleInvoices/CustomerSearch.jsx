import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';

const CustomerSearch = ({ customers, onCustomerSelect, selectedCustomer }) => {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState(selectedCustomer?.id || "")

    const handleSelect = (customer) => {
        setValue(customer.id);
        onCustomerSelect(customer);
        setOpen(false);
    }

    const selectedCustomerName = useMemo(() => {
        const cust = customers.find(c => c.id === value);
        return cust ? `${cust.customer_name} (${cust.mobile1})` : "Select customer...";
    }, [value, customers]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedCustomerName}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command
                  filter={(value, search) => {
                    const customer = customers.find(c => c.id.toString() === value);
                    if (!customer) return 0;
                    const nameMatch = customer.customer_name.toLowerCase().includes(search.toLowerCase());
                    const mobileMatch = customer.mobile1.includes(search);
                    return nameMatch || mobileMatch ? 1 : 0;
                  }}
                >
                    <CommandInput placeholder="Search by name or mobile..." />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={customer.id.toString()}
                                    onSelect={() => handleSelect(customer)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div>
                                        <p>{customer.customer_name}</p>
                                        <p className="text-xs text-muted-foreground">{customer.mobile1}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default CustomerSearch;