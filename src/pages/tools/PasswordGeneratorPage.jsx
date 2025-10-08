import React, { useState } from 'react';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Slider } from '@/components/ui/slider';
    import { Switch } from '@/components/ui/switch';
    import { useToast } from '@/components/ui/use-toast';
    import { Copy, RefreshCw } from 'lucide-react';

    const PasswordGeneratorPage = () => {
      const [password, setPassword] = useState('');
      const [length, setLength] = useState(16);
      const [includeUppercase, setIncludeUppercase] = useState(true);
      const [includeLowercase, setIncludeLowercase] = useState(true);
      const [includeNumbers, setIncludeNumbers] = useState(true);
      const [includeSymbols, setIncludeSymbols] = useState(true);
      const { toast } = useToast();

      const generatePassword = () => {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        
        let charset = '';
        if (includeUppercase) charset += upper;
        if (includeLowercase) charset += lower;
        if (includeNumbers) charset += numbers;
        if (includeSymbols) charset += symbols;

        if (charset === '') {
          toast({
            title: 'Error',
            description: 'Please select at least one character type.',
            variant: 'destructive',
          });
          return;
        }

        let newPassword = '';
        for (let i = 0; i < length; i++) {
          newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPassword(newPassword);
      };

      const copyToClipboard = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        toast({
          title: 'Copied!',
          description: 'Password copied to clipboard.',
        });
      };

      const howToUse = (
        <div>
          <p>1. Adjust the slider to set your desired password length (8-64 characters).</p>
          <p>2. Use the switches to include or exclude uppercase letters, lowercase letters, numbers, and symbols.</p>
          <p>3. Click the "Generate Password" button to create a new password.</p>
          <p>4. The generated password will appear in the text box. You can click the copy icon to copy it to your clipboard.</p>
        </div>
      );

      return (
        <ToolWrapper title="Password Generator" howToUse={howToUse}>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Password Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Input
                  readOnly
                  value={password}
                  placeholder="Your generated password will appear here"
                  className="pr-20 text-lg h-12"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <Button variant="ghost" size="icon" onClick={generatePassword}>
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="length">Password Length: {length}</Label>
                  <Slider
                    id="length"
                    min={8}
                    max={64}
                    step={1}
                    value={[length]}
                    onValueChange={(value) => setLength(value[0])}
                    className="w-64"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="uppercase">Include Uppercase (A-Z)</Label>
                  <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowercase">Include Lowercase (a-z)</Label>
                  <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="numbers">Include Numbers (0-9)</Label>
                  <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="symbols">Include Symbols (!@#...)</Label>
                  <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                </div>
              </div>

              <Button onClick={generatePassword} className="w-full">
                Generate Password
              </Button>
            </CardContent>
          </Card>
        </ToolWrapper>
      );
    };

    export default PasswordGeneratorPage;