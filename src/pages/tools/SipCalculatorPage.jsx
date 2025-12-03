import React, { useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const SipCalculatorPage = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [returnRate, setReturnRate] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { investedAmount, estimatedReturns, totalValue } = useMemo(() => {
    const P = parseFloat(monthlyInvestment) || 0;
    const i = (parseFloat(returnRate) || 0) / 100 / 12;
    const n = (parseFloat(timePeriod) || 0) * 12;

    if (P > 0 && i > 0 && n > 0) {
      const M = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      const invested = P * n;
      const returns = M - invested;
      return {
        investedAmount: invested,
        estimatedReturns: returns,
        totalValue: M,
      };
    }
    return { investedAmount: 0, estimatedReturns: 0, totalValue: 0 };
  }, [monthlyInvestment, returnRate, timePeriod]);

  const investedPercentage = totalValue > 0 ? (investedAmount / totalValue) * 100 : 0;
  const returnsPercentage = totalValue > 0 ? (estimatedReturns / totalValue) * 100 : 0;

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How does a SIP calculator work?", "acceptedAnswer": { "@type": "Answer", "text": "Enter your monthly investment, expected return rate, and time period. The calculator shows your total investment value and returns." } },
      { "@type": "Question", "name": "What is a good SIP return rate?", "acceptedAnswer": { "@type": "Answer", "text": "Historically, equity mutual funds have returned 10-15% annually, but returns vary based on market conditions." } },
      { "@type": "Question", "name": "Can I change the investment amount?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, use the slider or input field to adjust monthly investment from ₹500 to ₹1,00,000." } }
    ]
  };

  return (
    <>
      <SEO path="/tools/sip-calculator" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">SIP Calculator</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
                <CardDescription>Adjust the sliders or enter values to plan your investment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <Label htmlFor="monthlyInvestment" className="mb-2 block">Monthly Investment</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="monthlyInvestment"
                      type="number"
                      value={monthlyInvestment}
                      onChange={(e) => setMonthlyInvestment(parseFloat(e.target.value) || 0)}
                      className="w-40"
                    />
                    <Slider value={[monthlyInvestment]} onValueChange={(val) => setMonthlyInvestment(val[0])} min={500} max={100000} step={500} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="returnRate" className="mb-2 block">Expected Return Rate (% p.a.)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="returnRate"
                      type="number"
                      value={returnRate}
                      onChange={(e) => setReturnRate(parseFloat(e.target.value) || 0)}
                      className="w-40"
                    />
                    <Slider value={[returnRate]} onValueChange={(val) => setReturnRate(val[0])} min={1} max={30} step={0.1} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="timePeriod" className="mb-2 block">Time Period (Years)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="timePeriod"
                      type="number"
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(parseFloat(e.target.value) || 0)}
                      className="w-40"
                    />
                    <Slider value={[timePeriod]} onValueChange={(val) => setTimePeriod(val[0])} min={1} max={40} step={1} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <motion.div
              key={monthlyInvestment + returnRate + timePeriod}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Your Investment Projection</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <div>
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(totalValue)}</p>
                  </div>
                  <div className="w-full max-w-xs mx-auto">
                    <div className="flex w-full h-3 bg-gray-200 rounded-full overflow-hidden my-4">
                      <motion.div
                        className="bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${investedPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.div
                        className="bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${returnsPercentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-primary mr-2"></span>Invested</div>
                      <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>Returns</div>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-muted-foreground">Invested Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(investedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. Returns</p>
                      <p className="text-lg font-semibold">{formatCurrency(estimatedReturns)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          <Card className="w-full max-w-4xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the SIP Calculator</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Project the future value of your Systematic Investment Plan (SIP) to make informed financial decisions.</p>
                <ol>
                    <li><strong>Enter Monthly Investment:</strong> Use the slider or input box to set the amount you plan to invest each month.</li>
                    <li><strong>Set Expected Return Rate:</strong> Adjust the slider to set the annual rate of return you expect from your investment.</li>
                    <li><strong>Define Time Period:</strong> Set the total number of years you plan to stay invested.</li>
                    <li><strong>Analyze Projection:</strong> The calculator will instantly display the total value of your investment, along with a breakdown of your invested amount versus the estimated returns.</li>
                </ol>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default SipCalculatorPage;