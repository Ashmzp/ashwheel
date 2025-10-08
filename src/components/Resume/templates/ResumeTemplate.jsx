import React from 'react';

const Section = ({ title, children, className = '', titleClassName = '' }) => (
    <section className={`mt-6 ${className}`}>
        <h2 className={`text-xl font-bold pb-1 mb-3 ${titleClassName}`}>{title}</h2>
        {children}
    </section>
);

const ExperienceItem = ({ exp, className = '' }) => (
    <div className={`mb-4 break-inside-avoid ${className}`}>
        <h3 className="text-lg font-semibold">{exp.jobTitle}</h3>
        <p className="font-medium">{exp.company}</p>
        <p className="text-xs text-muted-foreground">{exp.startDate} - {exp.endDate || 'Present'}</p>
        <ul className="list-disc pl-5 mt-1">
            {exp.description.split('\n').map((line, i) => line && <li key={i} className="text-sm">{line}</li>)}
        </ul>
    </div>
);

const EducationItem = ({ edu, className = '' }) => (
    <div className={`mb-4 break-inside-avoid ${className}`}>
        <h3 className="text-lg font-semibold">{edu.degree}</h3>
        <p className="font-medium">{edu.institution}</p>
        <p className="text-xs text-muted-foreground">{edu.startDate} - {edu.endDate}</p>
        <p className="text-sm mt-1">{edu.description}</p>
    </div>
);

const SkillsList = ({ skills, className = '' }) => (
    <div className={`flex flex-wrap gap-2 ${className}`}>
        {skills.split(',').map(skill => skill.trim() && (
            <span key={skill} className="bg-primary/10 text-primary text-sm font-medium px-2 py-1 rounded">{skill.trim()}</span>
        ))}
    </div>
);


const templates = {
    classic: (props) => (
        <div className="p-8 font-serif bg-white text-gray-800">
            <header className="text-center border-b-2 pb-4 border-gray-300">
                <h1 className="text-4xl font-bold tracking-wider">{props.personalDetails.name}</h1>
                <p className="text-sm mt-2">
                    {props.personalDetails.email} &bull; {props.personalDetails.phone} &bull; {props.personalDetails.address}
                </p>
            </header>
            <Section title="SUMMARY" titleClassName="border-b border-gray-300">
                <p className="text-sm text-justify">{props.summary}</p>
            </Section>
            <Section title="EXPERIENCE" titleClassName="border-b border-gray-300">
                {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
            </Section>
            <Section title="EDUCATION" titleClassName="border-b border-gray-300">
                {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
            </Section>
            <Section title="SKILLS" titleClassName="border-b border-gray-300">
                <SkillsList skills={props.skills} />
            </Section>
        </div>
    ),
    modern: (props) => (
        <div className="flex font-sans bg-white text-gray-800 min-h-[297mm]">
            <div className="w-1/3 bg-gray-800 text-white p-8">
                <h1 className="text-4xl font-bold leading-tight">{props.personalDetails.name}</h1>
                <div className="mt-8">
                    <h2 className="text-lg font-semibold uppercase tracking-wider border-b pb-1 border-primary">Contact</h2>
                    <p className="text-sm mt-2">{props.personalDetails.email}</p>
                    <p className="text-sm">{props.personalDetails.phone}</p>
                    <p className="text-sm">{props.personalDetails.address}</p>
                    <p className="text-sm">{props.personalDetails.linkedin}</p>
                </div>
                <div className="mt-8">
                    <h2 className="text-lg font-semibold uppercase tracking-wider border-b pb-1 border-primary">Skills</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {props.skills.split(',').map(skill => skill.trim() && (
                            <span key={skill} className="bg-primary/80 text-white text-xs font-medium px-2 py-1 rounded">{skill.trim()}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="w-2/3 p-8">
                <Section title="SUMMARY" titleClassName="text-gray-700 border-b-2 border-primary">
                    <p className="text-sm">{props.summary}</p>
                </Section>
                <Section title="EXPERIENCE" titleClassName="text-gray-700 border-b-2 border-primary">
                    {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
                </Section>
                <Section title="EDUCATION" titleClassName="text-gray-700 border-b-2 border-primary">
                    {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
                </Section>
            </div>
        </div>
    ),
    creative: (props) => (
        <div className="p-8 font-sans bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900">
            <header className="text-center mb-8">
                <div className="inline-block p-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
                    <div className="bg-white rounded-full p-4">
                        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{props.personalDetails.name[0]}</h1>
                    </div>
                </div>
                <h1 className="text-4xl font-bold mt-4">{props.personalDetails.name}</h1>
                <p className="text-md mt-2 text-gray-600">
                    {props.personalDetails.email} | {props.personalDetails.phone}
                </p>
            </header>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-1 space-y-8">
                    <Section title="CONTACT" titleClassName="text-indigo-600">
                        <p className="text-sm">{props.personalDetails.address}</p>
                        <p className="text-sm">{props.personalDetails.linkedin}</p>
                    </Section>
                    <Section title="SKILLS" titleClassName="text-indigo-600">
                         <div className="flex flex-wrap gap-2">
                            {props.skills.split(',').map(skill => skill.trim() && (
                                <span key={skill} className="bg-indigo-500 text-white text-sm font-medium px-3 py-1 rounded-full">{skill.trim()}</span>
                            ))}
                        </div>
                    </Section>
                </div>
                <div className="col-span-2 space-y-8">
                    <Section title="SUMMARY" titleClassName="text-blue-600">
                        <p className="text-sm">{props.summary}</p>
                    </Section>
                    <Section title="EXPERIENCE" titleClassName="text-blue-600">
                        {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
                    </Section>
                    <Section title="EDUCATION" titleClassName="text-blue-600">
                        {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
                    </Section>
                </div>
            </div>
        </div>
    ),
    professional: (props) => (
        <div className="p-8 font-serif bg-white text-gray-800">
            <header className="flex items-center justify-between pb-4 border-b-4 border-gray-800">
                <h1 className="text-4xl font-bold tracking-tight">{props.personalDetails.name}</h1>
                <div className="text-right text-xs">
                    <p>{props.personalDetails.email}</p>
                    <p>{props.personalDetails.phone}</p>
                    <p>{props.personalDetails.address}</p>
                </div>
            </header>
            <main className="mt-6">
                 <Section title="PROFESSIONAL SUMMARY" titleClassName="text-gray-800 tracking-widest text-sm font-bold border-b border-gray-300">
                    <p className="text-sm mt-2">{props.summary}</p>
                </Section>
                <Section title="WORK EXPERIENCE" titleClassName="text-gray-800 tracking-widest text-sm font-bold border-b border-gray-300">
                    {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
                </Section>
                <Section title="EDUCATION" titleClassName="text-gray-800 tracking-widest text-sm font-bold border-b border-gray-300">
                    {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
                </Section>
                <Section title="CORE COMPETENCIES" titleClassName="text-gray-800 tracking-widest text-sm font-bold border-b border-gray-300">
                    <SkillsList skills={props.skills} />
                </Section>
            </main>
        </div>
    ),
    minimalist: (props) => (
        <div className="p-10 font-sans bg-white text-gray-700">
            <h1 className="text-3xl font-light tracking-widest uppercase text-center">{props.personalDetails.name}</h1>
            <p className="text-xs text-center mt-2 tracking-wider">
                {props.personalDetails.email} &bull; {props.personalDetails.phone} &bull; {props.personalDetails.linkedin}
            </p>
            <div className="mt-10">
                <p className="text-sm text-center leading-relaxed">{props.summary}</p>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-lg font-normal tracking-widest border-b border-gray-200 pb-2">EXPERIENCE</h2>
                    <div className="mt-4 space-y-4">
                        {props.experience.map(exp => (
                             <div key={exp.id}>
                                <h3 className="text-md font-semibold">{exp.jobTitle}</h3>
                                <p className="text-sm">{exp.company}</p>
                                <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div>
                    <h2 className="text-lg font-normal tracking-widest border-b border-gray-200 pb-2">EDUCATION</h2>
                     <div className="mt-4 space-y-4">
                        {props.education.map(edu => (
                            <div key={edu.id}>
                                <h3 className="text-md font-semibold">{edu.degree}</h3>
                                <p className="text-sm">{edu.institution}</p>
                                <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <div className="mt-10">
                <h2 className="text-lg font-normal tracking-widest border-b border-gray-200 pb-2 text-center">SKILLS</h2>
                <p className="text-sm text-center mt-4 leading-relaxed">{props.skills}</p>
            </div>
        </div>
    ),
     corporate: (props) => (
        <div className="p-8 font-sans bg-white text-gray-900">
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-1 border-r-2 border-gray-200 pr-8">
                    <h1 className="text-3xl font-bold text-primary">{props.personalDetails.name}</h1>
                    <div className="mt-8 space-y-6">
                        <Section title="CONTACT" titleClassName="text-sm uppercase tracking-wider text-gray-500 border-none !mb-1">
                            <p className="text-sm">{props.personalDetails.email}</p>
                            <p className="text-sm">{props.personalDetails.phone}</p>
                            <p className="text-sm">{props.personalDetails.address}</p>
                            <p className="text-sm">{props.personalDetails.linkedin}</p>
                        </Section>
                         <Section title="SKILLS" titleClassName="text-sm uppercase tracking-wider text-gray-500 border-none !mb-1">
                            <SkillsList skills={props.skills} />
                        </Section>
                    </div>
                </div>
                <div className="col-span-2">
                     <Section title="PROFILE" titleClassName="text-xl font-semibold text-primary border-b-2 border-primary">
                        <p className="text-sm text-justify">{props.summary}</p>
                    </Section>
                    <Section title="EXPERIENCE" titleClassName="text-xl font-semibold text-primary border-b-2 border-primary">
                        {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
                    </Section>
                    <Section title="EDUCATION" titleClassName="text-xl font-semibold text-primary border-b-2 border-primary">
                        {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
                    </Section>
                </div>
            </div>
        </div>
    ),
    academic: (props) => (
         <div className="p-8 font-serif bg-white text-gray-800">
            <header className="text-center pb-4">
                <h1 className="text-3xl font-bold">{props.personalDetails.name}</h1>
                <p className="text-sm mt-1">{props.personalDetails.address} | {props.personalDetails.phone} | {props.personalDetails.email}</p>
            </header>
            <div className="border-t-2 border-b-2 border-black my-4 py-1">
                <h2 className="text-center font-bold tracking-widest">CURRICULUM VITAE</h2>
            </div>
             <Section title="ACADEMIC PROFILE" titleClassName="text-lg font-bold border-b border-gray-400">
                <p className="text-sm mt-2">{props.summary}</p>
            </Section>
            <Section title="EDUCATION" titleClassName="text-lg font-bold border-b border-gray-400">
                {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
            </Section>
            <Section title="RESEARCH & PROFESSIONAL EXPERIENCE" titleClassName="text-lg font-bold border-b border-gray-400">
                {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
            </Section>
            <Section title="TECHNICAL SKILLS" titleClassName="text-lg font-bold border-b border-gray-400">
                <SkillsList skills={props.skills} />
            </Section>
        </div>
    ),
    technical: (props) => (
        <div className="p-8 font-mono bg-gray-900 text-green-400">
            <p>> user --name "{props.personalDetails.name}"</p>
            <p>> user --contact [{props.personalDetails.email}, {props.personalDetails.phone}]</p>
            <p className="mb-4">> user --linkedin "{props.personalDetails.linkedin}"</p>

            <Section title="[ SUMMARY ]" titleClassName="text-yellow-400">
                <p className="text-sm text-gray-300">"{props.summary}"</p>
            </Section>
            <Section title="[ SKILLS ]" titleClassName="text-yellow-400">
                 <div className="flex flex-wrap gap-2">
                    {props.skills.split(',').map(skill => skill.trim() && (
                        <span key={skill} className="text-cyan-400">"{skill.trim()}"</span>
                    ))}
                </div>
            </Section>
            <Section title="[ EXPERIENCE ]" titleClassName="text-yellow-400">
                {props.experience.map(exp => (
                    <div key={exp.id} className="mb-4">
                        <p>> load_experience</p>
                        <p className="pl-4">  <span className="text-cyan-400">title:</span> "{exp.jobTitle}"</p>
                        <p className="pl-4">  <span className="text-cyan-400">company:</span> "{exp.company}"</p>
                        <p className="pl-4">  <span className="text-cyan-400">period:</span> "{exp.startDate} to {exp.endDate}"</p>
                    </div>
                ))}
            </Section>
             <Section title="[ EDUCATION ]" titleClassName="text-yellow-400">
                {props.education.map(edu => (
                     <div key={edu.id} className="mb-4">
                        <p>> load_education</p>
                        <p className="pl-4">  <span className="text-cyan-400">degree:</span> "{edu.degree}"</p>
                        <p className="pl-4">  <span className="text-cyan-400">institution:</span> "{edu.institution}"</p>
                    </div>
                ))}
            </Section>
        </div>
    ),
    elegant: (props) => (
        <div className="p-10 font-serif bg-rose-50 text-gray-700">
            <header className="text-center pb-6 border-b-2 border-rose-200">
                <h1 className="text-5xl font-thin tracking-widest">{props.personalDetails.name}</h1>
                <p className="text-md mt-3 tracking-wider">
                    {props.personalDetails.email} &bull; {props.personalDetails.phone}
                </p>
            </header>
            <main className="mt-8 grid grid-cols-12 gap-8">
                <div className="col-span-4 text-sm space-y-8">
                     <Section title="PROFILE" titleClassName="text-rose-800 tracking-wider font-light">
                        <p className="text-sm">{props.summary}</p>
                    </Section>
                    <Section title="CONTACT" titleClassName="text-rose-800 tracking-wider font-light">
                        <p>{props.personalDetails.address}</p>
                        <p>{props.personalDetails.linkedin}</p>
                    </Section>
                    <Section title="SKILLS" titleClassName="text-rose-800 tracking-wider font-light">
                        <ul className="list-none space-y-1">
                        {props.skills.split(',').map(skill => skill.trim() && (
                            <li key={skill}>{skill.trim()}</li>
                        ))}
                        </ul>
                    </Section>
                </div>
                <div className="col-span-8 border-l-2 border-rose-200 pl-8 space-y-8">
                     <Section title="EXPERIENCE" titleClassName="text-rose-800 tracking-wider font-light">
                        {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
                    </Section>
                    <Section title="EDUCATION" titleClassName="text-rose-800 tracking-wider font-light">
                        {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
                    </Section>
                </div>
            </main>
        </div>
    ),
    bold: (props) => (
        <div className="p-8 font-sans bg-black text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h1 className="text-6xl font-extrabold uppercase tracking-tighter">{props.personalDetails.name}</h1>
                    <p className="text-lg mt-2 bg-primary text-black font-bold inline-block px-2">{props.experience[0]?.jobTitle || 'Professional'}</p>
                </div>
                <div className="text-left md:text-right text-sm">
                    <p>{props.personalDetails.email}</p>
                    <p>{props.personalDetails.phone}</p>
                    <p>{props.personalDetails.linkedin}</p>
                </div>
            </div>
            <div className="mt-12 border-t-4 border-primary pt-8">
                 <Section title="ABOUT ME" titleClassName="text-primary text-2xl font-bold tracking-wider">
                    <p className="text-gray-300">{props.summary}</p>
                </Section>
                <Section title="EXPERIENCE" titleClassName="text-primary text-2xl font-bold tracking-wider">
                    {props.experience.map(exp => <ExperienceItem key={exp.id} exp={exp} />)}
                </Section>
                <Section title="EDUCATION" titleClassName="text-primary text-2xl font-bold tracking-wider">
                    {props.education.map(edu => <EducationItem key={edu.id} edu={edu} />)}
                </Section>
                <Section title="SKILLS" titleClassName="text-primary text-2xl font-bold tracking-wider">
                     <div className="flex flex-wrap gap-3">
                        {props.skills.split(',').map(skill => skill.trim() && (
                            <span key={skill} className="bg-gray-800 text-white text-md font-semibold px-4 py-2">{skill.trim()}</span>
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    )
};

const ResumeTemplate = ({ templateId = 'classic', ...props }) => {
    const TemplateComponent = templates[templateId] || templates.classic;
    return <TemplateComponent {...props} />;
};

export default ResumeTemplate;