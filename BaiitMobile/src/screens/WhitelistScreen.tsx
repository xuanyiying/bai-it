import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '../services/storage';
import { AccessibilityService } from '../services/accessibility';

const DEFAULT_APPS = [
  { id: 'com.twitter.android', name: 'Twitter', enabled: true },
  { id: 'com.facebook.katana', name: 'Facebook', enabled: true },
  { id: 'com.instagram.android', name: 'Instagram', enabled: false },
  { id: 'com.reddit.frontpage', name: 'Reddit', enabled: false },
  { id: 'com.linkedin.android', name: 'LinkedIn', enabled: false },
  { id: 'com.google.android.apps.translate', name: 'Google Translate', enabled: false },
  { id: 'com.medium.reader', name: 'Medium', enabled: false },
  { id: 'com.quora.android', name: 'Quora', enabled: false },
];

export function WhitelistScreen() {
  const [apps, setApps] = useState(DEFAULT_APPS);

  useEffect(() => {
    loadWhitelist();
  }, []);

  const loadWhitelist = async () => {
    const whitelist = await storage.get<string[]>('whitelist');
    if (whitelist) {
      setApps(prev =>
        prev.map(app => ({
          ...app,
          enabled: whitelist.includes(app.id),
        }))
      );
    }
  };

  const toggleApp = async (appId: string, enabled: boolean) => {
    const newApps = apps.map(app =>
      app.id === appId ? { ...app, enabled } : app
    );
    setApps(newApps);

    const whitelist = newApps.filter(app => app.enabled).map(app => app.id);
    await storage.set('whitelist', whitelist);

    // 同步更新无障碍服务的白名单
    AccessibilityService.updateWhitelist(whitelist);
  };

  const renderItem = ({ item }: { item: typeof DEFAULT_APPS[0] }) => (
    <View style={styles.appItem}>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name}</Text>
        <Text style={styles.appId}>{item.id}</Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={(value) => toggleApp(item.id, value)}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={item.enabled ? '#2196F3' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          选择需要启用 Bai-it 辅助的应用
        </Text>
      </View>
      <FlatList
        data={apps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
  },
  appId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
