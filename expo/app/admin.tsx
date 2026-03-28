import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Search,
  Download,
  Activity,
  Calendar,
} from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customers, schemes, activities, getAdminStats } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const stats = getAdminStats();

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = [
    { month: "Aug", collected: 15000, target: 20000 },
    { month: "Sep", collected: 18000, target: 22000 },
    { month: "Oct", collected: 21000, target: 25000 },
  ];

  const maxValue = Math.max(...chartData.map((d) => Math.max(d.collected, d.target)));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Admin Dashboard",
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
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardLarge]}>
            <View style={styles.metricIcon}>
              <DollarSign size={24} color={Colors.success} />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Total Collections</Text>
              <Text style={styles.metricValue}>
                ₹{stats.totalCollections.toLocaleString()}
              </Text>
              <Text style={styles.metricSubtext}>This Month</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors.primaryLight + "20" }]}>
              <Users size={20} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{stats.activeMembers}</Text>
            <Text style={styles.metricLabel}>Active Members</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors.warningLight }]}>
              <AlertCircle size={20} color={Colors.warning} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.warning }]}>
              ₹{stats.pendingPayments.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Pending Payments</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: Colors.successLight }]}>
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              {Math.round(stats.completionRate)}%
            </Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Collections Trend</Text>
          <View style={styles.chart}>
            <View style={styles.chartYAxis}>
              <Text style={styles.yAxisLabel}>₹{(maxValue / 1000).toFixed(0)}K</Text>
              <Text style={styles.yAxisLabel}>₹{(maxValue / 2000).toFixed(0)}K</Text>
              <Text style={styles.yAxisLabel}>₹0</Text>
            </View>
            <View style={styles.chartContent}>
              {chartData.map((data, index) => {
                const collectedHeight = (data.collected / maxValue) * 120;
                const targetHeight = (data.target / maxValue) * 120;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barGroup}>
                      <View
                        style={[
                          styles.bar,
                          styles.collectedBar,
                          { height: collectedHeight },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          styles.targetBar,
                          { height: targetHeight },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{data.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Collected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.border }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Activity size={20} color={Colors.primary} />
          </View>
          <View style={styles.activityList}>
            {activities.slice(0, 5).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.membersSection}>
          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity style={styles.exportButton}>
              <Download size={18} color={Colors.primary} />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.membersList}>
            {filteredCustomers.map((customer) => {
              const progress = (customer.paidAmount / customer.totalAmount) * 100;
              return (
                <View key={customer.id} style={styles.memberCard}>
                  <View style={styles.memberHeader}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{customer.name}</Text>
                      <Text style={styles.memberPhone}>{customer.phone}</Text>
                    </View>
                    <View
                      style={[
                        styles.memberStatusBadge,
                        {
                          backgroundColor:
                            customer.status === "paid"
                              ? Colors.successLight
                              : customer.status === "overdue"
                              ? Colors.errorLight
                              : Colors.warningLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberStatusText,
                          {
                            color:
                              customer.status === "paid"
                                ? Colors.success
                                : customer.status === "overdue"
                                ? Colors.error
                                : Colors.warning,
                          },
                        ]}
                      >
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.memberDetails}>
                    <View style={styles.memberDetailRow}>
                      <Text style={styles.memberDetailLabel}>Plan:</Text>
                      <Text style={styles.memberDetailValue}>{customer.planName}</Text>
                    </View>
                    <View style={styles.memberDetailRow}>
                      <Text style={styles.memberDetailLabel}>Progress:</Text>
                      <Text style={styles.memberDetailValue}>{Math.round(progress)}%</Text>
                    </View>
                  </View>

                  <View style={styles.memberProgress}>
                    <View style={styles.memberProgressBar}>
                      <View
                        style={[
                          styles.memberProgressFill,
                          { width: `${progress}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.memberAmounts}>
                      <Text style={styles.memberAmountPaid}>
                        ₹{customer.paidAmount.toLocaleString()}
                      </Text>
                      <Text style={styles.memberAmountTotal}>
                        / ₹{customer.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.schemesSection}>
          <Text style={styles.sectionTitle}>Chit Schemes</Text>
          <View style={styles.schemesList}>
            {schemes.map((scheme) => (
              <View key={scheme.id} style={styles.schemeCard}>
                <View style={styles.schemeHeader}>
                  <Text style={styles.schemeName}>{scheme.name}</Text>
                  <Text style={styles.schemeAmount}>
                    ₹{scheme.totalAmount.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.schemeDescription}>{scheme.description}</Text>
                <View style={styles.schemeDetails}>
                  <View style={styles.schemeDetailItem}>
                    <Calendar size={14} color={Colors.textSecondary} />
                    <Text style={styles.schemeDetailText}>
                      {scheme.duration} {scheme.frequency}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  metricCardLarge: {
    width: width - 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 4,
  },
  metricSubtext: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 20,
  },
  chart: {
    flexDirection: "row",
    height: 140,
    marginBottom: 16,
  },
  chartYAxis: {
    width: 40,
    justifyContent: "space-between",
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  chartContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  barGroup: {
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-end",
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  collectedBar: {
    backgroundColor: Colors.primary,
  },
  targetBar: {
    backgroundColor: Colors.border,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activityCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: "row",
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  membersSection: {
    marginBottom: 20,
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight + "20",
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
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
  membersList: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  memberPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  memberStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberStatusText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  memberDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  memberDetailRow: {
    flexDirection: "row",
    gap: 4,
  },
  memberDetailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  memberDetailValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  memberProgress: {
    gap: 6,
  },
  memberProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  memberProgressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  memberAmounts: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  memberAmountPaid: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.success,
  },
  memberAmountTotal: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  schemesSection: {
    marginBottom: 20,
  },
  schemesList: {
    gap: 12,
    marginTop: 16,
  },
  schemeCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  schemeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  schemeAmount: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  schemeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  schemeDetails: {
    flexDirection: "row",
    gap: 16,
  },
  schemeDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  schemeDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
