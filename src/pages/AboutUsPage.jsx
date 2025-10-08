import React from 'react';
    import { motion } from 'framer-motion';
    import { Users, Target, Lightbulb, Mail, Settings, ShoppingCart, BarChart, Package } from 'lucide-react';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import SeoWrapper from '@/components/SeoWrapper';

    const AboutUsPage = () => {
        const teamMembers = [{
            name: 'Ashish Kumar Vishwakarma',
            role: 'Founder & Lead Developer',
            avatar: 'https://horizons-cdn.hostinger.com/8e45b175-3dfd-4e9f-a234-534458b8b898/6e3990494d386570dea49b516222d463.jpg',
            bio: 'A passionate developer and visionary entrepreneur dedicated to simplifying complex business processes. Ashish leads the technical development and strategic direction of Ashwheel, combining deep industry knowledge with cutting-edge technology to build solutions that matter.',
        }, ];

        const features = {
            "Showroom Management": [{
                icon: <ShoppingCart className = "h-6 w-6 text-primary" />,
                title: "Vehicle Purchases & Stock",
                description: "Easily manage new vehicle acquisitions and track your entire inventory in real-time."
            }, {
                icon: <Users className = "h-6 w-6 text-primary" />,
                title: "Customer & Invoice Management",
                description: "Maintain detailed customer records and generate professional vehicle invoices with just a few clicks."
            }, {
                icon: <BarChart className = "h-6 w-6 text-primary" />,
                title: "Comprehensive Reports",
                description: "Gain insights into your sales, stock, and profitability with powerful, easy-to-understand reports."
            }, ],
            "Workshop Management": [{
                icon: <Settings className = "h-6 w-6 text-primary" />,
                title: "Job Card Creation",
                description: "Create and manage detailed job cards for every service, tracking labor and parts used."
            }, {
                icon: <Package className = "h-6 w-6 text-primary" />,
                title: "Inventory & Spares",
                description: "Keep a precise count of your workshop inventory, from spare parts to consumables."
            }, {
                icon: <Users className = "h-6 w-6 text-primary" />,
                title: "Customer Follow-ups",
                description: "Automate service reminders and follow-ups to enhance customer retention and satisfaction."
            }, ],
        };

        return ( <
            SeoWrapper title = "About Us - Ashwheel"
            description = "Learn about the mission, vision, and the team behind Ashwheel. We are dedicated to providing the best tools and management software for your business." >
            <
            motion.div initial = {
                {
                    opacity: 0
                }
            }
            animate = {
                {
                    opacity: 1
                }
            }
            transition = {
                {
                    duration: 0.5
                }
            }
            className = "bg-gradient-to-b from-background to-secondary/20" >
            <
            div className = "container mx-auto px-4 py-12" > { /* --- Hero Section --- */ } <
            div className = "text-center mb-20" >
            <
            motion.h1 initial = {
                {
                    y: -20,
                    opacity: 0
                }
            }
            animate = {
                {
                    y: 0,
                    opacity: 1
                }
            }
            transition = {
                {
                    duration: 0.7
                }
            }
            className = "text-4xl md:text-6xl font-extrabold text-primary tracking-tight" >
            Revolutionizing Business Management. <
            /motion.h1> <
            motion.p initial = {
                {
                    y: 20,
                    opacity: 0
                }
            }
            animate = {
                {
                    y: 0,
                    opacity: 1
                }
            }
            transition = {
                {
                    delay: 0.3,
                    duration: 0.7
                }
            }
            className = "mt-6 text-lg text-muted-foreground max-w-3xl mx-auto" >
            At Ashwheel, we don 't just build software; we build solutions. From a suite of powerful online tools to a comprehensive management system for vehicle showrooms and workshops, our goal is to empower businesses to achieve peak efficiency. <
            /motion.p>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mt-4 text-sm text-muted-foreground/80 max-w-3xl mx-auto"
            >
                Ashwheel is a personal project led by Ashish Kumar Vishwakarma. We are currently in the startup phase and plan for formal business registration in the future.
            </motion.p>
             <
            /div>

            { /* --- Mission, Vision, Values --- */ } <
            div className = "grid md:grid-cols-3 gap-8 mb-24" >
            <
            Card className = "text-center border-0 bg-card/50 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300" >
            <
            CardHeader >
            <
            div className = "mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4" >
            <
            Target className = "h-8 w-8" / >
            <
            /div> <
            CardTitle className = "text-2xl font-bold" > Our Mission < /CardTitle> <
            /CardHeader> <
            CardContent >
            <
            p className = "text-muted-foreground" >
            To provide accessible, intuitive, and powerful digital tools that streamline operations, enhance productivity, and drive sustainable growth for businesses of all sizes. <
            /p> <
            /CardContent> <
            /Card> <
            Card className = "text-center border-0 bg-card/50 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300" >
            <
            CardHeader >
            <
            div className = "mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4" >
            <
            Lightbulb className = "h-8 w-8" / >
            <
            /div> <
            CardTitle className = "text-2xl font-bold" > Our Vision < /CardTitle> <
            /CardHeader> <
            CardContent >
            <
            p className = "text-muted-foreground" >
            To be the leading platform for business management solutions, renowned for our innovation, user - centric design, and unwavering commitment to customer success and technological excellence. <
            /p> <
            /CardContent> <
            /Card> <
            Card className = "text-center border-0 bg-card/50 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300" >
            <
            CardHeader >
            <
            div className = "mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4" >
            <
            Users className = "h-8 w-8" / >
            <
            /div> <
            CardTitle className = "text-2xl font-bold" > Our Values < /CardTitle> <
            /CardHeader> <
            CardContent >
            <
            ul className = "text-muted-foreground list-none space-y-1" >
            <
            li > < strong > Simplicity: < /strong> Powerful but easy.</li >
            <
            li > < strong > Efficiency: < /strong> Save time, do more.</li >
            <
            li > < strong > Integrity: < /strong> Honest and transparent.</li >
            <
            li > < strong > Innovation: < /strong> Always improving.</li >
            <
            /ul> <
            /CardContent> <
            /Card> <
            /div>

            { /* --- Features Section --- */ } <
            div className = "mb-24" >
            <
            div className = "text-center mb-12" >
            <
            h2 className = "text-3xl md:text-4xl font-bold" > The Ashwheel Pro Suite < /h2> <
            p className = "mt-2 text-muted-foreground max-w-2xl mx-auto" > An all - in - one solution designed for the modern automobile business. < /p> <
            /div> <
            div className = "grid md:grid-cols-2 gap-12" >
            <
            div >
            <
            h3 className = "text-2xl font-semibold mb-6" > Showroom Management < /h3> <
            div className = "space-y-6" > {
                features["Showroom Management"].map((feature, i) => ( <
                    motion.div key = {
                        i
                    }
                    className = "flex items-start gap-4"
                    initial = {
                        {
                            opacity: 0,
                            x: -20
                        }
                    }
                    whileInView = {
                        {
                            opacity: 1,
                            x: 0
                        }
                    }
                    viewport = {
                        {
                            once: true,
                            amount: 0.5
                        }
                    }
                    transition = {
                        {
                            delay: i * 0.1
                        }
                    } >
                    {
                        feature.icon
                    } <
                    div >
                    <
                    h4 className = "font-semibold" > {
                        feature.title
                    } < /h4> <
                    p className = "text-sm text-muted-foreground" > {
                        feature.description
                    } < /p> <
                    /div> <
                    /motion.div>
                ))
            } <
            /div> <
            /div> <
            div >
            <
            h3 className = "text-2xl font-semibold mb-6" > Workshop Management < /h3> <
            div className = "space-y-6" > {
                features["Workshop Management"].map((feature, i) => ( <
                    motion.div key = {
                        i
                    }
                    className = "flex items-start gap-4"
                    initial = {
                        {
                            opacity: 0,
                            x: 20
                        }
                    }
                    whileInView = {
                        {
                            opacity: 1,
                            x: 0
                        }
                    }
                    viewport = {
                        {
                            once: true,
                            amount: 0.5
                        }
                    }
                    transition = {
                        {
                            delay: i * 0.1
                        }
                    } >
                    {
                        feature.icon
                    } <
                    div >
                    <
                    h4 className = "font-semibold" > {
                        feature.title
                    } < /h4> <
                    p className = "text-sm text-muted-foreground" > {
                        feature.description
                    } < /p> <
                    /div> <
                    /motion.div>
                ))
            } <
            /div> <
            /div> <
            /div> <
            /div>

            { /* --- Meet the Team --- */ } <
            div className = "bg-card/30 rounded-lg p-10 md:p-16 mb-24" >
            <
            div className = "text-center mb-12" >
            <
            h2 className = "text-3xl md:text-4xl font-bold" > Meet the Visionary < /h2> <
            p className = "mt-2 text-muted-foreground" > The mind behind the magic. < /p> <
            /div> <
            div className = "flex justify-center" > {
                teamMembers.map((member) => ( <
                    div key = {
                        member.name
                    }
                    className = "text-center max-w-lg" >
                    <
                    Avatar className = "w-36 h-36 mx-auto mb-6 border-4 border-primary shadow-lg" >
                    <
                    AvatarImage src = {
                        member.avatar
                    }
                    alt = {
                        member.name
                    }
                    /> <
                    AvatarFallback > {
                        member.name.charAt(0)
                    } < /AvatarFallback> <
                    /Avatar> <
                    h3 className = "text-2xl font-semibold" > {
                        member.name
                    } < /h3> <
                    p className = "text-primary font-medium" > {
                        member.role
                    } < /p> <
                    p className = "mt-4 text-muted-foreground" > {
                        member.bio
                    } < /p> <
                    /div>
                ))
            } <
            /div> <
            /div>

            { /* --- Get in Touch --- */ } <
            div className = "text-center" >
            <
            h2 className = "text-3xl font-bold" > Have an idea or a question ? < /h2> <
            p className = "mt-2 text-muted-foreground max-w-2xl mx-auto" >
            We 're always open to feedback, collaborations, or just a friendly chat. Let'
            s connect. <
            /p> <
            a href = "mailto:support@ashwheel.com"
            className = "mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-105" >
            <
            Mail className = "h-5 w-5" / >
            Get in Touch <
            /a> <
            /div> <
            /div> <
            /motion.div> <
            /SeoWrapper>
        );
    };

    export default AboutUsPage;