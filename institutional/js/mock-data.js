// ==========================================
// EDUBRIDGE — MOCK DATA (Faculty Module)
// Replace with API calls when backend is ready
// ==========================================

export const FACULTY = {
  uid: "faculty_001",
  name: "Dr. Priya Nair",
  firstName: "Priya",
  initials: "PN",
  designation: "Associate Professor",
  department: "Computer Science & Engineering",
  institution: "ABC Institute of Technology",
  email: "priya.nair@abcit.edu.in",
  phone: "+91 98765 43210",
  experience: "12 years",
  qualifications: ["Ph.D. in Artificial Intelligence – IIT Madras, 2014", "M.Tech in CSE – NIT Trichy, 2010", "B.Tech in CSE – VIT University, 2008"],
  expertise: ["Artificial Intelligence", "Machine Learning", "Data Analytics", "Natural Language Processing"],
  research: ["AI in Education", "Natural Language Processing", "Federated Learning", "Explainable AI"],
  subjects: ["Machine Learning", "Data Structures & Algorithms", "Artificial Intelligence", "Python Programming"],
  bio: "Dr. Priya Nair is an Associate Professor with 12 years of teaching and research experience in Artificial Intelligence and Machine Learning. She has published 18 research papers in reputed journals and conferences, and has guided 6 Ph.D. scholars.",
  publications: 18,
  projects: 6,
  patents: 2,
  certifications: 8,
  fdpsCompleted: 8,
  industryEngagements: 4,
  researchCollaborations: 3,
  applications: 5,
  links: {
    linkedin: "https://linkedin.com/in/drpriyanair",
    researchgate: "https://researchgate.net/drpriyanair",
    google_scholar: "https://scholar.google.com/drpriyanair"
  },
  engagementScore: 82,
  engagementBreakdown: {
    "Industry Training": 80,
    "FDP Participation": 90,
    "Industry Projects": 72,
    "Research Collaboration": 85,
    "Mentorship": 78
  }
};

export const FACULTY_INTERNSHIPS = [
  {
    id: "fi001",
    title: "Industry Immersion Program — AI & Data Science",
    organization: "TechNova Solutions",
    orgInitials: "TN",
    location: "Bengaluru",
    mode: "On-site",
    duration: "4 weeks",
    domain: "Artificial Intelligence",
    expertise: ["Machine Learning", "Python", "NLP"],
    outcomes: ["Hands-on industry experience", "Real project exposure", "Certificate of completion"],
    deadline: "30 Sep 2026",
    match: 92,
    stipend: "₹25,000/month",
    description: "A 4-week intensive industry immersion program for faculty members to gain hands-on experience with live AI/ML projects in a corporate environment."
  },
  {
    id: "fi002",
    title: "Faculty Research Internship — Data Engineering",
    organization: "DataCore Labs",
    orgInitials: "DC",
    location: "Hyderabad",
    mode: "Hybrid",
    duration: "6 weeks",
    domain: "Data Science",
    expertise: ["Data Analytics", "SQL", "Python"],
    outcomes: ["Industry research skills", "Joint publication opportunity", "Corporate mentorship"],
    deadline: "15 Oct 2026",
    match: 87,
    stipend: "₹30,000/month",
    description: "Faculty Research Internship focusing on data engineering pipelines and analytics at scale."
  },
  {
    id: "fi003",
    title: "AI Product Development Internship",
    organization: "InnoSphere Technologies",
    orgInitials: "IT",
    location: "Chennai",
    mode: "Remote",
    duration: "8 weeks",
    domain: "Product & AI",
    expertise: ["AI", "Product Management", "Python"],
    outcomes: ["Product development experience", "Industry mentorship", "Certification"],
    deadline: "05 Nov 2026",
    match: 78,
    stipend: "₹20,000/month",
    description: "Gain experience building AI-powered products alongside an experienced product and engineering team."
  }
];

export const INDUSTRIAL_TRAININGS = [
  {
    id: "it001",
    title: "Generative AI & LLMs — Corporate Training",
    organization: "Microsoft India",
    orgInitials: "MS",
    duration: "5 days",
    domain: "Artificial Intelligence",
    mode: "Online",
    eligibility: "Faculty with AI/ML background",
    certificate: true,
    deadline: "20 Sep 2026",
    skills: ["Generative AI", "LLMs", "Prompt Engineering", "Azure AI"],
    description: "Comprehensive corporate training on Generative AI and Large Language Models with hands-on labs."
  },
  {
    id: "it002",
    title: "Cloud Architecture & DevOps — Faculty Program",
    organization: "Amazon Web Services",
    orgInitials: "AW",
    duration: "3 days",
    domain: "Cloud Computing",
    mode: "Hybrid",
    eligibility: "Open to all faculty",
    certificate: true,
    deadline: "10 Oct 2026",
    skills: ["AWS", "Cloud Architecture", "DevOps", "CI/CD"],
    description: "Learn cloud architecture best practices and DevOps workflows used in industry."
  },
  {
    id: "it003",
    title: "Data Engineering with Apache Spark",
    organization: "Databricks",
    orgInitials: "DB",
    duration: "2 days",
    domain: "Data Engineering",
    mode: "Online",
    eligibility: "CS/IT faculty",
    certificate: true,
    deadline: "25 Oct 2026",
    skills: ["Apache Spark", "Python", "Delta Lake", "Data Pipelines"],
    description: "Hands-on training on building scalable data engineering solutions with Apache Spark."
  },
  {
    id: "it004",
    title: "Cybersecurity Fundamentals for Educators",
    organization: "Cisco Networking Academy",
    orgInitials: "CN",
    duration: "4 days",
    domain: "Cybersecurity",
    mode: "Online",
    eligibility: "Open to all faculty",
    certificate: true,
    deadline: "12 Nov 2026",
    skills: ["Network Security", "Ethical Hacking", "SIEM", "SOC"],
    description: "Foundational cybersecurity training designed specifically for academic educators."
  }
];

export const FDPS = [
  {
    id: "fdp001",
    title: "FDP on Generative AI in Education",
    organizer: "IIT Madras",
    orgInitials: "IIT",
    duration: "5 Days",
    mode: "Online",
    domain: "Artificial Intelligence",
    certificate: true,
    deadline: "18 Sep 2026",
    startDate: "25 Sep 2026",
    topics: ["Generative AI Foundations", "LLMs in Education", "AI Ethics", "ChatGPT for Teaching", "Hands-on Labs"],
    objectives: ["Understand Generative AI fundamentals", "Apply AI tools in pedagogy", "Design AI-enhanced curriculum"],
    eligibility: "Faculty in CS/IT/ECE/Mathematics",
    fee: "Free",
    description: "A 5-day intensive FDP on the applications of Generative AI in higher education, covering tools, techniques, and pedagogical approaches."
  },
  {
    id: "fdp002",
    title: "FDP on Research Methodology & Academic Writing",
    organizer: "NIT Trichy",
    orgInitials: "NIT",
    duration: "7 Days",
    mode: "Hybrid",
    domain: "Research Skills",
    certificate: true,
    deadline: "05 Oct 2026",
    startDate: "15 Oct 2026",
    topics: ["Research Design", "Literature Review", "Data Collection & Analysis", "Academic Writing", "Publishing in SCI Journals"],
    objectives: ["Develop research methodology skills", "Enhance academic writing", "Understand SCI publication process"],
    eligibility: "All Faculty Members",
    fee: "₹500",
    description: "A comprehensive FDP covering research methodology, academic writing, and publication strategies for faculty."
  },
  {
    id: "fdp003",
    title: "FDP on Industry 4.0 Technologies",
    organizer: "AICTE",
    orgInitials: "AI",
    duration: "10 Days",
    mode: "Online",
    domain: "Emerging Technologies",
    certificate: true,
    deadline: "20 Oct 2026",
    startDate: "01 Nov 2026",
    topics: ["IoT", "Blockchain", "Robotics", "Digital Twin", "Cyber-Physical Systems"],
    objectives: ["Understand Industry 4.0 ecosystem", "Apply emerging tech in curriculum", "Build cross-disciplinary knowledge"],
    eligibility: "Faculty from Engineering colleges",
    fee: "Free",
    description: "Explore Industry 4.0 technologies and learn to integrate them into your teaching and research."
  }
];

export const WORKSHOPS = [
  {
    id: "ws001",
    title: "Hands-on Workshop: Building ML Pipelines",
    organizer: "Google Developer Groups",
    orgInitials: "GD",
    duration: "1 Day",
    mode: "On-site",
    location: "Bengaluru",
    domain: "Machine Learning",
    certificate: true,
    deadline: "12 Sep 2026",
    skills: ["Python", "Scikit-learn", "MLflow", "Docker"],
    description: "Build production-ready ML pipelines from scratch with Google engineers."
  },
  {
    id: "ws002",
    title: "Deep Learning with PyTorch — Workshop",
    organizer: "NVIDIA DLI",
    orgInitials: "NV",
    duration: "2 Days",
    mode: "Online",
    location: "Online",
    domain: "Deep Learning",
    certificate: true,
    deadline: "28 Sep 2026",
    skills: ["PyTorch", "CNNs", "Transfer Learning", "GPU Computing"],
    description: "Hands-on deep learning workshop using NVIDIA's AI platforms and PyTorch."
  },
  {
    id: "ws003",
    title: "Natural Language Processing — Practical Workshop",
    organizer: "Hugging Face",
    orgInitials: "HF",
    duration: "1 Day",
    mode: "Online",
    location: "Online",
    domain: "NLP",
    certificate: false,
    deadline: "08 Oct 2026",
    skills: ["Transformers", "BERT", "Fine-tuning", "Python"],
    description: "Learn to build NLP models using Hugging Face's Transformers library."
  }
];

export const CONSULTANCY = [
  {
    id: "cons001",
    title: "AI-Powered Customer Churn Prediction",
    organization: "RetailMax Pvt. Ltd.",
    orgInitials: "RM",
    domain: "Machine Learning",
    requiredExpertise: ["Machine Learning", "Python", "Data Analysis"],
    duration: "3 months",
    contribution: "Design ML model, validate results, write technical report",
    budget: "₹1,50,000",
    deadline: "25 Sep 2026",
    description: "Design an ML-based churn prediction system for a major retail company with 5M+ customers."
  },
  {
    id: "cons002",
    title: "NLP-Based HR Document Analysis System",
    organization: "PeopleTech Solutions",
    orgInitials: "PT",
    domain: "Natural Language Processing",
    requiredExpertise: ["NLP", "Python", "Text Classification"],
    duration: "2 months",
    contribution: "Develop NLP pipeline, train models, deploy prototype",
    budget: "₹80,000",
    deadline: "10 Oct 2026",
    description: "Build an NLP pipeline to automatically classify and extract key data from HR documents."
  },
  {
    id: "cons003",
    title: "Data Quality Assessment Framework",
    organization: "FinanceCore Analytics",
    orgInitials: "FC",
    domain: "Data Engineering",
    requiredExpertise: ["Data Analytics", "SQL", "Statistical Analysis"],
    duration: "6 weeks",
    contribution: "Assess data pipelines, create quality scoring, provide recommendations",
    budget: "₹60,000",
    deadline: "30 Oct 2026",
    description: "Assess and improve data quality across multiple financial data pipelines."
  }
];

export const RESEARCH = [
  {
    id: "res001",
    title: "Federated Learning for Healthcare Privacy Preservation",
    organization: "Apollo Hospitals + IIT Delhi",
    orgInitials: "AH",
    domain: "Federated Learning / Healthcare AI",
    requiredExpertise: ["Machine Learning", "Federated Learning", "Python"],
    duration: "12 months",
    outcomes: ["3 joint publications", "Patent filing", "Research dataset"],
    funding: "₹15,00,000 (DST Funded)",
    deadline: "30 Sep 2026",
    description: "Collaborative research on privacy-preserving AI for healthcare diagnostics using Federated Learning techniques."
  },
  {
    id: "res002",
    title: "Explainable AI for Credit Risk Assessment",
    organization: "HDFC Labs",
    orgInitials: "HD",
    domain: "Explainable AI / Fintech",
    requiredExpertise: ["XAI", "Machine Learning", "Data Analytics"],
    duration: "8 months",
    outcomes: ["2 publications", "Industry prototype", "Conference presentations"],
    funding: "₹8,00,000 (Industry Funded)",
    deadline: "15 Oct 2026",
    description: "Develop explainable ML models for credit risk assessment in collaboration with HDFC's innovation lab."
  },
  {
    id: "res003",
    title: "AI-Driven Adaptive Learning Systems",
    organization: "NPTEL + Ministry of Education",
    orgInitials: "NP",
    domain: "AI in Education",
    requiredExpertise: ["AI in Education", "NLP", "Data Analytics"],
    duration: "18 months",
    outcomes: ["4 publications", "Policy recommendations", "Open-source platform"],
    funding: "₹20,00,000 (Govt. Funded)",
    deadline: "05 Nov 2026",
    description: "Research on AI-powered adaptive learning systems that personalize education delivery for students across India."
  }
];

export const GUEST_LECTURES = [
  {
    id: "gl001",
    title: "Machine Learning in Industry: Real-World Applications",
    organization: "ABC Institute of Technology",
    orgInitials: "AB",
    audience: "Final Year CSE Students (120 students)",
    date: "20 Sep 2026",
    mode: "On-site",
    duration: "2 hours",
    domain: "Machine Learning",
    honorarium: "₹5,000",
    description: "Deliver a guest lecture on practical ML applications across industries to final-year engineering students."
  },
  {
    id: "gl002",
    title: "AI Ethics and Responsible Innovation",
    organization: "XLRI Jamshedpur",
    orgInitials: "XL",
    audience: "MBA Students (60 students)",
    date: "05 Oct 2026",
    mode: "Online (Webinar)",
    duration: "90 minutes",
    domain: "AI Ethics",
    honorarium: "₹3,000",
    description: "Webinar on ethical considerations in AI development for MBA students focusing on tech leadership."
  },
  {
    id: "gl003",
    title: "Data Science Career Paths in 2026",
    organization: "VIT University",
    orgInitials: "VT",
    audience: "All Year Students (200+ students)",
    date: "18 Oct 2026",
    mode: "Hybrid",
    duration: "3 hours",
    domain: "Data Science",
    honorarium: "₹8,000",
    description: "Share insights on data science career trajectories, skill requirements, and industry expectations."
  }
];

export const MENTORSHIP_PROGRAMS = [
  {
    id: "ment001",
    title: "Industry Mentor — AI Startup Program",
    organization: "TiE Bangalore",
    orgInitials: "TI",
    topic: "AI/ML Mentorship for Startups",
    targetExpertise: ["AI", "Machine Learning", "Product Strategy"],
    duration: "6 months",
    mode: "Online",
    commitment: "4 hours/month",
    description: "Mentor AI startups through TiE's accelerator program. Guide founders on AI strategy, product development, and technical challenges."
  },
  {
    id: "ment002",
    title: "Academic-Industry Connect — Faculty Mentor",
    organization: "NASSCOM Foundation",
    orgInitials: "NF",
    topic: "Digital Skills & Career Guidance",
    targetExpertise: ["Data Analytics", "AI", "Digital Transformation"],
    duration: "3 months",
    mode: "Hybrid",
    commitment: "6 hours/month",
    description: "Mentor students and young professionals on digital skills and career transitions into the tech industry."
  }
];

export const FACULTY_APPLICATIONS = [
  {
    id: "app001",
    type: "Industrial Training",
    title: "Generative AI & LLMs — Corporate Training",
    organization: "Microsoft India",
    appliedDate: "20 Aug 2026",
    status: "Accepted",
    statusColor: "success",
    nextStep: "Attend training on 15 Sep 2026",
    timeline: [
      { step: "Application Submitted", date: "20 Aug 2026", done: true },
      { step: "Application Reviewed", date: "25 Aug 2026", done: true },
      { step: "Accepted", date: "28 Aug 2026", done: true, current: false }
    ]
  },
  {
    id: "app002",
    type: "FDP",
    title: "FDP on Research Methodology & Academic Writing",
    organization: "NIT Trichy",
    appliedDate: "01 Sep 2026",
    status: "Under Review",
    statusColor: "warning",
    nextStep: "Awaiting approval",
    timeline: [
      { step: "Application Submitted", date: "01 Sep 2026", done: true },
      { step: "Under Review", date: "03 Sep 2026", done: true, current: true }
    ]
  },
  {
    id: "app003",
    type: "Research Collaboration",
    title: "Federated Learning for Healthcare Privacy Preservation",
    organization: "Apollo Hospitals + IIT Delhi",
    appliedDate: "15 Aug 2026",
    status: "Shortlisted",
    statusColor: "teal",
    nextStep: "Interview on 10 Sep 2026",
    timeline: [
      { step: "Application Submitted", date: "15 Aug 2026", done: true },
      { step: "Application Reviewed", date: "20 Aug 2026", done: true },
      { step: "Shortlisted", date: "28 Aug 2026", done: true, current: true }
    ]
  },
  {
    id: "app004",
    type: "Consultancy",
    title: "AI-Powered Customer Churn Prediction",
    organization: "RetailMax Pvt. Ltd.",
    appliedDate: "28 Aug 2026",
    status: "Applied",
    statusColor: "navy",
    nextStep: "Awaiting acknowledgement",
    timeline: [
      { step: "Application Submitted", date: "28 Aug 2026", done: true, current: true }
    ]
  },
  {
    id: "app005",
    type: "Faculty Internship",
    title: "Faculty Research Internship — Data Engineering",
    organization: "DataCore Labs",
    appliedDate: "10 Aug 2026",
    status: "Completed",
    statusColor: "gray",
    nextStep: "Certificate received",
    timeline: [
      { step: "Application Submitted", date: "10 Aug 2026", done: true },
      { step: "Accepted", date: "15 Aug 2026", done: true },
      { step: "Completed", date: "01 Sep 2026", done: true }
    ]
  }
];

export const EVENTS = [
  {
    id: "ev001",
    title: "International Conference on AI & Machine Learning (ICAML 2026)",
    speaker: "Multiple Industry Experts",
    organization: "IEEE",
    date: "15–17 Oct 2026",
    time: "9:00 AM IST",
    mode: "Hybrid",
    category: "Conference",
    registered: false,
    location: "Bengaluru + Online"
  },
  {
    id: "ev002",
    title: "Workshop on Responsible AI in Healthcare",
    speaker: "Dr. Arvind Kumar, IIT Bombay",
    organization: "NASSCOM",
    date: "28 Sep 2026",
    time: "2:00 PM IST",
    mode: "Online",
    category: "Workshop",
    registered: true,
    location: "Online"
  },
  {
    id: "ev003",
    title: "Industry-Academia Collaboration Summit 2026",
    speaker: "Panel of Industry Leaders",
    organization: "CII",
    date: "10 Oct 2026",
    time: "10:00 AM IST",
    mode: "On-site",
    category: "Summit",
    registered: false,
    location: "New Delhi"
  },
  {
    id: "ev004",
    title: "FDP: Advanced Deep Learning Techniques",
    speaker: "Dr. Srinivas Murthy, Google Research",
    organization: "AICTE",
    date: "20–24 Oct 2026",
    time: "9:30 AM IST",
    mode: "Online",
    category: "FDP",
    registered: false,
    location: "Online"
  }
];

export const NOTIFICATIONS = [
  {
    id: "n1",
    type: "teal",
    icon: "briefcase",
    title: "New Faculty Internship Match",
    body: "An AI & Data Science industry internship at TechNova matches 92% of your expertise.",
    time: "2 hours ago",
    unread: true
  },
  {
    id: "n2",
    type: "green",
    icon: "check-circle",
    title: "Application Accepted",
    body: "Your application for Generative AI & LLMs Training at Microsoft India has been accepted.",
    time: "1 day ago",
    unread: true
  },
  {
    id: "n3",
    type: "amber",
    icon: "calendar",
    title: "FDP Registration Deadline",
    body: "FDP on Research Methodology at NIT Trichy closes registration in 5 days.",
    time: "2 days ago",
    unread: true
  },
  {
    id: "n4",
    type: "blue",
    icon: "star",
    title: "Research Opportunity Shortlisted",
    body: "You have been shortlisted for the Federated Learning research collaboration.",
    time: "3 days ago",
    unread: false
  },
  {
    id: "n5",
    type: "teal",
    icon: "book",
    title: "New FDP Available",
    body: "FDP on Generative AI in Education by IIT Madras is now open for registration.",
    time: "4 days ago",
    unread: false
  }
];
