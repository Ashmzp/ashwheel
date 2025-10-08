import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarRange } from 'lucide-react';

const DateDifferenceCalculatorPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [difference, setDifference] = useState(null);

  const calculateDifference = () => {
    if (!startDate || !endDate) {
      setDifference(null);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        setDifference({ error: "Start date cannot be after end date." });
        return;
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months--;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }
    
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));

    setDifference({ years, months, days, totalDays, error: null });
  };

  return (
    <>
      <Helmet>
        <title>Date Difference Calculator - Ashwheel</title>
        <meta name="description" content="Calculate the duration between two dates in years, months, and days with our free online Date Difference Calculator." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <CalendarRange className="w-8 h-8 text-primary" />
                Date Difference Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Select two dates to calculate the duration between them.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={calculateDifference}>Calculate Difference</Button>

              {difference && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-8 p-6 bg-primary/10 rounded-lg"
                >
                  <h3 className="text-xl font-semibold text-center mb-4">Difference</h3>
                  {difference.error ? (
                    <p className="text-destructive text-center font-bold">{difference.error}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-background rounded-md shadow">
                          <p className="text-3xl font-bold text-primary">{difference.years}</p>
                          <p className="text-muted-foreground">Years</p>
                        </div>
                        <div className="p-4 bg-background rounded-md shadow">
                          <p className="text-3xl font-bold text-primary">{difference.months}</p>
                          <p className="text-muted-foreground">Months</p>
                        </div>
                        <div className="p-4 bg-background rounded-md shadow">
                          <p className="text-3xl font-bold text-primary">{difference.days}</p>
                          <p className="text-muted-foreground">Days</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center p-4 bg-background rounded-md shadow">
                        <p className="text-muted-foreground">Total Difference in Days</p>
                        <p className="text-3xl font-bold text-primary">{difference.totalDays}</p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
          
          <Card className="w-full max-w-2xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the Date Difference Calculator</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Measure the exact time between two dates for project planning, tracking events, or any other purpose.</p>
                <ol>
                    <li><strong>Select Start Date:</strong> Use the date picker to choose the first date.</li>
                    <li><strong>Select End Date:</strong> Use the date picker to choose the second date.</li>
                    <li><strong>Calculate:</strong> Click the "Calculate Difference" button to see the result.</li>
                    <li><strong>View Results:</strong> The calculator will show the duration broken down into years, months, and days, as well as the total number of days between the two dates.</li>
                </ol>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default DateDifferenceCalculatorPage;