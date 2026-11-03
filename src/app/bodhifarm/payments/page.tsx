'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string | null;
  full_name: string | null;
};

type Batch = {
  id: string;
  farmer_id: string;
  batch_code: string | null;
  current_quantity: number | null;
  status: string | null;
};

type Procurement = {
  id: string;
  farmer_id: string;
  batch_id: string | null;
  collection_date: string;
  saleable_eggs: number;
  rate_per_egg: number;
  gross_amount: number;
  quality_deduction: number;
  other_deduction: number;
  net_amount: number;
  status: string;
};

type Expense = {
  id: string;
  farmer_id: string;
  expense_date: string;
  expense_type: string;
  description: string | null;
  amount: number;
  status: string;
};

type Payment = {
  id: string;
  farmer_id: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  reference_number: string | null;
  status: string;
};

function getIndiaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

export default function FarmerPaymentsPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [procurementFarmer, setProcurementFarmer] = useState('');
  const [procurementBatch, setProcurementBatch] = useState('');
  const [collectionDate, setCollectionDate] = useState(getIndiaDate());
  const [saleableEggs, setSaleableEggs] = useState('');
  const [ratePerEgg, setRatePerEgg] = useState('6.50');
  const [qualityDeduction, setQualityDeduction] = useState('0');
  const [otherDeduction, setOtherDeduction] = useState('0');
  const [procurementRemarks, setProcurementRemarks] = useState('');

  const [expenseFarmer, setExpenseFarmer] = useState('');
  const [expenseBatch, setExpenseBatch] = useState('');
  const [expenseDate, setExpenseDate] = useState(getIndiaDate());
  const [expenseType, setExpenseType] = useState('FEED');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [paymentFarmer, setPaymentFarmer] = useState('');
  const [paymentDate, setPaymentDate] = useState(getIndiaDate());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentLast4, setPaymentLast4] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
