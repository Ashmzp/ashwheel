import React from 'react';
import { Check, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ComparisonSection = () => {
  const whatsappUrl = "https://wa.me/917275277076?text=Hi,%20I%20want%20Ashwheel%20Pro%20demo";

  const comparisons = [
    { feature: "Invoice making", manual: "Handwritten / Excel", pro: "1-click GST invoice" },
    { feature: "GST calculation", manual: "Manual mistake chance", pro: "Auto GST calculation" },
    { feature: "Customer records", manual: "Register / files", pro: "Digital customer database" },
    { feature: "Chassis / Engine tracking", manual: "Yaad rakhna padta", pro: "Saved & searchable" },
    { feature: "Invoice history", manual: "Files kho sakti hain", pro: "Lifetime secure history" },
    { feature: "Editing / correction", manual: "Mushkil", pro: "Easy & instant" },
    { feature: "Reports", manual: "Nahi", pro: "Sales & GST reports" },
    { feature: "Professional look", manual: false, pro: true },
    { feature: "Time saving", manual: false, pro: true },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ashwheel Pro vs Manual Billing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manual billing me galti aur time loss hota hai. Ashwheel Pro se billing fast, safe aur professional banti hai.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-card rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="py-4 px-6 text-left font-semibold">Feature</th>
                  <th className="py-4 px-6 text-left font-semibold">Manual Billing</th>
                  <th className="py-4 px-6 text-left font-semibold bg-green-600">Ashwheel Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-secondary/30' : 'bg-background'}>
                    <td className="py-4 px-6 font-medium">{item.feature}</td>
                    <td className="py-4 px-6">
                      {typeof item.manual === 'boolean' ? (
                        item.manual ? <Check className="text-green-500" /> : <X className="text-red-500" />
                      ) : (
                        <span className="text-muted-foreground">{item.manual}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 bg-green-50 dark:bg-green-950/20">
                      {typeof item.pro === 'boolean' ? (
                        item.pro ? <Check className="text-green-600 font-bold" /> : <X className="text-red-500" />
                      ) : (
                        <span className="font-semibold text-green-700 dark:text-green-400">{item.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <p className="text-xl font-semibold mb-2">Still using manual billing?</p>
            <p className="text-muted-foreground mb-6">Switch to Ashwheel Pro and save time everyday.</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg px-8 py-6 shadow-xl animate-pulse">
                <MessageCircle className="mr-2 h-5 w-5" />
                Get Free Demo on WhatsApp
              </Button>
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              🎉 Special startup offer available • No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
