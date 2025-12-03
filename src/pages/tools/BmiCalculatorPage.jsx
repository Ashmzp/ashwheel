import React, { useState, useMemo } from 'react';
    import SEO from '@/components/SEO';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

    const BmiCalculatorPage = () => {
      const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is BMI?", "acceptedAnswer": { "@type": "Answer", "text": "BMI (Body Mass Index) is a measure of body fat based on height and weight that applies to adult men and women." } },
          { "@type": "Question", "name": "What is a healthy BMI range?", "acceptedAnswer": { "@type": "Answer", "text": "A BMI between 18.5 and 24.9 is considered normal weight. Below 18.5 is underweight, 25-29.9 is overweight, and 30+ is obese." } },
          { "@type": "Question", "name": "Can I use both metric and imperial units?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, our calculator supports both metric (cm, kg) and imperial (feet, inches, lbs) units." } }
        ]
      };
      const [unit, setUnit] = useState('metric');
      const [height, setHeight] = useState('');
      const [weight, setWeight] = useState('');
      const [heightFt, setHeightFt] = useState('');
      const [heightIn, setHeightIn] = useState('');

      const bmiResult = useMemo(() => {
        let h, w;
        if (unit === 'metric') {
          h = parseFloat(height) / 100;
          w = parseFloat(weight);
        } else {
          h = (parseFloat(heightFt) * 12 + parseFloat(heightIn)) * 0.0254;
          w = parseFloat(weight) * 0.453592;
        }

        if (h > 0 && w > 0) {
          const bmi = w / (h * h);
          let category = '';
          if (bmi < 18.5) category = 'Underweight';
          else if (bmi < 25) category = 'Normal weight';
          else if (bmi < 30) category = 'Overweight';
          else category = 'Obese';
          return { value: bmi.toFixed(2), category };
        }
        return null;
      }, [unit, height, weight, heightFt, heightIn]);

      const howToUse = (
        <div>
          <p>1. Select your preferred unit system (Metric or Imperial).</p>
          <p>2. Enter your height and weight in the corresponding fields.</p>
          <p>3. Your BMI and weight category will be calculated and displayed automatically.</p>
        </div>
      );

      return (
        <>
        <SEO path="/tools/bmi-calculator" faqSchema={faqSchema} />
        <ToolWrapper title="BMI Calculator" howToUse={howToUse}>
          <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>BMI Calculator</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup defaultValue="metric" onValueChange={setUnit} className="flex space-x-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="metric" id="metric" /><Label htmlFor="metric">Metric</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="imperial" id="imperial" /><Label htmlFor="imperial">Imperial</Label></div>
              </RadioGroup>
              
              {unit === 'metric' ? (
                <>
                  <div><Label htmlFor="height-cm">Height (cm)</Label><Input id="height-cm" type="number" value={height} onChange={e => setHeight(e.target.value)} /></div>
                  <div><Label htmlFor="weight-kg">Weight (kg)</Label><Input id="weight-kg" type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div className="flex gap-4"><div className="flex-1"><Label htmlFor="height-ft">Height (ft)</Label><Input id="height-ft" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} /></div><div className="flex-1"><Label htmlFor="height-in">Height (in)</Label><Input id="height-in" type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} /></div></div>
                  <div><Label htmlFor="weight-lbs">Weight (lbs)</Label><Input id="weight-lbs" type="number" value={weight} onChange={e => setWeight(e.target.value)} /></div>
                </>
              )}

              {bmiResult && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-lg">Your BMI is</p>
                  <p className="text-4xl font-bold">{bmiResult.value}</p>
                  <p className="text-lg font-semibold">{bmiResult.category}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ToolWrapper>
        </>
      );
    };

    export default BmiCalculatorPage;