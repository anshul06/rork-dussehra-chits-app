export type UserRole = "customer" | "collector" | "admin";

export type PaymentStatus = "paid" | "due" | "overdue" | "upcoming";

export interface ChitScheme {
  id: string;
  name: string;
  totalAmount: number;
  duration: number;
  frequency: "monthly" | "weekly" | "daily";
  description: string;
}

export interface Payment {
  id: string;
  installmentNumber: number;
  amount: number;
  amountPaid: number;
  date: string;
  status: PaymentStatus;
  dueDate: string;
  transactionId?: string;
}

export interface CustomerChit {
  id: string;
  customerId: string;
  schemeId: string;
  schemeName: string;
  totalAmount: number;
  paidAmount: number;
  startDate: string;
  payments: Payment[];
  nextDueDate: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  requiredProgress: number;
  unlocked: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  planName: string;
  totalAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  lastPaymentDate: string;
  collectorId?: string;
}

export interface Collector {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedCustomers: string[];
}

export interface CollectorStats {
  todayTarget: number;
  collectedToday: number;
  pendingToday: number;
}

export interface AdminStats {
  totalCollections: number;
  activeMembers: number;
  pendingPayments: number;
  completionRate: number;
}

export interface Activity {
  id: string;
  type: "payment" | "member_joined" | "scheme_created";
  message: string;
  timestamp: string;
}

export interface DailyCollection {
  customerId: string;
  amount: number;
  date: string;
}
