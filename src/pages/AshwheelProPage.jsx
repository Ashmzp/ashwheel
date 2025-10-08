import React from 'react';
    import { Helmet } from 'react-helmet-async';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { CheckCircle, BarChart2, Users, HardHat, Car, Wrench, ArrowRight } from 'lucide-react';
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
    const features = [{
      icon: Car,
      title: "Showroom Management",
      description: "Effortlessly manage vehicle stock, sales, invoicing, and customer records. Get a complete overview of your showroom's performance."
    }, {
      icon: Wrench,
      title: "Workshop Management",
      description: "Create digital job cards, manage spare parts inventory, handle billing, and track service history with our integrated workshop module."
    }, {
      icon: BarChart2,
      title: "Advanced Analytics",
      description: "Gain deep insights with real-time reports on sales, stock, and workshop performance. Make data-driven decisions to boost profitability."
    }];
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
      return <>
                <Helmet>
                    <title>Ashwheel Pro - Complete Management Software for Automobile Dealerships</title>
                    <meta name="description" content="Discover Ashwheel Pro, the all-in-one software solution for automobile showrooms and workshops. Manage stock, sales, job cards, and analytics in a single, powerful platform." />
                    <meta name="keywords" content="automobile dealership software, showroom management, workshop management, car dealer software, crm for automobile, job card software, vehicle inventory management" />
                </Helmet>

                <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-800 dark:text-gray-200">
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
                                The Ultimate Software for Your Automobile Business
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
                                Ashwheel Pro integrates your showroom and workshop operations into one seamless platform, giving you complete control and insights to drive growth.
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
              }} className="mt-10">
                                <Button size="lg" asChild>
                                    <Link to="/login">Get Started Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                </Button>
                            </motion.div>
                        </div>
                    </motion.section>

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
                    <section className="py-20 px-4">
                        <div className="container mx-auto text-center">
                            <motion.h2 initial={{
                opacity: 0,
                y: 20
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} className="text-3xl md:text-4xl font-bold">
                                Ready to Transform Your Dealership?
                            </motion.h2>
                            <motion.p initial={{
                opacity: 0,
                y: 20
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: 0.2
              }} className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Successful dealers who trust Ashwheel Pro to streamline their operations and boost their bottom line.</motion.p>
                            <motion.div initial={{
                scale: 0.8,
                opacity: 0
              }} whileInView={{
                scale: 1,
                opacity: 1
              }} viewport={{
                once: true
              }} transition={{
                delay: 0.4,
                duration: 0.5
              }} className="mt-8">
                                <Button size="lg" asChild>
                                    <a href="mailto:support@ashwheel.com">Contact Now</a>
                                </Button>
                            </motion.div>
                        </div>
                    </section>
                </div>
            </>;
    };
    export default AshwheelProPage;