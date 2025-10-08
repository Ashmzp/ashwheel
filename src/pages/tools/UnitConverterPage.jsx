import React, { useState, useMemo } from 'react';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { ArrowRightLeft } from 'lucide-react';

    const conversionFactors = {
      length: {
        meter: 1,
        kilometer: 0.001,
        centimeter: 100,
        millimeter: 1000,
        inch: 39.3701,
        foot: 3.28084,
        yard: 1.09361,
        mile: 0.000621371,
      },
      weight: {
        gram: 1,
        kilogram: 0.001,
        milligram: 1000,
        pound: 0.00220462,
        ounce: 0.035274,
      },
      temperature: {
        celsius: (c) => c,
        fahrenheit: (c) => (c * 9/5) + 32,
        kelvin: (c) => c + 273.15,
      },
    };

    const reverseTemperature = {
        celsius: (c) => c,
        fahrenheit: (f) => (f - 32) * 5/9,
        kelvin: (k) => k - 273.15,
    };

    const UnitConverterPage = () => {
      const [category, setCategory] = useState('length');
      const [fromUnit, setFromUnit] = useState('meter');
      const [toUnit, setToUnit] = useState('kilometer');
      const [inputValue, setInputValue] = useState(1);

      const units = Object.keys(conversionFactors[category]);

      const convertedValue = useMemo(() => {
        if (isNaN(inputValue)) return '';
        
        if (category === 'temperature') {
            const baseValue = reverseTemperature[fromUnit](inputValue);
            return conversionFactors[category][toUnit](baseValue).toFixed(4);
        }

        const baseValue = inputValue / conversionFactors[category][fromUnit];
        return (baseValue * conversionFactors[category][toUnit]).toFixed(4);
      }, [inputValue, fromUnit, toUnit, category]);

      const handleCategoryChange = (newCategory) => {
        setCategory(newCategory);
        const newUnits = Object.keys(conversionFactors[newCategory]);
        setFromUnit(newUnits[0]);
        setToUnit(newUnits[1]);
      };

      const howToUse = (
        <div>
          <p>1. Select the category of measurement (e.g., Length, Weight, Temperature).</p>
          <p>2. Enter the value you want to convert in the left input box.</p>
          <p>3. Select the "from" and "to" units using the dropdowns below each input box.</p>
          <p>4. The converted value will appear automatically in the right input box.</p>
        </div>
      );

      return (
        <ToolWrapper title="Unit Converter" howToUse={howToUse}>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Unit Converter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="length">Length</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(parseFloat(e.target.value))}
                  />
                  <Select value={fromUnit} onValueChange={setFromUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1">
                  <Input readOnly value={convertedValue} />
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </ToolWrapper>
      );
    };

    export default UnitConverterPage;