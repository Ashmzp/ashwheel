import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { ArrowLeft, Info } from 'lucide-react';
    import {
      Accordion,
      AccordionContent,
      AccordionItem,
      AccordionTrigger,
    } from "@/components/ui/accordion";

    const ToolWrapper = ({ children, title, howToUse }) => {
      const navigate = useNavigate();

      return (
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold ml-2">{title}</h1>
          </div>
          
          {children}

          {howToUse && (
            <div className="max-w-3xl mx-auto mt-8">
              <Accordion type="single" collapsible>
                <AccordionItem value="how-to-use">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      How to use this tool?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose dark:prose-invert">
                      {howToUse}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      );
    };

    export default ToolWrapper;