import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Phone,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  Target,
  Clock,
} from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import type { Customer } from "@/types";

export default function CollectorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customers, getCollectorStats, updateCustomerStatus } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "due" | "overdue">("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const collectorId = "col1";
  const stats = getCollectorStats(collectorId);
  const collectedPercentage = (stats.collectedToday / stats.todayTarget) * 100;

  const myCustomers = customers.filter((c) => c.collectorId === collectorId);

  const filteredCustomers = myCustomers
    .filter((customer) => {
      const matchesSearch = customer.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || customer.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const statusOrder: Record<string, number> = { overdue: 0, due: 1, paid: 2, upcoming: 3 };
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    });

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleMarkPaid = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    if (selectedCustomer && paymentAmount) {
      const amount = parseFloat(paymentAmount);
      if (amount > 0) {
        updateCustomerStatus(selectedCustomer.id, amount);
        setPaymentAmount("");
        setShowPaymentModal(false);
        setSelectedCustomer(null);
      }
    }
  };

  const getStatusColor = (status: Customer["status"]) => {
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Collections",
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
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Target size={24} color={Colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Today&apos;s Target</Text>
              <Text style={styles.statValue}>
                ₹{stats.todayTarget.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <TrendingUp size={24} color={Colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Collected Today</Text>
              <Text style={[styles.statValue, { color: Colors.success }]}>
                ₹{stats.collectedToday.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
              <Clock size={24} color={Colors.warning} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: Colors.warning }]}>
                ₹{stats.pendingToday.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Collection Progress</Text>
            <Text style={styles.progressPercent}>
              {Math.round(collectedPercentage)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(collectedPercentage, 100)}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.filterContainer}>
            {(["all", "paid", "due", "overdue"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.customersSection}>
          <Text style={styles.sectionTitle}>
            Customers ({filteredCustomers.length})
          </Text>
          {filteredCustomers.map((customer) => (
            <View key={customer.id} style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPlan}>{customer.planName}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(customer.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(customer.status) },
                    ]}
                  >
                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.customerDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{customer.phone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Payment:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(customer.lastPaymentDate).toLocaleDateString("en-IN")}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid:</Text>
                  <Text style={[styles.detailValue, { color: Colors.success }]}>
                    ₹{customer.paidAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due:</Text>
                  <Text style={[styles.detailValue, { color: Colors.warning }]}>
                    ₹{(customer.totalAmount - customer.paidAmount).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.customerActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCall(customer.phone)}
                >
                  <Phone size={18} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSMS(customer.phone)}
                >
                  <MessageSquare size={18} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.markPaidButton]}
                  onPress={() => handleMarkPaid(customer)}
                >
                  <CheckCircle size={18} color={Colors.background} />
                  <Text style={styles.markPaidButtonText}>Mark Paid</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
            <Text style={styles.modalTitle}>Record Payment</Text>
            {selectedCustomer && (
              <Text style={styles.modalSubtitle}>
                {selectedCustomer.name} - {selectedCustomer.planName}
              </Text>
            )}

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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setSelectedCustomer(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !paymentAmount && styles.confirmButtonDisabled,
                ]}
                onPress={confirmPayment}
                disabled={!paymentAmount}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
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
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.background,
  },
  customersSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerPlan: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  customerDetails: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  customerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  markPaidButton: {
    backgroundColor: Colors.primary,
  },
  markPaidButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.background,
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
    marginBottom: 24,
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
});
