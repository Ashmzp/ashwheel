import React, { useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const EmiCalculatorPage = () => {
  const [principal, setPrincipal] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenure, setTenure] = useState(5);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "How is EMI calculated?", "acceptedAnswer": {"@type": "Answer", "text": "EMI = [P x R x (1+R)^N]/[(1+R)^N-1] where P=Principal, R=Rate per month, N=Tenure in months."}},
      {"@type": "Question", "name": "Is this calculator accurate?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, uses standard EMI formula used by banks and financial institutions."}}
    ]
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { monthlyEmi, totalInterest, totalPayment } = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = (parseFloat(tenure) || 0) * 12;

    if (p > 0 && r > 0 && n > 0) {
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const total = emi * n;
      const interest = total - p;
      return {
        monthlyEmi: emi,
        totalInterest: interest,
        totalPayment: total,
      };
    }
    return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0 };
  }, [principal, interestRate, tenure]);

  const principalPercentage = totalPayment > 0 ? (principal / totalPayment) * 100 : 0;
  const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  return (
    <>
      <SEO path="/emi-calculator" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">EMI Calculator</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
                <CardDescription>Enter your loan details to see your EMI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="principal">Loan Amount (₹)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    placeholder="e.g., 500000"
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="interestRate">Interest Rate (% p.a.)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    placeholder="e.g., 9.5"
                    step="0.01"
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="tenure">Loan Tenure (Years)</Label>
                  <Input
                    id="tenure"
                    type="number"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                    placeholder="e.g., 5"
                    className="text-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <motion.div
              key={principal + interestRate + tenure}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Your Loan Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <div>
                    <p className="text-muted-foreground">Monthly EMI</p>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(monthlyEmi)}</p>
                  </div>
                  <div className="w-full max-w-xs mx-auto">
                    <div className="flex w-full h-3 bg-gray-200 rounded-full overflow-hidden my-4">
                      <motion.div
                        className="bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${principalPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.div
                        className="bg-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${interestPercentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-primary mr-2"></span>Principal</div>
                      <div className="flex items-center"><span className="h-2 w-2 rounded-full bg-amber-400 mr-2"></span>Interest</div>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-muted-foreground">Principal Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(principal)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Interest</p>
                      <p className="text-lg font-semibold">{formatCurrency(totalInterest)}</p>
                    </div>
                    <div className="col-span-2 mt-2">
                      <p className="text-muted-foreground">Total Payment</p>
                      <p className="text-xl font-bold">{formatCurrency(totalPayment)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          <Card className="w-full max-w-4xl mt-8">
            <CardHeader>
                <CardTitle>How to Use the EMI Calculator</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Plan your loan repayments effectively by calculating your Equated Monthly Installment (EMI).</p>
                <ol>
                    <li><strong>Enter Loan Amount:</strong> Input the total principal amount of your loan.</li>
                    <li><strong>Enter Interest Rate:</strong> Input the annual interest rate for your loan.</li>
                    <li><strong>Enter Loan Tenure:</strong> Input the total duration of the loan in years.</li>
                    <li><strong>View Results:</strong> The calculator will instantly display your monthly EMI, the total interest payable, and the total payment (principal + interest) over the loan's lifetime. The chart provides a visual breakdown of the principal versus interest components.</li>
                </ol>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default EmiCalculatorPage;