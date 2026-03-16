import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Database, SavedSentence } from '../services/database';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const SentencesScreen: React.FC = () => {
  const [sentences, setSentences] = useState<SavedSentence[]>([]);
  const [filteredList, setFilteredList] = useState<SavedSentence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState<SavedSentence | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { theme } = useTheme();
  const { t } = useLanguage();

  const loadSentences = useCallback(async () => {
    const all = await Database.getAllSentences();
    setSentences(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSentences();
    }, [loadSentences])
  );

  React.useEffect(() => {
    if (searchQuery) {
      const filtered = sentences.filter(
        (s) =>
          s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.translation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredList(filtered);
    } else {
      setFilteredList(sentences);
    }
  }, [sentences, searchQuery]);

  const handleDelete = (id: string) => {
    Alert.alert(
      t('common.confirm'),
      t('sentences.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await Database.deleteSentence(id);
            await loadSentences();
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSentences();
    setRefreshing(false);
  };

  const openDetail = (sentence: SavedSentence) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSentence(sentence);
    setModalVisible(true);
  };

  const renderSentenceItem = ({ item }: { item: SavedSentence }) => (
    <Pressable
      onPress={() => openDetail(item)}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <Card variant="elevated" style={styles.sentenceItem}>
        <Text style={[styles.sentenceText, { color: theme.colors.text }]} numberOfLines={3}>
          {item.text}
        </Text>
        
        {item.translation && (
          <Text style={[styles.translation, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.translation}
          </Text>
        )}
        
        <View style={styles.sentenceFooter}>
          <View style={styles.wordsContainer}>
            {item.words.slice(0, 5).map((word, index) => (
              <Badge key={`${item.id}-word-${index}`} label={word} variant="info" size="sm" />
            ))}
            {item.words.length > 5 && (
              <Text style={[styles.moreWords, { color: theme.colors.textSecondary }]}>
                +{item.words.length - 5}
              </Text>
            )}
          </View>
          
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Button
            title={t('common.delete')}
            onPress={() => handleDelete(item.id)}
            variant="ghost"
            size="sm"
            textStyle={{ color: theme.colors.error }}
          />
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('sentences.title')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {t('sentences.total', { count: sentences.length })}
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Input
          placeholder={t('sentences.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          variant="filled"
        />
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderSentenceItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title={searchQuery ? t('sentences.noMatch') : t('sentences.noSentences')}
          />
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('sentences.detail')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedSentence && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    {t('sentences.original')}
                  </Text>
                  <Text style={[styles.originalText, { color: theme.colors.text }]}>
                    {selectedSentence.text}
                  </Text>
                </View>

                {selectedSentence.translation && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                      {t('sentences.translation')}
                    </Text>
                    <Text style={[styles.translationText, { color: theme.colors.text }]}>
                      {selectedSentence.translation}
                    </Text>
                  </View>
                )}

                {selectedSentence.analysisResult && (
                  <>
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                        {t('sentences.chunks')}
                      </Text>
                      <Text style={[styles.analysisText, { color: theme.colors.text }]}>
                        {selectedSentence.analysisResult.chunked}
                      </Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                        {t('sentences.analysis')}
                      </Text>
                      <Text style={[styles.analysisText, { color: theme.colors.text }]}>
                        {selectedSentence.analysisResult.sentenceAnalysis}
                      </Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                        {t('sentences.tips')}
                      </Text>
                      <Text style={[styles.analysisText, { color: theme.colors.text }]}>
                        {selectedSentence.analysisResult.expressionTips}
                      </Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                        {t('sentences.newWords')}
                      </Text>
                      {selectedSentence.analysisResult.newWords.map((word, index) => (
                        <Card key={`newword-${word.word}-${index}`} variant="default" padding="sm" style={styles.newWordItem}>
                          <Text style={[styles.newWord, { color: theme.colors.primary }]}>
                            {word.word}
                          </Text>
                          <Text style={[styles.newWordDef, { color: theme.colors.textSecondary }]}>
                            {word.definition}
                          </Text>
                        </Card>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                    {t('sentences.newWords')}
                  </Text>
                  <View style={styles.wordsList}>
                    {selectedSentence.words.map((word, index) => (
                      <Badge key={`${selectedSentence.id}-badge-${index}`} label={word} variant="default" />
                    ))}
                  </View>
                </View>

                {selectedSentence.sourceApp && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                      {t('sentences.source')}
                    </Text>
                    <Text style={[styles.sourceText, { color: theme.colors.text }]}>
                      {selectedSentence.sourceApp}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    padding: 12,
  },
  listContainer: {
    padding: 12,
    paddingTop: 8,
  },
  sentenceItem: {
    marginBottom: 12,
  },
  sentenceText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sentenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
  },
  moreWords: {
    fontSize: 12,
    alignSelf: 'center',
  },
  date: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  originalText: {
    fontSize: 18,
    lineHeight: 28,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 22,
  },
  newWordItem: {
    marginBottom: 8,
  },
  newWord: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  newWordDef: {
    fontSize: 14,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceText: {
    fontSize: 14,
  },
});
