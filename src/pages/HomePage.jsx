
import React, { useState, useMemo, useEffect } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { useNavigate, useLocation } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { FileText, Image, Video, Scissors, FileJson, FileType, Split, Merge, Minimize as Compress, Type, QrCode, Calculator, Percent, Calendar, Link2, Download, User, Shield, FileImage, FileUp, FileDown, PenSquare, Clock, Hash, Palette, TextSelection as TextSearch, ZoomIn, Crop, Repeat, Sparkles, Facebook, Instagram, Youtube, Heart, Edit, KeyRound, Scale, Paintbrush, CaseSensitive, Weight, Code, Timer, BookText, CheckSquare, Vote, Layers } from 'lucide-react';

    const toolCategories = {
        "PDF Tools": {
            id: "pdf-tools",
            icon: FileText,
            color: "text-red-500",
            tools: [
                { name: "PDF Editor", path: "/tools/pdf-editor", icon: Edit, description: "Edit, annotate, and sign PDF documents online." },
                { name: "Split PDF", path: "/tools/split-pdf", icon: Split, description: "Divide a PDF into single pages or extract specific ranges." },
                { name: "Merge PDF", path: "/tools/merge-pdf", icon: Merge, description: "Combine multiple PDF files into one document." },
                { name: "Compress PDF", path: "/tools/compress-pdf", icon: Compress, description: "Reduce PDF file size without losing quality." },
                { name: "PDF to JPEG", path: "/tools/pdf-to-jpeg", icon: FileImage, description: "Convert PDF pages to high-quality JPEG images." },
                { name: "PDF to Text", path: "/tools/pdf-to-text", icon: TextSearch, description: "Extract selectable text from PDF documents." },
                { name: "JPEG to PDF", path: "/tools/jpeg-to-pdf", icon: FileUp, description: "Convert images (JPG, PNG) into a single PDF." },
                { name: "Word to PDF", path: "/tools/word-to-pdf", icon: FileType, description: "Convert DOCX files to PDF online." },
            ]
        },
        "Image Tools": {
            id: "image-tools",
            icon: Image,
            color: "text-blue-500",
            tools: [
                { name: "CanvasCraft", path: "/tools/canvas-craft", icon: Layers, description: "Design custom layouts with photos and PDFs on a canvas." },
                { name: "Crop Anything", path: "/tools/crop-anything", icon: Scissors, description: "Crop any image or PDF freely and download the result." },
                { name: "Image Compressor", path: "/tools/image-compressor", icon: ZoomIn, description: "Optimize images for web without quality loss." },
                { name: "Image Resizer", path: "/tools/image-resizer", icon: Crop, description: "Resize images to custom dimensions or file size." },
                { name: "JPEG to PNG", path: "/tools/jpeg-to-png", icon: Repeat, description: "Convert JPEG to PNG with transparency support." },
                { name: "PNG to JPEG", path: "/tools/png-to-jpeg", icon: Repeat, description: "Convert PNG to JPEG with background color options." },
                { name: "Passport Photo Maker", path: "/tools/passport-photo-maker", icon: User, description: "Create print-ready passport/visa photos." },
                { name: "Aadhaar Formatter", path: "/tools/aadhaar-formatter", icon: Shield, description: "Format e-Aadhaar for A4 printing (PVC card size)." },
            ]
        },
        "Productivity & Utility Tools": {
            id: "productivity-utility-tools",
            icon: Sparkles,
            color: "text-indigo-500",
            tools: [
                { name: "Password Generator", path: "/tools/password-generator", icon: KeyRound, description: "Generate strong, secure, and random passwords." },
                { name: "Unit Converter", path: "/tools/unit-converter", icon: Scale, description: "Convert between various units of measurement." },
                { name: "Color Picker & Palette", path: "/tools/color-picker", icon: Paintbrush, description: "Pick colors and generate beautiful palettes." },
                { name: "Text Case Converter", path: "/tools/text-case-converter", icon: CaseSensitive, description: "Convert text to different cases like UPPERCASE, lowercase, etc." },
                { name: "BMI Calculator", path: "/tools/bmi-calculator", icon: Weight, description: "Calculate your Body Mass Index (BMI)." },
                { name: "JSON Formatter", path: "/tools/json-formatter", icon: Code, description: "Format and validate JSON data." },
                { name: "Pomodoro Timer", path: "/tools/pomodoro-timer", icon: Timer, description: "Boost your focus with the Pomodoro technique." },
                { name: "Text Summarizer", path: "/tools/text-summarizer", icon: BookText, description: "Get a quick summary of any long text." },
                { name: "Habit Tracker", path: "/tools/habit-tracker", icon: CheckSquare, description: "Track your daily habits and build streaks." },
                { name: "Poll Maker", path: "/tools/poll-maker", icon: Vote, description: "Create and share simple polls instantly." },
            ]
        },
        "Video & Content Tools": {
            id: "video-content-tools",
            icon: Video,
            color: "text-purple-500",
            tools: [
                { name: "Thumbnail Downloader", path: "/tools/thumbnail-downloader", icon: FileDown, description: "Download high-quality YouTube video thumbnails." },
                { name: "Word Counter", path: "/tools/word-counter", icon: Hash, description: "Count words, characters, sentences, and paragraphs." },
            ]
        },
        "Generators & Calculators": {
            id: "generators-calculators",
            icon: Calculator,
            color: "text-green-500",
            tools: [
                { name: "QR Code Generator", path: "/tools/qr-code-generator", icon: QrCode, description: "Create custom QR codes with colors and logos." },
                { name: "Magic QR Generator", path: "/tools/magic-qr-code-generator", icon: Sparkles, description: "Combine all your links into one dynamic QR code." },
                { name: "GST Calculator", path: "/tools/gst-calculator", icon: Percent, description: "Calculate Goods and Services Tax (GST) for India." },
                { name: "EMI Calculator", path: "/tools/emi-calculator", icon: Calculator, description: "Calculate Equated Monthly Installments for loans." },
                { name: "SIP Calculator", path: "/tools/sip-calculator", icon: Percent, description: "Project returns on your Systematic Investment Plans." },
                { name: "Taxable Amount Calculator", path: "/tools/taxable-amount-calculator", icon: Percent, description: "Find taxable value from total amount (reverse GST)." },
                { name: "Age Calculator", path: "/tools/age-calculator", icon: Calendar, description: "Calculate exact age from date of birth." },
                { name: "Date Difference", path: "/tools/date-difference-calculator", icon: Clock, description: "Find the duration between two dates." },
            ]
        },
        "Web & Other Tools": {
            id: "web-other-tools",
            icon: Link2,
            color: "text-yellow-500",
            tools: [
                { name: "URL Shortener", path: "/tools/url-shortener", icon: Link2, description: "Create short, memorable, and custom links." },
                { name: "Invoice Generator", path: "/tools/invoice-generator", icon: FileJson, description: "Generate professional PDF invoices for free." },
                { name: "Resume Builder", path: "/tools/resume-builder", icon: PenSquare, description: "Build a professional resume with templates." },
                { name: "Marriage Biodata Maker", path: "/tools/marriage-biodata-maker", icon: Heart, description: "Create beautiful biodata for marriage proposals." },
            ]
        }
    };

    const HomePage = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const navigate = useNavigate();
        const location = useLocation();

        useEffect(() => {
            if (location.pathname === '/' && location.hash) {
                const id = location.hash.substring(1);
                const element = document.getElementById(id);
                if (element) {
                    const headerOffset = 80; // height of sticky header
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            } else {
                window.scrollTo(0, 0);
            }
        }, [location]);

        const filteredTools = useMemo(() => {
            if (!searchTerm) {
                return toolCategories;
            }
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = {};
            for (const category in toolCategories) {
                const matchingTools = toolCategories[category].tools.filter(tool =>
                    tool.name.toLowerCase().includes(lowercasedFilter) ||
                    tool.description.toLowerCase().includes(lowercasedFilter)
                );
                if (matchingTools.length > 0) {
                    filtered[category] = { ...toolCategories[category], tools: matchingTools };
                }
            }
            return filtered;
        }, [searchTerm]);

        const containerVariants = {
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: 0.1
                }
            }
        };

        const itemVariants = {
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 }
        };
        
        const handleToolClick = (path) => {
          navigate(path);
        };
        
        const handleCategoryClick = (id) => {
            const element = document.getElementById(id);
            if (element) {
                const headerOffset = 80; // height of sticky header
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        };

        return (
            <>
                <Helmet>
                    <title>Ashwheel - Free Online Tools for PDF, Images, & More</title>
                    <meta name="description" content="Ashwheel offers a powerful suite of free online tools. Edit videos, manage PDFs, convert images, and use financial calculators—all in one place. Simplify your daily tasks with our efficient and user-friendly web tools." />
                    <meta name="keywords" content="free online tools, pdf editor, image converter, video editor, gst calculator, resume builder, ashwheel, productivity tools, online utilities, document management, photo editing, financial calculators" />
                </Helmet>
                <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
                    <div className="container mx-auto px-4 py-8 md:py-16">
                        <header className="text-center mb-12">
                            <motion.h1
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary"
                            >
                                Welcome to Ashwheel Tools
                            </motion.h1>
                            <motion.p initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{duration: 0.5, delay: 0.4}} className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                                Unlock your productivity with our collection of free, easy-to-use online tools. From PDF conversion and image editing to financial calculators and resume building, we have everything you need to get things done faster and more efficiently.
                            </motion.p>
                        </header>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="mb-12 max-w-2xl mx-auto"
                        >
                            <Input
                                type="text"
                                name="tool-search"
                                id="tool-search"
                                placeholder="Search for a tool... (e.g., 'PDF', 'Image Compressor', 'GST Calculator')"
                                className="w-full p-6 text-lg rounded-full shadow-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </motion.div>

                        <main id="tools">
                            {Object.keys(filteredTools).length > 0 ? (
                                Object.entries(filteredTools).map(([category, { id, icon: CategoryIcon, color, tools }]) => (
                                    <motion.section
                                        key={category}
                                        id={id}
                                        className="mb-12 scroll-mt-20"
                                        variants={itemVariants}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, amount: 0.2 }}
                                    >
                                        <h2 className={`text-2xl font-bold mb-6 flex items-center ${color} cursor-pointer`} onClick={() => handleCategoryClick(id)}>
                                            <CategoryIcon className="mr-3 h-7 w-7" />
                                            {category}
                                        </h2>
                                        <motion.div
                                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            {tools.map(tool => (
                                                <motion.div key={tool.path} variants={itemVariants}>
                                                    <Card 
                                                        onClick={() => handleToolClick(tool.path)}
                                                        className="h-full hover:shadow-xl hover:-translate-y-1 transition-transform duration-300 ease-in-out group cursor-pointer"
                                                    >
                                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                            <CardTitle className="text-base font-medium">{tool.name}</CardTitle>
                                                            <tool.icon className={`h-6 w-6 ${color} group-hover:scale-110 transition-transform`} />
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </motion.section>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-16"
                                >
                                    <p className="text-xl text-muted-foreground">No tools found for "{searchTerm}"</p>
                                </motion.div>
                            )}
                        </main>
                    </div>
                </div>
            </>
        );
    };

    export default HomePage;
