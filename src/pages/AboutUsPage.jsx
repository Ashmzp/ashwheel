import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Lightbulb, Mail, Settings, ShoppingCart, BarChart, Package, Shield, Lock, Database, Heart, Smartphone, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SeoWrapper from '@/components/SeoWrapper';

const AboutUsPage = () => {
    const features = {
        "Showroom Management": [{
            icon: <ShoppingCart className="h-6 w-6 text-primary" />,
            title: "Vehicle Purchases & Stock",
            description: "Vehicle purchases & live stock tracking"
        }, {
            icon: <Users className="h-6 w-6 text-primary" />,
            title: "Customer & Invoicing",
            description: "Customer records & professional invoicing"
        }, {
            icon: <BarChart className="h-6 w-6 text-primary" />,
            title: "Sales Reports",
            description: "Clear sales and profitability reports"
        }],
        "Workshop Management": [{
            icon: <Settings className="h-6 w-6 text-primary" />,
            title: "Job Card System",
            description: "Job card creation and service tracking"
        }, {
            icon: <Package className="h-6 w-6 text-primary" />,
            title: "Inventory Management",
            description: "Inventory & spare parts management"
        }, {
            icon: <Users className="h-6 w-6 text-primary" />,
            title: "Service Reminders",
            description: "Automated service reminders and follow-ups"
        }],
    };

    const trustPoints = [
        { icon: <Shield className="h-5 w-5" />, text: "Your data is never sold or shared" },
        { icon: <Lock className="h-5 w-5" />, text: "Secure encryption for all operations" },
        { icon: <Database className="h-5 w-5" />, text: "Automatic backups every 24 hours" },
        { icon: <Heart className="h-5 w-5" />, text: "Privacy-first architecture" },
    ];

    const futureFeatures = [
        { icon: <Smartphone className="h-6 w-6" />, title: "Mobile App", desc: "Manage on the go" },
        { icon: <TrendingUp className="h-6 w-6" />, title: "Advanced Analytics", desc: "Deeper insights" },
        { icon: <Users className="h-6 w-6" />, title: "Community", desc: "Learn & grow together" },
    ];

    return (
        <SeoWrapper 
            title="About Us - Ashwheel | Built by an Individual for Real Businesses" 
            description="Ashwheel is independently built by Ashish Kumar Vishwakarma. A privacy-focused platform for automobile businesses with 50+ tools and complete management system."
        >
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.5 }} 
                className="bg-gradient-to-b from-background to-secondary/20"
            >
                <div className="container mx-auto px-4 py-12">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <motion.h1 
                            initial={{ y: -20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ duration: 0.7 }} 
                            className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight"
                        >
                            Built by an Individual, Made for Real Businesses
                        </motion.h1>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ delay: 0.3, duration: 0.7 }} 
                            className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto"
                        >
                            Ashwheel is independently built and maintained by a solo developer who understands the real challenges of running an automobile showroom or workshop. What started as a personal solution has grown into a focused platform trusted by automobile businesses across India.
                        </motion.p>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.7 }}
                            className="mt-4 text-sm text-muted-foreground/80 max-w-2xl mx-auto italic"
                        >
                            Ashwheel is a personal project led by Ashish Kumar Vishwakarma. We are currently in the startup phase and plan for formal business registration in the future.
                        </motion.p>
                    </div>

                    {/* Why Ashwheel Exists */}
                    <div className="mb-20 max-w-4xl mx-auto">
                        <Card className="border-0 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold mb-6 text-center">Why Ashwheel Exists</h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">The Problem</h3>
                                        <p>
                                            Managing an automobile business often means handling multiple spreadsheets, manual invoices, stock registers, and disconnected tools. I experienced firsthand how inefficient and error-prone this setup can be.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">The Solution</h3>
                                        <p>
                                            Ashwheel was created to bring everything under one roof. It began with simple invoicing and gradually evolved into a complete management system covering inventory, GST compliance, workshop operations, and 50+ practical productivity tools.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">The Mission</h3>
                                        <p>
                                            To help businesses focus on growth, customers, and profitability—not paperwork—while maintaining complete control over their data.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Trust & Privacy */}
                    <div className="mb-20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-bold">Your Trust Comes First</h2>
                            <p className="mt-2 text-muted-foreground">Privacy and security built into every layer</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                            {trustPoints.map((point, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex flex-col items-center text-center p-6 bg-card/50 rounded-lg border hover:border-primary transition-colors"
                                >
                                    <div className="bg-primary/10 text-primary p-3 rounded-full mb-3">
                                        {point.icon}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{point.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Vision & Values */}
                    <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-5xl mx-auto">
                        <Card className="text-center border-0 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                                    <Target className="h-8 w-8" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Our Vision</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    To become the most trusted and easy-to-use platform for automobile businesses in India—known for simplicity, reliability, and respect for user privacy.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center border-0 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                                    <Lightbulb className="h-8 w-8" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Our Values</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-muted-foreground space-y-2 text-left">
                                    <li><strong className="text-foreground">Simplicity</strong> – Powerful features, easy workflows</li>
                                    <li><strong className="text-foreground">Privacy</strong> – Your data, your control</li>
                                    <li><strong className="text-foreground">Integrity</strong> – Honest pricing, transparent operations</li>
                                    <li><strong className="text-foreground">Innovation</strong> – Continuous improvement</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Features Section */}
                    <div className="mb-20">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">The Ashwheel Pro Suite</h2>
                            <p className="mt-2 text-muted-foreground">Complete all-in-one management solution</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                            <div>
                                <h3 className="text-2xl font-semibold mb-6 text-center md:text-left">Showroom Management</h3>
                                <div className="space-y-4">
                                    {features["Showroom Management"].map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-4 p-4 bg-card/30 rounded-lg"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            {feature.icon}
                                            <div>
                                                <h4 className="font-semibold">{feature.title}</h4>
                                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-6 text-center md:text-left">Workshop Management</h3>
                                <div className="space-y-4">
                                    {features["Workshop Management"].map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-4 p-4 bg-card/30 rounded-lg"
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            {feature.icon}
                                            <div>
                                                <h4 className="font-semibold">{feature.title}</h4>
                                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meet the Founder */}
                    <div className="bg-card/30 rounded-lg p-10 md:p-16 mb-20">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-bold">Meet the Founder</h2>
                            <p className="mt-2 text-muted-foreground">The person behind Ashwheel</p>
                        </div>
                        <div className="flex justify-center">
                            <div className="text-center max-w-lg">
                                <Avatar className="w-36 h-36 mx-auto mb-6 border-4 border-primary shadow-lg">
                                    <AvatarImage 
                                        src="https://horizons-cdn.hostinger.com/8e45b175-3dfd-4e9f-a234-534458b8b898/6e3990494d386570dea49b516222d463.jpg" 
                                        alt="Ashish Kumar Vishwakarma" 
                                    />
                                    <AvatarFallback>AK</AvatarFallback>
                                </Avatar>
                                <h3 className="text-2xl font-semibold">Ashish Kumar Vishwakarma</h3>
                                <p className="text-primary font-medium">Founder & Lead Developer</p>
                                <p className="text-sm text-muted-foreground mt-1">📍 Mirzapur, Uttar Pradesh, India</p>
                                <p className="mt-4 text-muted-foreground">
                                    A passionate independent developer building practical tools for real-world business problems. Ashish combines strong technical skills with real operational understanding to create solutions that actually work on the ground.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What's Next */}
                    <div className="mb-20 max-w-4xl mx-auto">
                        <Card className="border-0 bg-gradient-to-br from-primary/10 to-purple-500/10">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold mb-4 text-center">What's Next for Ashwheel</h2>
                                <p className="text-muted-foreground mb-6 text-center">
                                    Continuously evolving based on real user feedback
                                </p>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {futureFeatures.map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-background/50 p-6 rounded-lg text-center"
                                        >
                                            <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mx-auto mb-3">
                                                {feature.icon}
                                            </div>
                                            <strong className="text-foreground block mb-1">{feature.title}</strong>
                                            <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Get in Touch */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Have a Question or Suggestion?</h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                            I'm always open to feedback, ideas, or a simple conversation. Let's build better tools together.
                        </p>
                        <a 
                            href="mailto:support@ashwheel.cloud" 
                            className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-105"
                        >
                            <Mail className="h-5 w-5" />
                            Get in Touch
                        </a>
                    </div>
                </div>
            </motion.div>
        </SeoWrapper>
    );
};

export default AboutUsPage;
