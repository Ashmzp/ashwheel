import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cake } from 'lucide-react';

const AgeCalculatorPage = () => {
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState(null);

  const calculateAge = () => {
    if (!birthDate) {
      setAge(null);
      return;
    }
    const today = new Date();
    const birth = new Date(birthDate);

    if (birth > today) {
        setAge({ error: "Birth date cannot be in the future." });
        return;
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (today > nextBirthday) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

    setAge({ years, months, days, totalDays, daysUntilBirthday, error: null });
  };

  return (
    <>
      <Helmet>
        <title>Age Calculator - Ashwheel</title>
        <meta name="description" content="Calculate your exact age in years, months, and days from your date of birth with our free online Age Calculator." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <Cake className="w-8 h-8 text-primary" />
                Age Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Enter your date of birth to find out your exact age.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-grow space-y-2">
                  <Label htmlFor="birth-date">Your Date of Birth</Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <Button onClick={calculateAge} className="self-end">Calculate Age</Button>
              </div>

              {age && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-8 p-6 bg-primary/10 rounded-lg"
                >
                  <h3 className="text-xl font-semibold text-center mb-4">Your Age Is</h3>
                  {age.error ? (
                     <p className="text-destructive text-center font-bold">{age.error}</p>
                  ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-background rounded-md shadow">
                            <p className="text-3xl font-bold text-primary">{age.years}</p>
                            <p className="text-muted-foreground">Years</p>
                            </div>
                            <div className="p-4 bg-background rounded-md shadow">
                            <p className="text-3xl font-bold text-primary">{age.months}</p>
                            <p className="text-muted-foreground">Months</p>
                            </div>
                            <div className="p-4 bg-background rounded-md shadow">
                            <p className="text-3xl font-bold text-primary">{age.days}</p>
                            <p className="text-muted-foreground">Days</p>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p>or {age.totalDays} days old</p>
                            <p className="mt-2 font-semibold">{age.daysUntilBirthday} days until your next birthday!</p>
                        </div>
                    </>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="w-full max-w-xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the Age Calculator</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Finding out your precise age is simple with our tool. Just follow these steps:</p>
                <ol>
                    <li><strong>Enter Your Date of Birth:</strong> Use the date picker to select your year, month, and day of birth.</li>
                    <li><strong>Calculate Age:</strong> Click the "Calculate Age" button.</li>
                    <li><strong>View Your Results:</strong> The tool will instantly display your age broken down into years, months, and days. It also shows your total age in days and the countdown to your next birthday.</li>
                </ol>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default AgeCalculatorPage;