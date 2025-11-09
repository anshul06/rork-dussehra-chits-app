import createContextHook from "@nkzw/create-context-hook";
import { useState, useCallback, useMemo } from "react";
import type {
  UserRole,
  CustomerChit,
  Reward,
  Customer,
  Collector,
  ChitScheme,
  CollectorStats,
  AdminStats,
  Activity,
  DailyCollection,
} from "@/types";
import {
  mockCustomerChit,
  mockRewards,
  mockCustomers,
  mockCollectors,
  chitSchemes,
  mockActivities,
} from "@/mocks/data";

export const [AppProvider, useApp] = createContextHook(() => {
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [customerChit, setCustomerChit] = useState<CustomerChit>(mockCustomerChit);
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [collectors] = useState<Collector[]>(mockCollectors);
  const [schemes] = useState<ChitScheme[]>(chitSchemes);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [dailyCollections, setDailyCollections] = useState<DailyCollection[]>([]);

  const switchRole = useCallback((role: UserRole) => {
    setUserRole(role);
  }, []);

  const makePayment = useCallback((amount: number, transactionId?: string) => {
    setCustomerChit((prev) => {
      const newPaidAmount = prev.paidAmount + amount;
      const updatedPayments = [...prev.payments];
      
      let remainingAmount = amount;
      const paymentsToUpdate: number[] = [];
      
      for (let i = 0; i < updatedPayments.length; i++) {
        if (updatedPayments[i].status !== "paid" && remainingAmount > 0) {
          const unpaidAmount = updatedPayments[i].amount - updatedPayments[i].amountPaid;
          const paymentAmount = Math.min(remainingAmount, unpaidAmount);
          
          updatedPayments[i] = {
            ...updatedPayments[i],
            amountPaid: updatedPayments[i].amountPaid + paymentAmount,
            date: new Date().toISOString().split("T")[0],
            transactionId: transactionId || `txn_${Date.now()}`,
          };
          
          if (updatedPayments[i].amountPaid >= updatedPayments[i].amount) {
            updatedPayments[i].status = "paid";
          } else if (updatedPayments[i].amountPaid > 0) {
            updatedPayments[i].status = "due";
          }
          
          remainingAmount -= paymentAmount;
          paymentsToUpdate.push(i);
        }
      }

      const nextDuePayment = updatedPayments.find(
        (p) => p.status === "due" || p.status === "upcoming"
      );

      const progress = (newPaidAmount / prev.totalAmount) * 100;
      setRewards((prevRewards) =>
        prevRewards.map((reward) => ({
          ...reward,
          unlocked: progress >= reward.requiredProgress,
        }))
      );

      const installmentNumbers = paymentsToUpdate.map((i) => `#${updatedPayments[i].installmentNumber}`);
      
      const customerName = customers.find((c) => c.id === prev.customerId)?.name || "Customer";
      const newActivity: Activity = {
        id: `a${Date.now()}`,
        type: "payment",
        message: `${customerName} paid ₹${amount} for installment${installmentNumbers.length > 1 ? 's' : ''} ${installmentNumbers.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
      setActivities((prevActivities) => [newActivity, ...prevActivities]);

      const today = new Date().toISOString().split("T")[0];
      setDailyCollections((prevCollections) => [
        ...prevCollections,
        {
          customerId: prev.customerId,
          amount,
          date: today,
        },
      ]);

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) => {
          if (customer.id === prev.customerId) {
            const updatedStatus: Customer["status"] = 
              newPaidAmount >= prev.totalAmount ? "paid" : 
              nextDuePayment ? "due" : "paid";
            
            return {
              ...customer,
              paidAmount: newPaidAmount,
              status: updatedStatus,
              lastPaymentDate: new Date().toISOString().split("T")[0],
            };
          }
          return customer;
        })
      );

      return {
        ...prev,
        paidAmount: newPaidAmount,
        payments: updatedPayments,
        nextDueDate: nextDuePayment?.dueDate || prev.nextDueDate,
      };
    });
  }, [customers]);

  const updateCustomerStatus = useCallback(
    (customerId: string, amount: number) => {
      setCustomers((prev) =>
        prev.map((customer) => {
          if (customer.id === customerId) {
            const newPaidAmount = customer.paidAmount + amount;
            const newStatus: Customer["status"] =
              newPaidAmount >= customer.totalAmount
                ? "paid"
                : "due";
            return {
              ...customer,
              paidAmount: newPaidAmount,
              status: newStatus,
              lastPaymentDate: new Date().toISOString().split("T")[0],
            };
          }
          return customer;
        })
      );

      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        const newActivity: Activity = {
          id: `a${Date.now()}`,
          type: "payment",
          message: `${customer.name} paid ₹${amount} (recorded by collector)`,
          timestamp: new Date().toISOString(),
        };
        setActivities((prev) => [newActivity, ...prev]);
        
        const today = new Date().toISOString().split("T")[0];
        setDailyCollections((prev) => [
          ...prev,
          {
            customerId,
            amount,
            date: today,
          },
        ]);
      }

      if (customerId === customerChit.customerId) {
        setCustomerChit((prev) => {
          const newPaidAmount = prev.paidAmount + amount;
          const updatedPayments = [...prev.payments];
          
          let remainingAmount = amount;
          
          for (let i = 0; i < updatedPayments.length; i++) {
            if (updatedPayments[i].status !== "paid" && remainingAmount > 0) {
              const unpaidAmount = updatedPayments[i].amount - updatedPayments[i].amountPaid;
              const paymentAmount = Math.min(remainingAmount, unpaidAmount);
              
              updatedPayments[i] = {
                ...updatedPayments[i],
                amountPaid: updatedPayments[i].amountPaid + paymentAmount,
                date: new Date().toISOString().split("T")[0],
                transactionId: `col_${Date.now()}`,
              };
              
              if (updatedPayments[i].amountPaid >= updatedPayments[i].amount) {
                updatedPayments[i].status = "paid";
              } else if (updatedPayments[i].amountPaid > 0) {
                updatedPayments[i].status = "due";
              }
              
              remainingAmount -= paymentAmount;
            }
          }

          const nextDuePayment = updatedPayments.find(
            (p) => p.status === "due" || p.status === "upcoming"
          );

          const progress = (newPaidAmount / prev.totalAmount) * 100;
          setRewards((prevRewards) =>
            prevRewards.map((reward) => ({
              ...reward,
              unlocked: progress >= reward.requiredProgress,
            }))
          );

          return {
            ...prev,
            paidAmount: newPaidAmount,
            payments: updatedPayments,
            nextDueDate: nextDuePayment?.dueDate || prev.nextDueDate,
          };
        });
      }
    },
    [customers, customerChit.customerId]
  );

  const getCollectorStats = useCallback(
    (collectorId: string): CollectorStats => {
      const assignedCustomers = customers.filter(
        (c) => c.collectorId === collectorId
      );
      
      const today = new Date().toISOString().split("T")[0];
      const todayCollections = dailyCollections.filter(
        (dc) => dc.date === today && assignedCustomers.some((c) => c.id === dc.customerId)
      );
      
      const collectedToday = todayCollections.reduce(
        (sum, dc) => sum + dc.amount,
        0
      );
      const todayTarget = assignedCustomers.length * 500;
      const pendingToday = todayTarget - collectedToday;

      return {
        todayTarget,
        collectedToday,
        pendingToday: Math.max(0, pendingToday),
      };
    },
    [customers, dailyCollections]
  );

  const getAdminStats = useCallback((): AdminStats => {
    const totalCollections = customers.reduce(
      (sum, c) => sum + c.paidAmount,
      0
    );
    const activeMembers = customers.length;
    const pendingPayments = customers.reduce(
      (sum, c) => sum + (c.totalAmount - c.paidAmount),
      0
    );
    const totalAmount = customers.reduce((sum, c) => sum + c.totalAmount, 0);
    const completionRate = totalAmount > 0 ? (totalCollections / totalAmount) * 100 : 0;

    return {
      totalCollections,
      activeMembers,
      pendingPayments,
      completionRate,
    };
  }, [customers]);

  return useMemo(
    () => ({
      userRole,
      switchRole,
      customerChit,
      rewards,
      customers,
      collectors,
      schemes,
      activities,
      dailyCollections,
      makePayment,
      updateCustomerStatus,
      getCollectorStats,
      getAdminStats,
    }),
    [
      userRole,
      switchRole,
      customerChit,
      rewards,
      customers,
      collectors,
      schemes,
      activities,
      dailyCollections,
      makePayment,
      updateCustomerStatus,
      getCollectorStats,
      getAdminStats,
    ]
  );
});
