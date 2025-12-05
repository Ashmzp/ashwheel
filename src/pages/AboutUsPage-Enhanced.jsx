import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Lightbulb, Mail, Settings, ShoppingCart, BarChart, Package, Shield, Lock, Database, Heart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SeoWrapper from '@/components/SeoWrapper';

const AboutUsPage = () => {
    const features = {
        "Showroom Management": [{
            icon: <ShoppingCart className="h-6 w-6 text-primary" />,
            title: "Vehicle Purchases & Stock",
            description: "Easily manage new vehicle acquisitions and track your entire inventory in real-time."
        }, {
            icon: <Users className="h-6 w-6 text-primary" />,
            title: "Customer & Invoice Management",
            description: "Maintain detailed customer records and generate professional vehicle invoices with just a few clicks."
        }, {
            icon: <BarChart className="h-6 w-6 text-primary" />,
            title: "Comprehensive Reports",
            description: "Gain insights into your sales, stock, and profitability with powerful, easy-to-understand reports."
        }],
        "Workshop Management": [{
            icon: <Settings className="h-6 w-6 text-primary" />,
            title: "Job Card Creation",
            description: "Create and manage detailed job cards for every service, tracking labor and parts used."
        }, {
            icon: <Package className="h-6 w-6 text-primary" />,
            title: "Inventory & Spares",
            description: "Keep a precise count of your workshop inventory, from spare parts to consumables."
        }, {
            icon: <Users className="h-6 w-6 text-primary" />,
            title: "Customer Follow-ups",
            description: "Automate service reminders and follow-ups to enhance customer retention and satisfaction."
        }],
    };

    const trustPoints = [
        { icon: <Shield className="h-5 w-5" />, text: "Your data is never sold to third parties" },
        { icon: <Lock className="h-5 w-5" />, text: "End-to-end encryption for all transactions" },
        { icon: <Database className="h-5 w-5" />, text: "Automatic backups every 24 hours" },
        { icon: <Heart className="h-5 w-5" />, text: "Privacy-focused platform built for you" },
    ];

    return (
        <SeoWrapper 
            title="About Us - Ashwheel" 
            description="Learn about Ashwheel - independently built and maintained by Ashish Kumar Vishwakarma. A privacy-focused platform for automobile businesses and productivity tools."
        >
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.5 }} 
                className="bg-gradient-to-b from-background to-secondary/20"
            >
                <div className="container mx-auto px-4 py-12">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <motion.h1 
                            initial={{ y: -20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ duration: 0.7 }} 
                            className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight"
                        >
                            Built by an Individual, Made for Businesses
                        </motion.h1>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ delay: 0.3, duration: 0.7 }} 
                            className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto"
                        >
                            Ashwheel is independently built and maintained by a solo developer who understands the real challenges of running an automobile business. What started as a solution to simplify complex workflows has grown into a comprehensive platform trusted by businesses across India.
                        </motion.p>
                    </div>

                    {/* Personal Story */}
                    <div className="mb-24 max-w-4xl mx-auto">
                        <Card className="border-0 bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <h2 className="text-2xl font-bold mb-4 text-center">Why Ashwheel Exists</h2>
                                <div className="space-y-4 text-muted-foreground">
                                    <p>
                                        <strong className="text-foreground">The Problem:</strong> Managing an automobile showroom or workshop involves juggling multiple spreadsheets, manual invoices, and disconnected tools. I saw firsthand how time-consuming and error-prone this process was.
                                    </p>
                                    <p>
                                        <strong className="text-foreground">The Solution:</strong> Ashwheel was born from the need to simplify these operations. Starting with basic invoicing, it evolved into a complete management system with inventory tracking, GST compliance, workshop management, and 50+ productivity tools.
                                    </p>
                                    <p>
                                        <strong className="text-foreground">The Mission:</strong> To provide accessible, powerful tools that help businesses focus on growth rather than paperwork—without compromising on privacy or security.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Trust & Privacy */}
                    <div className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Your Trust, Our Priority</h2>
                            <p className="mt-2 text-muted-foreground">Privacy and security built into every feature</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                            {trustPoints.map((point, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex flex-col items-center text-center p-6 bg-card/50 rounded-lg border"
                                >
                                    <div className="bg-primary/10 text-primary p-3 rounded-full mb-3">
                                        {point.icon}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{point.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mission, Vision, Values */}
                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        <Card className="text-center border-0 bg-card/50 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                                    <Target className="h-8 w-8" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Our Mission</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    To provide accessible, intuitive, and powerful digital tools that streamline operations and drive sustainable growth for businesses of all sizes.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center border-0 bg-card/50 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                                    <Lightbulb className="h-8 w-8" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Our Vision</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    To become the go-to platform for automobile businesses in India, known for simplicity, reliability, and genuine care for user privacy.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="text-center border-0 bg-card/50 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300">
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                                    <Users className="h-8 w-8" />
                                </div>
                                <CardTitle className="text-2xl font-bold">Our Values</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-muted-foreground list-none space-y-1">
                                    <li><strong>Simplicity:</strong> Powerful but easy</li>
                                    <li><strong>Privacy:</strong> Your data, your control</li>
                                    <li><strong>Integrity:</strong> Honest and transparent</li>
                                    <li><strong>Innovation:</strong> Always improving</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Features Section */}
                    <div className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">The Ashwheel Pro Suite</h2>
                            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">Complete management solution for automobile businesses</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-2xl font-semibold mb-6">Showroom Management</h3>
                                <div className="space-y-6">
                                    {features["Showroom Management"].map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-4"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, amount: 0.5 }}
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
                                <h3 className="text-2xl font-semibold mb-6">Workshop Management</h3>
                                <div className="space-y-6">
                                    {features["Workshop Management"].map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-start gap-4"
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true, amount: 0.5 }}
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
                    <div className="bg-card/30 rounded-lg p-10 md:p-16 mb-24">
                        <div className="text-center mb-12">
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
                                    A passionate developer dedicated to building practical solutions for real-world problems. Ashish combines technical expertise with deep understanding of business needs to create tools that actually work.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Future Vision */}
                    <div className="mb-24 max-w-4xl mx-auto">
                        <Card className="border-0 bg-gradient-to-br from-primary/10 to-purple-500/10">
                            <CardContent className="p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4">What's Next for Ashwheel</h2>
                                <p className="text-muted-foreground mb-4">
                                    We're constantly evolving based on user feedback. Upcoming features include:
                                </p>
                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                    <div className="bg-background/50 p-4 rounded-lg">
                                        <strong className="text-foreground">Mobile App</strong>
                                        <p className="text-muted-foreground mt-1">Manage on the go</p>
                                    </div>
                                    <div className="bg-background/50 p-4 rounded-lg">
                                        <strong className="text-foreground">Advanced Analytics</strong>
                                        <p className="text-muted-foreground mt-1">Deeper business insights</p>
                                    </div>
                                    <div className="bg-background/50 p-4 rounded-lg">
                                        <strong className="text-foreground">Community Features</strong>
                                        <p className="text-muted-foreground mt-1">Connect with peers</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Get in Touch */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Have a Question or Feedback?</h2>
                        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                            I'm always open to feedback, suggestions, or just a friendly chat. Let's connect.
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
