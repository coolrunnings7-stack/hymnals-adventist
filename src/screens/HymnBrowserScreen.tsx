// src/screens/HymnBrowserScreen.tsx
// Main hymn browser — edition selector, search, hymn list

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  getAllEditions,
  getHymnsByEdition,
  searchHymns,
  toggleFavorite,
  isFavorite,
  HymnalEdition,
  HymnEntry,
} from '../database/db';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const EDITION_COLORS: Record<string, string> = {
  MILLENNIAL1849: '#6b4226',
  SDA1869:        '#4a5568',
  CHRIST1908:     '#744210',
  CHURCH1941:     '#2d4a62',
  SDA1985:        '#1a3a5c',
};

export default function HymnBrowserScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [editions, setEditions] = useState<HymnalEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>('SDA1985');
  const [hymns, setHymns] = useState<HymnEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [showEditionPicker, setShowEditionPicker] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    bg:          isDark ? Colors.backgroundDark : Colors.background,
    surface:     isDark ? Colors.surfaceDark    : Colors.surface,
    surfaceAlt:  isDark ? Colors.surfaceAltDark : Colors.surfaceAlt,
    text:        isDark ? Colors.textDark       : Colors.text,
    textSec:     isDark ? Colors.textSecondaryDark : Colors.textSecondary,
    border:      isDark ? Colors.borderDark     : Colors.border,
  };

  useEffect(() => {
    loadEditions();
  }, []);

  useEffect(() => {
    if (!isSearching) {
      loadHymns();
    }
  }, [selectedEdition]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch();
      } else if (searchQuery.length === 0) {
        setIsSearching(false);
        loadHymns();
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const loadEditions = async () => {
    const data = await getAllEditions();
    // Sort: primary first, then by year
    const sorted = [...data].sort((a, b) => b.is_primary - a.is_primary || a.year_published - b.year_published);
    setEditions(sorted);
  };

  const loadHymns = async () => {
    setLoading(true);
    try {
      const data = await getHymnsByEdition(selectedEdition);
      setHymns(data);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    setLoading(true);
    try {
      const results = await searchHymns(searchQuery);
      setHymns(results);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (hymnId: number) => {
    const isFav = await toggleFavorite(hymnId);
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.add(hymnId); else next.delete(hymnId);
      return next;
    });
  };

  const handleHymnPress = (hymn: HymnEntry) => {
    navigation.navigate('HymnDetail', { hymnId: hymn.id, title: hymn.canonical_title });
  };

  const currentEdition = editions.find(e => e.code === selectedEdition);

  const renderEditionPill = ({ item }: { item: HymnalEdition }) => {
    const isSelected = item.code === selectedEdition;
    const edColor = EDITION_COLORS[item.code] || Colors.primary;
    return (
      <TouchableOpacity
        onPress={() => { setSelectedEdition(item.code); setShowEditionPicker(false); }}
        style={[
          styles.editionPill,
          {
            backgroundColor: isSelected ? edColor : theme.surfaceAlt,
            borderColor: isSelected ? edColor : theme.border,
          }
        ]}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.editionPillYear,
          { color: isSelected ? 'rgba(255,255,255,0.75)' : theme.textSec }
        ]}>
          {item.year_published}
        </Text>
        <Text style={[
          styles.editionPillTitle,
          { color: isSelected ? '#fff' : theme.text }
        ]} numberOfLines={1}>
          {item.is_primary ? 'SDA Hymnal' : item.title.replace('The ', '')}
        </Text>
        <Text style={[
          styles.editionPillCount,
          { color: isSelected ? 'rgba(255,255,255,0.65)' : theme.textSec }
        ]}>
          {item.total_hymns}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHymnRow = ({ item, index }: { item: HymnEntry; index: number }) => {
    const isFav = favoriteIds.has(item.id);
    const tags = (() => {
      try { return JSON.parse(item.topic_tags || '[]') as string[]; }
      catch { return []; }
    })();

    return (
      <TouchableOpacity
        onPress={() => handleHymnPress(item)}
        activeOpacity={0.7}
        style={[
          styles.hymnRow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }
        ]}
      >
        {/* Hymn number */}
        <View style={[styles.hymnNumber, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.hymnNumberText, { color: theme.textSec }]}>
            {item.hymnal_number ?? index + 1}
          </Text>
        </View>

        {/* Hymn info */}
        <View style={styles.hymnInfo}>
          <Text style={[styles.hymnTitle, { color: theme.text }]} numberOfLines={1}>
            {item.canonical_title}
          </Text>
          <Text style={[styles.hymnFirstLine, { color: theme.textSec }]} numberOfLines={1}>
            {item.first_line}
          </Text>
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.slice(0, 3).map((tag: string) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[styles.tagText, { color: theme.textSec }]}>{tag}</Text>
                </View>
              ))}
              <Text style={[styles.verseCount, { color: theme.textSec }]}>
                {item.num_verses}v{item.has_chorus ? ' + chorus' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.hymnActions}>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? Colors.accent : theme.textSec}
            />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={16} color={theme.textSec} style={{ marginTop: 8 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Colors.primary}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Hymnals of the</Text>
            <Text style={styles.headerSubtitle}>Adventist Movement</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, first line, topic..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Edition selector */}
      {!isSearching && (
        <View style={[styles.editionBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <FlatList
            data={editions}
            renderItem={renderEditionPill}
            keyExtractor={item => item.code}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.editionList}
          />
        </View>
      )}

      {/* Current edition info bar */}
      {!isSearching && currentEdition && (
        <View style={[styles.infoBar, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.border }]}>
          <Text style={[styles.infoBarText, { color: theme.textSec }]}>
            {currentEdition.title} · {currentEdition.year_published} · {currentEdition.total_hymns} hymns
          </Text>
          <View style={styles.infoBarRight}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CrossIndex')}
              style={styles.crossIndexBtn}
            >
              <Ionicons name="git-compare-outline" size={14} color={Colors.primary} />
              <Text style={[styles.crossIndexText, { color: Colors.primary }]}>Cross-index</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search header */}
      {isSearching && (
        <View style={[styles.infoBar, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.border }]}>
          <Text style={[styles.infoBarText, { color: theme.textSec }]}>
            {hymns.length} results for "{searchQuery}" · all editions
          </Text>
        </View>
      )}

      {/* Hymn list */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSec }]}>Loading hymns...</Text>
        </View>
      ) : (
        <FlatList
          data={hymns}
          renderItem={renderHymnRow}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 68 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={48} color={theme.textSec} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No hymns found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSec }]}>
                {isSearching ? 'Try a different search term' : 'This edition is being loaded'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating action — Language selector */}
      <TouchableOpacity
        style={[styles.fab, Shadows.md]}
        onPress={() => navigation.navigate('LanguageSelector')}
        activeOpacity={0.85}
      >
        <Ionicons name="language" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 12,
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: '#ffffff',
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.accentLight,
    lineHeight: 22,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: '#ffffff',
    paddingVertical: 0,
  },

  // Edition selector
  editionBar: {
    borderBottomWidth: 0.5,
  },
  editionList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: 8,
  },
  editionPill: {
    borderRadius: BorderRadius.md,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  editionPillYear: {
    fontSize: Typography.xs,
    marginBottom: 1,
  },
  editionPillTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  editionPillCount: {
    fontSize: Typography.xs,
    marginTop: 1,
  },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    borderBottomWidth: 0.5,
  },
  infoBarText: {
    fontSize: Typography.xs,
  },
  infoBarRight: { flexDirection: 'row', alignItems: 'center' },
  crossIndexBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  crossIndexText: { fontSize: Typography.xs, fontWeight: Typography.medium },

  // Hymn rows
  listContent: {
    paddingBottom: 80,
  },
  hymnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
  },
  hymnNumber: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  hymnNumberText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  hymnInfo: {
    flex: 1,
    marginRight: 8,
  },
  hymnTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    marginBottom: 2,
  },
  hymnFirstLine: {
    fontSize: Typography.sm,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11 },
  verseCount: { fontSize: 11, marginLeft: 4 },
  hymnActions: {
    alignItems: 'center',
    flexShrink: 0,
  },

  // Loading
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: Typography.base },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.medium,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
