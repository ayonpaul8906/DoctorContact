import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminDiagnosticCenters } from '../../hooks/useAdmin';
import { ScreenHeader, EmptyState, Icon } from '../../components';
import { Colors, Spacing, Radius, Typography } from '../../theme';

export default function AdminDiagnosticsScreen() {
  const { data: centers, isLoading, isError, refetch, isRefetching } = useAdminDiagnosticCenters();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={centers ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader
              title="Diagnostic Centers"
              subtitle="Manage diagnostic labs and partner centers"
              badgeText="Admin"
            />

            {!isLoading && (
              <Text style={styles.countText}>
                {(centers ?? []).length} center{(centers ?? []).length !== 1 ? 's' : ''} registered
              </Text>
            )}

            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <Text style={styles.stateText}>Loading diagnostic centers...</Text>
              </View>
            )}

            {!isLoading && isError && (
              <View style={styles.errorState}>
                <Icon name="alert-circle" size={20} color={Colors.light.danger} />
                <Text style={styles.errorText}>Failed to load diagnostic centers</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading && !isError ? (
            <EmptyState
              title="No Diagnostic Centers"
              description="No diagnostic centers are registered on the platform yet."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Icon name="activity" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.centerInfo}>
                <Text style={styles.centerName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.locationRow}>
                  <Icon name="map-pin" size={12} color={Colors.light.ink500} />
                  <Text style={styles.centerCity}>{item.city || 'Dubrajpur'}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Active</Text>
              </View>
            </View>

            {item.phone && (
              <View style={styles.phoneRow}>
                <Icon name="phone" size={12} color={Colors.light.ink500} />
                <Text style={styles.phoneText}>{item.phone}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSoft,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 80,
  },
  countText: {
    fontSize: 12,
    color: Colors.light.ink500,
    fontWeight: '500',
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0E7490',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: Typography.fontSizes.sm,
    fontWeight: '700',
    color: Colors.light.ink900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  centerCity: {
    fontSize: 12,
    color: Colors.light.ink500,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.light.surface100,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.light.ink600,
  },
  centerState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.surfaceWhite,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.three,
  },
  stateText: {
    fontSize: 13,
    color: Colors.light.ink500,
  },
  errorState: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: Spacing.four,
    gap: 8,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.danger,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: Colors.light.danger,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
