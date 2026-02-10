// Sample data for the CRM - Bengali language
// This simulates the data that would come from the database

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  deliveryTime: string;
  description: string;
  active: boolean;
  createdAt: Date;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  serviceId: string;
  source: string;
  status: 'নতুন' | 'যোগাযোগ হয়েছে' | 'আগ্রহী' | 'প্রস্তাব পাঠানো' | 'ক্লোজড/সেল' | 'হারানো';
  notes: { text: string; date: Date }[];
  nextFollowUpAt?: Date;
  createdAt: Date;
  assignedTo?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  address?: string;
  socialLinks?: string[];
  createdAt: Date;
}

export interface Project {
  id: string;
  clientId: string;
  serviceId: string;
  title: string;
  budget: number;
  startDate: Date;
  deadline: Date;
  status: 'চলমান' | 'রিভিউ' | 'সম্পন্ন' | 'হোল্ড';
  progress: number;
  assignedTeam: string[];
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string;
  deadline: Date;
  status: 'অপেক্ষমাণ' | 'চলমান' | 'সম্পন্ন';
  progress: number;
  comments: { text: string; author: string; date: Date }[];
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'পরিশোধিত' | 'বকেয়া' | 'আংশিক';
  createdAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'ব্যাংক' | 'বিকাশ' | 'নগদ' | 'পেপাল' | 'স্ট্রাইপ';
  date: Date;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'অ্যাডমিন' | 'সেলস' | 'প্রজেক্ট ম্যানেজার' | 'স্টাফ' | 'ক্লায়েন্ট';
  createdAt: Date;
}

// Default services
export const defaultServices: Service[] = [
  {
    id: '1',
    name: 'ওয়েবসাইট ডেভেলপমেন্ট',
    category: 'ডেভেলপমেন্ট',
    price: 50000,
    deliveryTime: '১৫-৩০ দিন',
    description: 'প্রফেশনাল ওয়েবসাইট ডিজাইন ও ডেভেলপমেন্ট সার্ভিস',
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'ডিজিটাল মার্কেটিং',
    category: 'মার্কেটিং',
    price: 25000,
    deliveryTime: 'মাসিক',
    description: 'সোশ্যাল মিডিয়া মার্কেটিং, এসইও, পেইড এডস',
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'এআই ভিডিও',
    category: 'ভিডিও প্রোডাকশন',
    price: 15000,
    deliveryTime: '৩-৫ দিন',
    description: 'এআই প্রযুক্তি ব্যবহার করে প্রফেশনাল ভিডিও তৈরি',
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: 'রিয়েল মডেল ভিডিও',
    category: 'ভিডিও প্রোডাকশন',
    price: 35000,
    deliveryTime: '৭-১০ দিন',
    description: 'রিয়েল মডেল দিয়ে প্রফেশনাল ভিডিও শুটিং ও এডিটিং',
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '5',
    name: 'পডকাস্ট স্টুডিও ভাড়া',
    category: 'স্টুডিও',
    price: 5000,
    deliveryTime: 'প্রতি ঘণ্টা',
    description: 'আধুনিক পডকাস্ট স্টুডিও রেন্ট সার্ভিস',
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'অন্যান্য সার্ভিস',
    category: 'কাস্টম',
    price: 0,
    deliveryTime: 'আলোচনা সাপেক্ষ',
    description: 'কাস্টম ডিজিটাল সার্ভিস সলিউশন',
    active: true,
    createdAt: new Date('2024-01-01'),
  },
];

// Sample leads
export const sampleLeads: Lead[] = [
  {
    id: '1',
    name: 'আহমেদ করিম',
    phone: '01712345678',
    email: 'ahmed@example.com',
    company: 'করিম এন্টারপ্রাইজ',
    serviceId: '1',
    source: 'ফেসবুক',
    status: 'নতুন',
    notes: [{ text: 'ওয়েবসাইট সম্পর্কে জানতে চান', date: new Date() }],
    nextFollowUpAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    assignedTo: '1',
  },
  {
    id: '2',
    name: 'ফাতেমা বেগম',
    phone: '01812345678',
    email: 'fatema@example.com',
    company: 'বিউটি জোন',
    serviceId: '2',
    source: 'ওয়েবসাইট',
    status: 'যোগাযোগ হয়েছে',
    notes: [
      { text: 'প্রথম কল করা হয়েছে', date: new Date(Date.now() - 86400000) },
      { text: 'ডিজিটাল মার্কেটিং প্যাকেজ জানতে চান', date: new Date() },
    ],
    nextFollowUpAt: new Date(Date.now() + 172800000),
    createdAt: new Date(Date.now() - 172800000),
    assignedTo: '2',
  },
  {
    id: '3',
    name: 'রহিম উদ্দিন',
    phone: '01912345678',
    email: 'rahim@example.com',
    company: 'রহিম টেক্সটাইল',
    serviceId: '3',
    source: 'রেফারেল',
    status: 'আগ্রহী',
    notes: [
      { text: 'এআই ভিডিও প্রজেক্ট নিয়ে আলোচনা', date: new Date(Date.now() - 86400000) },
    ],
    nextFollowUpAt: new Date(),
    createdAt: new Date(Date.now() - 259200000),
    assignedTo: '1',
  },
  {
    id: '4',
    name: 'সাবরিনা আক্তার',
    phone: '01612345678',
    email: 'sabrina@example.com',
    serviceId: '4',
    source: 'ফাইভার',
    status: 'প্রস্তাব পাঠানো',
    notes: [
      { text: 'প্রপোজাল পাঠানো হয়েছে', date: new Date(Date.now() - 43200000) },
    ],
    createdAt: new Date(Date.now() - 345600000),
    assignedTo: '2',
  },
  {
    id: '5',
    name: 'মোহাম্মদ হাসান',
    phone: '01512345678',
    email: 'hasan@example.com',
    company: 'হাসান গ্রুপ',
    serviceId: '5',
    source: 'কল',
    status: 'ক্লোজড/সেল',
    notes: [
      { text: 'ডিল ফাইনাল', date: new Date(Date.now() - 86400000) },
    ],
    createdAt: new Date(Date.now() - 432000000),
    assignedTo: '1',
  },
];

// Sample clients
export const sampleClients: Client[] = [
  {
    id: '1',
    name: 'মোহাম্মদ হাসান',
    phone: '01512345678',
    email: 'hasan@example.com',
    company: 'হাসান গ্রুপ',
    address: 'গুলশান, ঢাকা',
    createdAt: new Date(Date.now() - 432000000),
  },
  {
    id: '2',
    name: 'নাজমা সুলতানা',
    phone: '01412345678',
    email: 'nazma@example.com',
    company: 'সুলতানা ফ্যাশন',
    address: 'বনানী, ঢাকা',
    createdAt: new Date(Date.now() - 864000000),
  },
];

// Sample projects
export const sampleProjects: Project[] = [
  {
    id: '1',
    clientId: '1',
    serviceId: '1',
    title: 'হাসান গ্রুপ কর্পোরেট ওয়েবসাইট',
    budget: 75000,
    startDate: new Date(Date.now() - 604800000),
    deadline: new Date(Date.now() + 1209600000),
    status: 'চলমান',
    progress: 45,
    assignedTeam: ['1', '3'],
    createdAt: new Date(Date.now() - 604800000),
  },
  {
    id: '2',
    clientId: '2',
    serviceId: '2',
    title: 'সুলতানা ফ্যাশন সোশ্যাল মিডিয়া ক্যাম্পেইন',
    budget: 30000,
    startDate: new Date(Date.now() - 1209600000),
    deadline: new Date(Date.now() + 604800000),
    status: 'রিভিউ',
    progress: 80,
    assignedTeam: ['2'],
    createdAt: new Date(Date.now() - 1209600000),
  },
];

// Sample invoices
export const sampleInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientId: '1',
    projectId: '1',
    items: [
      { description: 'ওয়েবসাইট ডিজাইন', quantity: 1, rate: 30000, amount: 30000 },
      { description: 'ওয়েবসাইট ডেভেলপমেন্ট', quantity: 1, rate: 45000, amount: 45000 },
    ],
    subtotal: 75000,
    discount: 5000,
    tax: 0,
    total: 70000,
    status: 'আংশিক',
    createdAt: new Date(Date.now() - 604800000),
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    clientId: '2',
    projectId: '2',
    items: [
      { description: 'সোশ্যাল মিডিয়া মার্কেটিং (৩ মাস)', quantity: 3, rate: 10000, amount: 30000 },
    ],
    subtotal: 30000,
    discount: 0,
    tax: 0,
    total: 30000,
    status: 'পরিশোধিত',
    createdAt: new Date(Date.now() - 1209600000),
  },
];

// Sources for leads
export const leadSources = [
  'ফেসবুক',
  'ওয়েবসাইট',
  'ফাইভার',
  'আপওয়ার্ক',
  'রেফারেল',
  'কল',
];

// Lead statuses
export const leadStatuses = [
  'নতুন',
  'যোগাযোগ হয়েছে',
  'আগ্রহী',
  'প্রস্তাব পাঠানো',
  'ক্লোজড/সেল',
  'হারানো',
];

// Payment methods
export const paymentMethods = [
  'ব্যাংক',
  'বিকাশ',
  'নগদ',
  'পেপাল',
  'স্ট্রাইপ',
];

// User roles
export const userRoles = [
  'অ্যাডমিন',
  'সেলস',
  'প্রজেক্ট ম্যানেজার',
  'স্টাফ',
  'ক্লায়েন্ট',
];
