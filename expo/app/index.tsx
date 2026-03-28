import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Users, Shield } from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { switchRole } = useApp();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRoleSelect = (role: "customer" | "collector" | "admin") => {
    switchRole(role);
    if (role === "customer") {
      router.push("/customer");
    } else if (role === "collector") {
      router.push("/collector");
    } else {
      router.push("/admin");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Dussehra Chits</Text>
          <Text style={styles.subtitle}>
            Select your role to continue
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          <TouchableOpacity
            style={[styles.roleCard, styles.customerCard]}
            onPress={() => handleRoleSelect("customer")}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <User size={32} color={Colors.primary} />
            </View>
            <Text style={styles.roleTitle}>Customer</Text>
            <Text style={styles.roleDescription}>
              Manage your chit plans and payments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.collectorCard]}
            onPress={() => handleRoleSelect("collector")}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Users size={32} color={Colors.primary} />
            </View>
            <Text style={styles.roleTitle}>Collector</Text>
            <Text style={styles.roleDescription}>
              Track collections and manage customers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.adminCard]}
            onPress={() => handleRoleSelect("admin")}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Shield size={32} color={Colors.primary} />
            </View>
            <Text style={styles.roleTitle}>Admin</Text>
            <Text style={styles.roleDescription}>
              Manage schemes, members, and analytics
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  collectorCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  adminCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
