import React, { useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

const GstCalculatorPage = () => {
  const [amount, setAmount] = useState(1000);
  const [gstRate, setGstRate] = useState(18);
  const [calculationType, setCalculationType] = useState('add');

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "Is GST calculator free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, completely free for unlimited calculations."}},
      {"@type": "Question", "name": "What GST rates are supported?", "acceptedAnswer": {"@type": "Answer", "text": "All Indian GST slabs: 3%, 5%, 12%, 18%, and 28%."}}
    ]
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const { baseAmount, gstAmount, totalAmount, cgstAmount, sgstAmount } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const numGstRate = parseFloat(gstRate) || 0;
    let base, gst, total;

    if (calculationType === 'add') {
      base = numAmount;
      gst = numAmount * (numGstRate / 100);
      total = numAmount + gst;
    } else { // remove
      base = numAmount / (1 + numGstRate / 100);
      gst = numAmount - base;
      total = numAmount;
    }
    
    const cgst = gst / 2;
    const sgst = gst / 2;

    return {
      baseAmount: base,
      gstAmount: gst,
      totalAmount: total,
      cgstAmount: cgst,
      sgstAmount: sgst,
    };
  }, [amount, gstRate, calculationType]);

  const gstRates = [3, 5, 12, 18, 28];

  return (
    <>
      <SEO path="/gst-calculator" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">GST Calculator</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Calculate GST</CardTitle>
              <CardDescription>Enter an amount and GST rate to see the calculation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={calculationType} onValueChange={setCalculationType} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="add">Add GST</TabsTrigger>
                  <TabsTrigger value="remove">Remove GST</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">
                    {calculationType === 'add' ? 'Base Amount' : 'Total Amount (Inclusive of GST)'}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 1000"
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="gstRate">GST Rate (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="gstRate"
                      type="number"
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                      placeholder="e.g., 18"
                      className="text-lg"
                    />
                    <Percent className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {gstRates.map(rate => (
                      <Button key={rate} variant={gstRate == rate ? 'default' : 'outline'} size="sm" onClick={() => setGstRate(rate)}>
                        {rate}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                key={calculationType + amount + gstRate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 p-6 bg-primary/5 rounded-lg space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span className="font-semibold text-lg">{formatCurrency(baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CGST ({(gstRate / 2).toFixed(2)}%)</span>
                  <span className="font-semibold text-lg">{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">SGST ({(gstRate / 2).toFixed(2)}%)</span>
                  <span className="font-semibold text-lg">{formatCurrency(sgstAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total GST ({gstRate}%)</span>
                  <span className="font-semibold text-lg">{formatCurrency(gstAmount)}</span>
                </div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between items-center text-primary">
                  <span className="font-bold text-xl">Total Amount</span>
                  <span className="font-bold text-xl">{formatCurrency(totalAmount)}</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-md mt-8">
            <CardHeader>
                <CardTitle>How to Use the GST Calculator</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>This tool helps you quickly calculate GST for your invoicing and accounting needs.</p>
                <ol>
                    <li><strong>Select Calculation Type:</strong> Choose whether you want to "Add GST" to a base amount or "Remove GST" from a total amount.</li>
                    <li><strong>Enter Amount:</strong> Input the base amount (if adding GST) or the total amount (if removing GST).</li>
                    <li><strong>Set GST Rate:</strong> Enter the GST percentage or select one of the common slabs (3%, 5%, 12%, 18%, 28%).</li>
                    <li><strong>View Breakdown:</strong> The calculator will instantly show you the base amount, CGST, SGST, total GST, and the final total amount.</li>
                </ol>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default GstCalculatorPage;