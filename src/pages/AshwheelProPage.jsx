import React, { useState } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { CheckCircle, BarChart2, Users, Car, ArrowRight, Sparkles, Clock, Shield, FileText, Zap, Smartphone, Printer, CreditCard } from 'lucide-react';
    const featureVariants = {
      hidden: {
        opacity: 0,
        y: 50
      },
      visible: i => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.1,
          duration: 0.5
        }
      })
    };
    const features = [
      { icon: FileText, title: "GST Invoicing", description: "Create professional GST and non-GST bills with HSN/SAC codes, tax breakdowns, and invoice numbers in 30 seconds." },
      { icon: Zap, title: "Quick Sale Entry", description: "Fast billing with barcode scanning, party selection, and instant invoice generation for smooth operations." },
      { icon: Sparkles, title: "Customize Bills", description: "Brand your invoices with ready-built templates, terms, payment details, and company logo." },
      { icon: Users, title: "Party-Wise Reports", description: "Track sales by customer/dealer with detailed party-wise sale reports and outstanding balances." },
      { icon: BarChart2, title: "Stock Reports", description: "Model & color-wise stock tracking with aging analysis (New, Medium, Old stock) and real-time inventory." },
      { icon: Car, title: "Vehicle Management", description: "Complete vehicle tracking with chassis numbers, engine numbers, colors, and stock days monitoring." }
    ];
    const howItWorksSteps = [{
      title: "Setup Now",
      description: "Create your account and configure your dealership settings in minutes. Add your company details, GST information, and user roles."
    }, {
      title: "Manage Operations",
      description: "Use the intuitive dashboard to manage daily showroom and workshop activities—from adding new stock to creating job cards."
    }, {
      title: "Analyze & Grow",
      description: "Leverage powerful reports to track your business's health, identify growth opportunities, and optimize your operations."
    }];
    const AshwheelProPage = () => {
      const [activeTab, setActiveTab] = useState('tax-invoicing');
      
      const billingFeatures = {
        'tax-invoicing': {
          title: 'GST Invoicing',
          description: 'With our powerful invoicing solution, create professional GST and non-GST bills easily on your PC in just a few clicks or within 30 seconds.',
          details: 'Generate accurate bills with HSN/SAC codes, tax breakdowns, and invoice numbers, ensuring full compliance.',
          image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
        },
        'quick-sale': {
          title: 'Quick Sale Entry',
          description: 'Lightning-fast billing process designed for high-volume sales. Enter vehicle details, select party, and generate invoice instantly.',
          details: 'Barcode scanning, auto-fill party details, and one-click invoice generation for seamless operations.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'
        },
        'customize-bill': {
          title: 'Customize Your Bill',
          description: 'Bring your brand closer to customers by customizing bills with ready-built templates, terms, and payment details.',
          details: 'Add company logo, customize colors, include terms & conditions, and personalize payment instructions.',
          image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'
        }
      };
      
      return <>
                <Helmet>
                    <title>Ashwheel Pro - Complete Management Software for Automobile Dealerships</title>
                    <meta name="description" content="Discover Ashwheel Pro, the all-in-one software solution for automobile showrooms and workshops. Manage stock, sales, job cards, and analytics in a single, powerful platform." />
                    <meta name="keywords" content="automobile dealership software, showroom management, workshop management, car dealer software, crm for automobile, job card software, vehicle inventory management" />
                </Helmet>

                <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-800 dark:text-gray-200">
                    {/* Free Trial Banner */}
                    <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white py-3 px-4 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Sparkles className="h-5 w-5 animate-pulse" />
                            <span className="font-bold text-lg">🎉 30 Days FREE Trial</span>
                            <span className="hidden sm:inline">|</span>
                            <span className="text-sm">Full Access to All Modules • No Credit Card Required</span>
                        </div>
                    </motion.div>

                    {/* Hero Section */}
                    <motion.section initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            duration: 0.8
          }} className="relative text-center py-20 md:py-32 px-4 overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
                        <div className="relative z-10">
                            <motion.div
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/20 border border-yellow-400 mb-6"
                            >
                                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">ASHWHEEL PRO</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-black font-semibold">SaaS for Auto Businesses</span>
                            </motion.div>
                            <motion.h1 initial={{
                y: -30,
                opacity: 0
              }} animate={{
                y: 0,
                opacity: 1
              }} transition={{
                duration: 0.7,
                delay: 0.2
              }} className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
                                Essential PC Billing Software for Indian Automobile Businesses
                            </motion.h1>
                            <motion.p initial={{
                y: 30,
                opacity: 0
              }} animate={{
                y: 0,
                opacity: 1
              }} transition={{
                duration: 0.7,
                delay: 0.4
              }} className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
                                Complete billing, inventory, and reporting solution for automobile showrooms & workshops. GST-compliant invoicing, stock management, and party-wise sales tracking in one powerful platform.
                            </motion.p>
                            <motion.div initial={{
                scale: 0.8,
                opacity: 0
              }} animate={{
                scale: 1,
                opacity: 1
              }} transition={{
                duration: 0.5,
                delay: 0.6
              }} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" asChild>
                                    <Link to="/signup">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild>
                                    <Link to="/login">Sign In</Link>
                                </Button>
                            </motion.div>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                No credit card required
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Cancel anytime
                            </motion.p>
                        </div>
                    </motion.section>

                    {/* Trial Benefits Section */}
                    <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                        <div className="container mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold">Why Start Your Free Trial Today?</h2>
                                <p className="mt-4 text-lg text-muted-foreground">Experience the full power of Ashwheel Pro risk-free</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                <Card className="text-center p-6 border-2 hover:border-primary transition-colors">
                                    <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
                                    <h3 className="font-bold text-xl mb-2">30 Days Full Access</h3>
                                    <p className="text-muted-foreground">Try every feature without limitations</p>
                                </Card>
                                <Card className="text-center p-6 border-2 hover:border-primary transition-colors">
                                    <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                                    <h3 className="font-bold text-xl mb-2">No Payment Required</h3>
                                    <p className="text-muted-foreground">Start immediately, no credit card needed</p>
                                </Card>
                                <Card className="text-center p-6 border-2 hover:border-primary transition-colors">
                                    <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                                    <h3 className="font-bold text-xl mb-2">Expert Support</h3>
                                    <p className="text-muted-foreground">Get help whenever you need it</p>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* Billing Features Section */}
                    <section className="py-20 px-4 bg-white dark:bg-gray-900">
                        <div className="container mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold mb-4">Essential PC Billing Software Features for Indian Businesses</h2>
                                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Everything you need to run your automobile business efficiently</p>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-3 mb-12">
                                {Object.entries(billingFeatures).map(([key, feature]) => (
                                    <Button
                                        key={key}
                                        variant={activeTab === key ? 'default' : 'outline'}
                                        onClick={() => setActiveTab(key)}
                                        className={activeTab === key ? 'bg-red-500 hover:bg-red-600' : ''}
                                    >
                                        {feature.title}
                                    </Button>
                                ))}
                            </div>

                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto"
                            >
                                <div className="order-2 md:order-1">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8">
                                        <h3 className="text-3xl font-bold mb-4">{billingFeatures[activeTab].title}</h3>
                                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                                            <span>Available on</span>
                                            <Smartphone className="h-4 w-4" />
                                            <Printer className="h-4 w-4" />
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <p className="text-lg mb-4">
                                            With our <span className="text-blue-600 font-semibold">powerful invoicing solution</span>, {billingFeatures[activeTab].description}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {billingFeatures[activeTab].details}
                                        </p>
                                    </div>
                                </div>
                                <div className="order-1 md:order-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-purple-500 rounded-2xl blur-2xl opacity-20"></div>
                                        <img 
                                            src={billingFeatures[activeTab].image} 
                                            alt={billingFeatures[activeTab].title}
                                            className="relative rounded-2xl shadow-2xl w-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-20 px-4 bg-secondary/20">
                        <div className="container mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Succeed</h2>
                                <p className="mt-4 text-lg text-muted-foreground">Powerful features designed specifically for the automobile industry.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {features.map((feature, index) => <motion.div key={index} custom={index} initial="hidden" whileInView="visible" viewport={{
                  once: true
                }} variants={featureVariants}>
                                        <Card className="h-full text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                            <CardHeader>
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                                    <feature.icon className="h-6 w-6 text-primary" />
                                                </div>
                                                <CardTitle className="mt-4">{feature.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground">{feature.description}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>)}
                            </div>
                        </div>
                    </section>
                    
                    {/* How It Works Section */}
                    <section className="py-20 px-4">
                        <div className="container mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold">Simple to Start, Powerful to Use</h2>
                                 <p className="mt-4 text-lg text-muted-foreground">Get up and running in three simple steps.</p>
                            </div>
                            <div className="relative">
                                <div className="absolute left-1/2 top-12 bottom-12 w-0.5 bg-border -translate-x-1/2 hidden md:block"></div>
                                {howItWorksSteps.map((step, index) => <motion.div key={index} initial={{
                  opacity: 0,
                  x: index % 2 === 0 ? -100 : 100
                }} whileInView={{
                  opacity: 1,
                  x: 0
                }} viewport={{
                  once: true
                }} transition={{
                  duration: 0.6,
                  delay: index * 0.2
                }} className={`relative flex items-center mb-12 md:mb-20 ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                                        <div className="hidden md:block absolute left-1/2 w-8 h-8 bg-primary rounded-full -translate-x-1/2 border-4 border-background flex items-center justify-center text-white font-bold">{index + 1}</div>
                                        <div className="md:w-5/12">
                                            <Card className="p-6">
                                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                                <p className="text-muted-foreground">{step.description}</p>
                                            </Card>
                                        </div>
                                        <div className="md:w-2/12"></div>
                                    </motion.div>)}
                            </div>
                        </div>
                    </section>


                    {/* Reports Showcase */}
                    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                        <div className="container mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Reports & Analytics</h2>
                                <p className="text-lg text-muted-foreground">Make data-driven decisions with comprehensive business insights</p>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                                <Card className="hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                                            <BarChart2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <CardTitle>Stock Reports</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Model & Color-wise stock tracking</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Stock aging analysis (New/Medium/Old)</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Real-time inventory updates</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <CardTitle>Party-Wise Sale</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Customer/Dealer-wise sales tracking</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Outstanding balance management</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Summary & detailed views</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                                            <Car className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <CardTitle>Vehicle Tracking</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Chassis & Engine number tracking</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Stock days monitoring</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>Complete vehicle history</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* Screenshot/Demo Section */}
                    <section className="py-20 px-4 bg-secondary/20">
                        <div className="container mx-auto">
                             <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-bold">See Ashwheel Pro in Action</h2>
                                <p className="mt-4 text-lg text-muted-foreground">A glimpse into our clean and intuitive interface.</p>
                            </div>
                            <motion.div initial={{
                opacity: 0,
                scale: 0.9
              }} whileInView={{
                opacity: 1,
                scale: 1
              }} viewport={{
                once: true
              }} transition={{
                duration: 0.7
              }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border">
                                <img class="rounded-lg w-full" alt="Ashwheel Pro Dashboard Screenshot" src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b" />
                            </motion.div>
                        </div>
                    </section>
                    
                    {/* Call to Action */}
                    <section className="py-20 px-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white">
                        <div className="container mx-auto text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="max-w-4xl mx-auto"
                            >
                                <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
                                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                    Start Your 30-Day Free Trial Now!
                                </h2>
                                <p className="text-xl mb-8 opacity-90">
                                    Join hundreds of successful dealers who trust Ashwheel Pro
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                                    <Button size="lg" variant="secondary" className="text-primary font-bold" asChild>
                                        <Link to="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                    </Button>
                                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                                        <a href="mailto:support@ashwheel.cloud">Contact Sales</a>
                                    </Button>
                                </div>
                                <div className="flex flex-wrap justify-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Full Access to All Modules</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>No Credit Card Required</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        <span>Cancel Anytime</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </section>
                </div>
            </>;
    };
    export default AshwheelProPage;