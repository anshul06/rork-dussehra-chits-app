import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowLeft,
  CreditCard,
  Gift,
  Clock,
  Check,
  AlertCircle,
  Calendar,
  Loader,
} from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import type { Payment } from "@/types";

const RAZORPAY_KEY_ID = "rzp_test_RWXxv9pcPpv9tJ";

export default function CustomerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customerChit, rewards, makePayment } = useApp();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timelineScrollRef = useRef<ScrollView>(null);

  const progress = (customerChit.paidAmount / customerChit.totalAmount) * 100;

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (amount <= 0 || amount > customerChit.totalAmount - customerChit.paidAmount) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      if (Platform.OS === 'web') {
        await handleWebPayment(amount);
      } else {
        await handleMobilePayment(amount);
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Payment Failed", "There was an error processing your payment. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const handleWebPayment = async (amount: number) => {
    const amountInPaise = Math.round(amount * 100);
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: 'INR',
        name: 'Dussehra Chits',
        description: `Payment for ${customerChit.schemeName}`,
        handler: function (response: any) {
          console.log('Payment successful:', response);
          makePayment(amount, response.razorpay_payment_id);
          setPaymentAmount("");
          setShowPaymentModal(false);
          setIsProcessingPayment(false);
          
          Animated.spring(progressAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start(() => {
            progressAnim.setValue(0);
          });
          
          Alert.alert("Payment Successful", `₹${amount} has been paid successfully!`);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setIsProcessingPayment(false);
          }
        },
        theme: {
          color: Colors.primary,
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
  };

  const handleMobilePayment = async (amount: number) => {
    const amountInPaise = Math.round(amount * 100);
    
    const paymentUrl = `https://api.razorpay.com/v1/checkout/embedded?key_id=${RAZORPAY_KEY_ID}&amount=${amountInPaise}&currency=INR&name=Dussehra Chits&description=Payment for ${customerChit.schemeName}`;
    
    try {
      const result = await WebBrowser.openBrowserAsync(paymentUrl);
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        setIsProcessingPayment(false);
        return;
      }
      
      makePayment(amount, `txn_${Date.now()}`);
      setPaymentAmount("");
      setShowPaymentModal(false);
      setIsProcessingPayment(false);
      
      Animated.spring(progressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start(() => {
        progressAnim.setValue(0);
      });
      
      Alert.alert("Payment Successful", `₹${amount} has been paid successfully!`);
    } catch (error) {
      console.error('Browser error:', error);
      throw error;
    }
  };

  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return Colors.paid;
      case "overdue":
        return Colors.overdue;
      case "due":
        return Colors.warning;
      default:
        return Colors.textLight;
    }
  };

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "paid":
        return <Check size={16} color={Colors.paid} />;
      case "overdue":
        return <AlertCircle size={16} color={Colors.overdue} />;
      case "due":
        return <Clock size={16} color={Colors.warning} />;
      default:
        return <Calendar size={16} color={Colors.textLight} />;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Chit Plan",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
        }}
      />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.dashboardCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.schemeName}>{customerChit.schemeName}</Text>
              <Text style={styles.schemeAmount}>
                ₹{customerChit.totalAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.badge}>
              <CreditCard size={24} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    transform: [
                      {
                        scale: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
            <View style={styles.amountInfo}>
              <Text style={styles.amountText}>
                Paid: ₹{customerChit.paidAmount.toLocaleString()}
              </Text>
              <Text style={styles.amountText}>
                Remaining: ₹{(customerChit.totalAmount - customerChit.paidAmount).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.nextDueSection}>
            <View style={styles.dueInfo}>
              <Clock size={20} color={Colors.textSecondary} />
              <View style={styles.dueText}>
                <Text style={styles.dueLabel}>Next Due Date</Text>
                <Text style={styles.dueDate}>
                  {new Date(customerChit.nextDueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => setShowPaymentModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Timeline</Text>
          <ScrollView 
            ref={timelineScrollRef}
            style={styles.timeline}
            showsVerticalScrollIndicator={false}
          >
            {customerChit.payments.map((payment, index) => {
              const isPartiallyPaid = payment.amountPaid > 0 && payment.amountPaid < payment.amount;
              const remainingAmount = payment.amount - payment.amountPaid;
              
              return (
                <View key={payment.id} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: getStatusColor(payment.status) },
                      ]}
                    >
                      {payment.status === "paid" && (
                        <Check size={12} color={Colors.background} />
                      )}
                    </View>
                    {index < customerChit.payments.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor:
                              payment.status === "paid"
                                ? Colors.paid
                                : Colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.paymentCard}>
                      <View style={styles.paymentHeader}>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.installmentNumber}>
                            Installment #{payment.installmentNumber}
                          </Text>
                          <View style={styles.statusBadge}>
                            {getStatusIcon(payment.status)}
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(payment.status) },
                              ]}
                            >
                              {payment.status === "paid" 
                                ? "Paid" 
                                : isPartiallyPaid
                                ? "Partially Paid"
                                : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.amountColumn}>
                          <Text style={styles.paymentAmount}>
                            ₹{payment.amount.toLocaleString()}
                          </Text>
                          {isPartiallyPaid && (
                            <Text style={styles.paidAmountLabel}>
                              Paid: ₹{payment.amountPaid.toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      {isPartiallyPaid && (
                        <View style={styles.partialPaymentBar}>
                          <View style={styles.partialProgressContainer}>
                            <View
                              style={[
                                styles.partialProgressFill,
                                {
                                  width: `${(payment.amountPaid / payment.amount) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.remainingText}>
                            Remaining: ₹{remainingAmount.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.paymentFooter}>
                        <Text style={styles.paymentDate}>
                          {payment.status === "paid"
                            ? `Paid on ${new Date(payment.date).toLocaleDateString("en-IN")}`
                            : isPartiallyPaid
                            ? `Last paid on ${new Date(payment.date).toLocaleDateString("en-IN")}`
                            : `Due on ${new Date(payment.dueDate).toLocaleDateString("en-IN")}`}
                        </Text>
                        {payment.transactionId && (
                          <Text style={styles.transactionId}>
                            Txn: {payment.transactionId}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <View style={styles.rewardsContainer}>
            {rewards.map((reward) => (
              <View
                key={reward.id}
                style={[
                  styles.rewardCard,
                  reward.unlocked && styles.rewardCardUnlocked,
                ]}
              >
                <View style={styles.rewardIcon}>
                  <Gift
                    size={24}
                    color={reward.unlocked ? Colors.primary : Colors.textLight}
                  />
                </View>
                <View style={styles.rewardContent}>
                  <Text
                    style={[
                      styles.rewardName,
                      reward.unlocked && styles.rewardNameUnlocked,
                    ]}
                  >
                    {reward.name}
                  </Text>
                  <Text style={styles.rewardDescription}>
                    {reward.description}
                  </Text>
                  <View style={styles.rewardProgressBar}>
                    <View
                      style={[
                        styles.rewardProgressFill,
                        {
                          width: `${Math.min(
                            (progress / reward.requiredProgress) * 100,
                            100
                          )}%`,
                          backgroundColor: reward.unlocked
                            ? Colors.success
                            : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.rewardProgress}>
                    {reward.unlocked
                      ? "Unlocked!"
                      : `${Math.round(progress)}% / ${reward.requiredProgress}%`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Make Payment</Text>
            <Text style={styles.modalSubtitle}>
              Enter any amount you want to pay
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                autoFocus
              />
            </View>
            
            <View style={styles.suggestedAmounts}>
              <Text style={styles.suggestedLabel}>Quick amounts:</Text>
              <View style={styles.suggestedButtons}>
                {[500, 1000, 2000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.suggestedButton}
                    onPress={() => setPaymentAmount(amount.toString())}
                  >
                    <Text style={styles.suggestedButtonText}>₹{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!paymentAmount || isProcessingPayment) && styles.confirmButtonDisabled,
                ]}
                onPress={handlePayment}
                disabled={!paymentAmount || isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <View style={styles.loadingContainer}>
                    <Loader size={20} color={Colors.background} />
                    <Text style={styles.confirmButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmButtonText}>Pay with Razorpay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    padding: 20,
  },
  dashboardCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  schemeName: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  schemeAmount: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  amountInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  nextDueSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dueInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dueText: {
    flex: 1,
  },
  dueLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  payButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  payButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  paymentCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  installmentNumber: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  paymentFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rewardsContainer: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    opacity: 0.7,
  },
  rewardCardUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardContent: {
    flex: 1,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  rewardNameUnlocked: {
    color: Colors.success,
  },
  rewardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  rewardProgressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  rewardProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  rewardProgress: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.text,
    paddingVertical: 16,
  },
  suggestedAmounts: {
    marginBottom: 24,
  },
  suggestedLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  suggestedButtons: {
    flexDirection: "row",
    gap: 12,
  },
  suggestedButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  suggestedButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.background,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  paidAmountLabel: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 2,
    fontWeight: "600" as const,
  },
  partialPaymentBar: {
    marginTop: 12,
    marginBottom: 8,
  },
  partialProgressContainer: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  partialProgressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  transactionId: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
    fontFamily: "monospace" as const,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
