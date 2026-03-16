import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { Database, VocabRecord, VocabStatus } from '../services/database';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { staggerDelay } from '../utils/animations';

export const VocabScreen: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabRecord[]>([]);
  const [filteredList, setFilteredList] = useState<VocabRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<VocabStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    learning: 0,
    mastered: 0,
  });

  const { theme } = useTheme();
  const { t } = useLanguage();

  const loadVocab = useCallback(async () => {
    const all = await Database.getAllVocab();
    setVocabList(all);
    
    setStats({
      total: all.length,
      new: all.filter(v => v.status === 'new').length,
      learning: all.filter(v => v.status === 'learning').length,
      mastered: all.filter(v => v.status === 'mastered').length,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVocab();
    }, [loadVocab])
  );

  useEffect(() => {
    let filtered = vocabList;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(v => v.status === selectedStatus);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.definition?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredList(filtered);
  }, [vocabList, selectedStatus, searchQuery]);

  const handleStatusChange = async (id: string, status: VocabStatus) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Database.updateVocabStatus(id, status);
    await loadVocab();
  };

  const handleDelete = (id: string, word: string) => {
    Alert.alert(
      t('common.confirm'),
      t('vocab.confirmDelete', { word }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await Database.deleteVocab(id);
            await loadVocab();
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVocab();
    setRefreshing(false);
  };

  const getStatusBadgeVariant = (status: VocabStatus): 'error' | 'warning' | 'success' => {
    switch (status) {
      case 'new':
        return 'error';
      case 'learning':
        return 'warning';
      case 'mastered':
        return 'success';
    }
  };

  const getStatusLabel = (status: VocabStatus): string => {
    switch (status) {
      case 'new':
        return t('vocab.new');
      case 'learning':
        return t('vocab.learning');
      case 'mastered':
        return t('vocab.mastered');
    }
  };

  const renderFilterTab = (status: VocabStatus | 'all', label: string, count: number, index: number) => (
    <Animated.View 
      key={status}
      entering={FadeInDown.delay(staggerDelay(index, 60)).springify()}
    >
      <TouchableOpacity
        style={[
          styles.filterTab,
          {
            backgroundColor: selectedStatus === status ? theme.colors.primary : theme.colors.surface,
            borderColor: selectedStatus === status ? theme.colors.primary : theme.colors.border,
            ...theme.shadows.sm,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedStatus(status);
        }}
      >
        <Text
          style={[
            styles.filterTabText,
            { 
              color: selectedStatus === status ? '#FFFFFF' : theme.colors.text,
              fontWeight: selectedStatus === status 
                ? theme.typography.fontWeight.semibold 
                : theme.typography.fontWeight.medium,
            },
          ]}
        >
          {label}
        </Text>
        <View style={[
          styles.filterCount,
          { 
            backgroundColor: selectedStatus === status 
              ? 'rgba(255,255,255,0.25)' 
              : theme.colors.surfaceSecondary,
          }
        ]}>
          <Text style={[
            styles.filterCountText,
            { 
              color: selectedStatus === status ? '#FFFFFF' : theme.colors.textSecondary,
              fontWeight: theme.typography.fontWeight.semibold,
            }
          ]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderVocabItem = ({ item, index }: { item: VocabRecord; index: number }) => (
    <Animated.View
      entering={SlideInRight.delay(staggerDelay(index, 40)).springify()}
      layout={Layout.springify()}
    >
      <Card variant="elevated" style={styles.vocabItem}>
        <View style={styles.vocabHeader}>
          <View style={styles.wordContainer}>
            <Text style={[
              styles.word, 
              { 
                color: theme.colors.text,
                fontWeight: theme.typography.fontWeight.bold,
              }
            ]}>
              {item.word}
            </Text>
            <Badge
              label={getStatusLabel(item.status)}
              variant={getStatusBadgeVariant(item.status)}
              size="sm"
              dot
            />
          </View>
        </View>
        
        {item.phonetic && (
          <Text style={[
            styles.phonetic, 
            { 
              color: theme.colors.primary,
              fontSize: theme.typography.fontSize.sm,
            }
          ]}>
            {item.phonetic}
          </Text>
        )}
        
        {item.definition && (
          <Text style={[
            styles.definition, 
            { 
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.base,
              lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
            }
          ]} numberOfLines={3}>
            {item.definition}
          </Text>
        )}
        
        <View style={styles.vocabFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="repeat-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[
              styles.encounterCount, 
              { 
                color: theme.colors.textTertiary,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              {t('vocab.encounterCount', { count: item.encounterCount })}
            </Text>
          </View>
          <Text style={[
            styles.date, 
            { 
              color: theme.colors.textTertiary,
              fontSize: theme.typography.fontSize.xs,
            }
          ]}>
            {new Date(item.firstSeenAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actions}>
          {item.status !== 'learning' && (
            <Button
              title={t('vocab.learning')}
              onPress={() => handleStatusChange(item.id, 'learning')}
              variant="outline"
              size="sm"
              style={styles.actionButton}
            />
          )}
          {item.status !== 'mastered' && (
            <Button
              title={t('vocab.mastered')}
              onPress={() => handleStatusChange(item.id, 'mastered')}
              variant="secondary"
              size="sm"
              style={styles.actionButton}
            />
          )}
          <Button
            title={t('common.delete')}
            onPress={() => handleDelete(item.id, item.word)}
            variant="ghost"
            size="sm"
            textStyle={{ color: theme.colors.error }}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Animated.View entering={FadeIn.delay(50)}>
          <Text style={[
            styles.title, 
            { 
              color: theme.colors.text,
              fontWeight: theme.typography.fontWeight.bold,
            }
          ]}>
            {t('vocab.title')}
          </Text>
          <Text style={[
            styles.subtitle, 
            { 
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.sm,
            }
          ]}>
            {t('vocab.total', { count: stats.total })}
          </Text>
        </Animated.View>
      </View>

      <Animated.View 
        entering={FadeInDown.delay(100)}
        style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Input
          placeholder={t('vocab.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          variant="filled"
        />
      </Animated.View>

      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
        {renderFilterTab('all', t('vocab.all'), stats.total, 0)}
        {renderFilterTab('new', t('vocab.new'), stats.new, 1)}
        {renderFilterTab('learning', t('vocab.learning'), stats.learning, 2)}
        {renderFilterTab('mastered', t('vocab.mastered'), stats.mastered, 3)}
      </View>

      <FlatList<VocabRecord>
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderVocabItem as ListRenderItem<VocabRecord>}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📚"
            title={searchQuery ? t('vocab.noMatch') : t('vocab.noWords')}
            message={searchQuery ? '尝试其他搜索词' : '开始阅读英文内容，自动收集生词'}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
  },
  filterTabText: {
    fontSize: 13,
  },
  filterCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 11,
  },
  listContainer: {
    padding: 20,
    paddingTop: 4,
  },
  vocabItem: {
    marginBottom: 14,
  },
  vocabHeader: {
    marginBottom: 8,
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  word: {
    fontSize: 22,
  },
  phonetic: {
    marginBottom: 6,
  },
  definition: {
    marginBottom: 12,
  },
  vocabFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encounterCount: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
  },
});
