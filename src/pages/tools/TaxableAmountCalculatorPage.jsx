import React, { useState, useMemo } from 'react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

const TaxableAmountCalculatorPage = () => {
  const [totalAmount, setTotalAmount] = useState(1180);
  const [taxRate, setTaxRate] = useState(18);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const { baseAmount, taxAmount, cgstAmount, sgstAmount } = useMemo(() => {
    const numTotalAmount = parseFloat(totalAmount) || 0;
    const numTaxRate = parseFloat(taxRate) || 0;

    const base = numTotalAmount / (1 + numTaxRate / 100);
    const tax = numTotalAmount - base;
    const cgst = tax / 2;
    const sgst = tax / 2;

    return {
      baseAmount: base,
      taxAmount: tax,
      cgstAmount: cgst,
      sgstAmount: sgst,
    };
  }, [totalAmount, taxRate]);

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What is a taxable amount calculator?", "acceptedAnswer": { "@type": "Answer", "text": "It calculates the pre-tax base amount from a total price that includes tax, also known as reverse GST calculation." } },
      { "@type": "Question", "name": "How do I find the base value?", "acceptedAnswer": { "@type": "Answer", "text": "Enter the total amount (including tax) and the tax rate percentage. The calculator shows the taxable base value and tax breakdown." } },
      { "@type": "Question", "name": "Does it show CGST and SGST?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, the calculator automatically splits the tax into CGST and SGST (each half of the total tax rate)." } }
    ]
  };

  return (
    <>
      <SEO path="/tools/taxable-amount-calculator" faqSchema={faqSchema} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/20 to-background p-4 sm:p-6">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tools</Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Taxable Amount Calculator</h1>
        </header>

        <main className="flex-1 flex flex-col items-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Calculate Taxable Value</CardTitle>
              <CardDescription>Enter the total amount and tax rate to find the base value.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="totalAmount">Total Amount (Inclusive of Tax)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="e.g., 1180"
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="taxRate"
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="e.g., 18"
                      className="text-lg"
                    />
                    <Percent className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <motion.div
                key={totalAmount + taxRate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 p-6 bg-primary/5 rounded-lg space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxable Value (Base Amount)</span>
                  <span className="font-semibold text-lg">{formatCurrency(baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CGST ({(taxRate / 2).toFixed(2)}%)</span>
                  <span className="font-semibold text-lg">{formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">SGST ({(taxRate / 2).toFixed(2)}%)</span>
                  <span className="font-semibold text-lg">{formatCurrency(sgstAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Tax ({taxRate}%)</span>
                  <span className="font-semibold text-lg">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between items-center text-primary">
                  <span className="font-bold text-xl">Total Amount</span>
                  <span className="font-bold text-xl">{formatCurrency(parseFloat(totalAmount) || 0)}</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
          <Card className="w-full max-w-md mt-8">
            <CardHeader>
                <CardTitle>How to Use the Taxable Amount Calculator</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Easily find the pre-tax price of a product or service with our reverse tax calculator.</p>
                <ol>
                    <li><strong>Enter Total Amount:</strong> Input the final price of the item, including all taxes.</li>
                    <li><strong>Enter Tax Rate:</strong> Input the tax percentage that was applied (e.g., 18 for 18% GST).</li>
                    <li><strong>View Breakdown:</strong> The calculator will immediately show you the original base amount (taxable value) and the total tax amount, along with the CGST and SGST breakdown.</li>
                </ol>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default TaxableAmountCalculatorPage;