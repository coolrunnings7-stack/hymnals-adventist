// src/screens/HymnDetailScreen.tsx
// Full hymn view: lyrics by verse, audio player, cross-edition index, language switcher

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  useColorScheme, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getHymnDetail, getHymnLyrics, getAudioFiles,
  toggleFavorite, isFavorite, getCrossIndex,
  getAvailableLanguages,
  LyricVerse, CrossIndexEntry, HymnEntry,
} from '../database/db';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Español', fr: 'Français', pt: 'Português',
  ht: 'Kreyòl', de: 'Deutsch', sw: 'Kiswahili', tl: 'Tagalog',
};

export default function HymnDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { hymnId, title } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [hymn, setHymn] = useState<HymnEntry | null>(null);
  const [lyrics, setLyrics] = useState<LyricVerse[]>([]);
  const [crossIndex, setCrossIndex] = useState<CrossIndexEntry[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en']);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'music' | 'index'>('lyrics');

  // Audio player state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const theme = {
    bg:       isDark ? Colors.backgroundDark : Colors.background,
    surface:  isDark ? Colors.surfaceDark    : Colors.surface,
    surfaceAlt: isDark ? Colors.surfaceAltDark : Colors.surfaceAlt,
    text:     isDark ? Colors.textDark       : Colors.text,
    textSec:  isDark ? Colors.textSecondaryDark : Colors.textSecondary,
    border:   isDark ? Colors.borderDark     : Colors.border,
  };

  useEffect(() => {
    loadData();
    return () => { soundRef.current?.unloadAsync(); };
  }, [hymnId]);

  useEffect(() => {
    loadLyrics();
  }, [activeLanguage]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hymnData, crossData, langData, favData] = await Promise.all([
        getHymnDetail(hymnId),
        getCrossIndex(hymnId),
        getAvailableLanguages(hymnId),
        isFavorite(hymnId),
      ]);
      setHymn(hymnData ?? null);
      setCrossIndex(crossData);
      setAvailableLanguages(langData.map(l => l.language));
      setFavorite(favData);
      await loadLyrics();
    } finally {
      setLoading(false);
    }
  };

  const loadLyrics = async () => {
    const data = await getHymnLyrics(hymnId, activeLanguage);
    setLyrics(data);
  };

  const handleToggleFavorite = async () => {
    const result = await toggleFavorite(hymnId);
    setFavorite(result);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await soundRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      // In production: load from local_path or remote_url
      // For demo, just toggle state
      setIsPlaying(true);
    }
  };

  const tags = (() => {
    try { return JSON.parse(hymn?.topic_tags || '[]') as string[]; }
    catch { return []; }
  })();

  const verses = lyrics.filter(l => l.verse_number < 99);
  const chorus  = lyrics.find(l => l.verse_number === 99);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Navigation header */}
      <View style={[styles.navBar, { backgroundColor: Colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={handleToggleFavorite} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22}
              color={favorite ? Colors.accentLight : 'rgba(255,255,255,0.85)'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hymn title card */}
      <View style={[styles.titleCard, { backgroundColor: Colors.primary }]}>
        <Text style={styles.hymnTitle}>{hymn?.canonical_title}</Text>
        <Text style={styles.hymnFirstLine}>{hymn?.first_line}</Text>
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Language selector */}
      {availableLanguages.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={[styles.langBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
          contentContainerStyle={styles.langList}
        >
          {availableLanguages.map(lang => (
            <TouchableOpacity
              key={lang}
              onPress={() => setActiveLanguage(lang)}
              style={[
                styles.langPill,
                {
                  backgroundColor: activeLanguage === lang ? Colors.primary : theme.surfaceAlt,
                  borderColor: activeLanguage === lang ? Colors.primary : theme.border,
                }
              ]}
            >
              <Text style={[
                styles.langPillText,
                { color: activeLanguage === lang ? '#fff' : theme.text }
              ]}>
                {LANGUAGE_NAMES[lang] || lang}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['lyrics', 'music', 'index'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Ionicons
              name={tab === 'lyrics' ? 'document-text-outline' : tab === 'music' ? 'musical-note-outline' : 'git-compare-outline'}
              size={16}
              color={activeTab === tab ? Colors.primary : theme.textSec}
            />
            <Text style={[styles.tabText, { color: activeTab === tab ? Colors.primary : theme.textSec },
              activeTab === tab && styles.tabTextActive]}>
              {tab === 'lyrics' ? 'Lyrics' : tab === 'music' ? 'Music' : 'All Editions'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* LYRICS TAB */}
        {activeTab === 'lyrics' && (
          <View style={styles.lyricsContainer}>
            {verses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={40} color={theme.textSec} />
                <Text style={[styles.emptyText, { color: theme.textSec }]}>
                  Lyrics not yet loaded for this language.
                </Text>
                <Text style={[styles.emptySubText, { color: theme.textSec }]}>
                  Content is being added progressively.
                </Text>
              </View>
            ) : (
              verses.map((verse, idx) => (
                <React.Fragment key={verse.id}>
                  <View style={[styles.verseBlock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.verseLabel, { color: Colors.primary }]}>
                      {verse.verse_label || `Verse ${verse.verse_number}`}
                    </Text>
                    <Text style={[styles.verseText, { color: theme.text }]}>
                      {verse.lyrics_text}
                    </Text>
                  </View>
                  {/* Show chorus after each verse if present */}
                  {chorus && idx < verses.length - 1 && (
                    <View style={[styles.chorusBlock, { backgroundColor: theme.surfaceAlt, borderColor: Colors.accentLight }]}>
                      <Text style={[styles.verseLabel, { color: Colors.accent }]}>Chorus</Text>
                      <Text style={[styles.verseText, { color: theme.text, fontStyle: 'italic' }]}>
                        {chorus.lyrics_text}
                      </Text>
                    </View>
                  )}
                </React.Fragment>
              ))
            )}
            {/* Final chorus */}
            {chorus && verses.length > 0 && (
              <View style={[styles.chorusBlock, { backgroundColor: theme.surfaceAlt, borderColor: Colors.accentLight }]}>
                <Text style={[styles.verseLabel, { color: Colors.accent }]}>Chorus</Text>
                <Text style={[styles.verseText, { color: theme.text, fontStyle: 'italic' }]}>
                  {chorus.lyrics_text}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* MUSIC TAB */}
        {activeTab === 'music' && (
          <View style={styles.musicContainer}>
            {/* Audio player card */}
            <View style={[styles.audioCard, Shadows.sm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Audio Playback</Text>

              {/* Instrument selector */}
              <View style={styles.instrumentRow}>
                {['organ', 'piano', 'a cappella'].map(inst => (
                  <TouchableOpacity key={inst} style={[styles.instrumentBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Text style={[styles.instrumentText, { color: theme.text }]}>{inst}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Player controls */}
              <View style={styles.playerControls}>
                <TouchableOpacity style={styles.playerBtn}>
                  <Ionicons name="play-skip-back" size={20} color={theme.textSec} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: Colors.primary }]}
                  onPress={handlePlayPause}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playerBtn}>
                  <Ionicons name="play-skip-forward" size={20} color={theme.textSec} />
                </TouchableOpacity>
              </View>

              {/* Tempo slider row */}
              <View style={styles.tempoRow}>
                <Text style={[styles.tempoLabel, { color: theme.textSec }]}>Tempo</Text>
                <Text style={[styles.tempoValue, { color: theme.text }]}>90 bpm</Text>
                <TouchableOpacity style={[styles.transposeBtn, { borderColor: theme.border }]}>
                  <Ionicons name="musical-note" size={14} color={Colors.primary} />
                  <Text style={[styles.transposeText, { color: Colors.primary }]}>Transpose</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sheet music placeholder */}
            <View style={[styles.sheetMusicCard, Shadows.sm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sheet Music</Text>
              <View style={[styles.sheetMusicPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
                <Ionicons name="musical-notes-outline" size={40} color={theme.textSec} />
                <Text style={[styles.placeholderText, { color: theme.textSec }]}>
                  MusicXML notation renders here
                </Text>
                <Text style={[styles.placeholderSub, { color: theme.textSec }]}>
                  Powered by Verovio open-source renderer
                </Text>
                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: Colors.primary }]}>
                  <Ionicons name="download-outline" size={16} color="#fff" />
                  <Text style={styles.downloadBtnText}>Download sheet music</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ALL EDITIONS / CROSS-INDEX TAB */}
        {activeTab === 'index' && (
          <View style={styles.indexContainer}>
            <Text style={[styles.indexIntro, { color: theme.textSec }]}>
              This hymn appears in {crossIndex.length} edition{crossIndex.length !== 1 ? 's' : ''} across SDA hymnal history.
            </Text>
            {crossIndex.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.textSec }]}>
                  Only found in the current edition.
                </Text>
              </View>
            ) : (
              crossIndex.map(entry => (
                <View key={entry.code} style={[styles.indexRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.indexYear, { backgroundColor: EDITION_COLORS[entry.code] || Colors.primary }]}>
                    <Text style={styles.indexYearText}>{entry.year_published}</Text>
                  </View>
                  <View style={styles.indexInfo}>
                    <Text style={[styles.indexEditionTitle, { color: theme.text }]}>{entry.title}</Text>
                    <Text style={[styles.indexEditionSub, { color: theme.textSec }]}>
                      Hymn #{entry.hymnal_number}
                      {entry.title_in_edition !== entry.title ? ` · "${entry.title_in_edition}"` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textSec} />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add to worship set FAB */}
      <TouchableOpacity
        style={[styles.fab, Shadows.md]}
        onPress={() => navigation.navigate('AddToSet', { hymnId })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const EDITION_COLORS: Record<string, string> = {
  MILLENNIAL1849: '#6b4226', SDA1869: '#4a5568',
  CHRIST1908: '#744210', CHURCH1941: '#2d4a62', SDA1985: '#1a3a5c',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 20 : 12,
  },
  navTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.medium, color: '#fff', marginHorizontal: 12 },

  titleCard: { paddingHorizontal: Spacing.lg, paddingBottom: 16 },
  hymnTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: '#fff', marginBottom: 4 },
  hymnFirstLine: { fontSize: Typography.base, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.9)' },

  langBar: { borderBottomWidth: 0.5 },
  langList: { paddingHorizontal: Spacing.lg, paddingVertical: 8, gap: 6 },
  langPill: { borderRadius: BorderRadius.sm, borderWidth: 0.5, paddingHorizontal: 12, paddingVertical: 5, marginRight: 6 },
  langPillText: { fontSize: Typography.sm, fontWeight: Typography.medium },

  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: Typography.sm },
  tabTextActive: { fontWeight: Typography.medium },

  lyricsContainer: { padding: Spacing.lg, gap: 12 },
  verseBlock: { borderRadius: BorderRadius.md, borderWidth: 0.5, padding: Spacing.lg },
  chorusBlock: { borderRadius: BorderRadius.md, borderLeftWidth: 3, padding: Spacing.lg },
  verseLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  verseText: { fontSize: Typography.lg, lineHeight: Typography.lg * Typography.lyrics },

  musicContainer: { padding: Spacing.lg, gap: 16 },
  audioCard: { borderRadius: BorderRadius.lg, borderWidth: 0.5, padding: Spacing.lg },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.medium, marginBottom: 12 },
  instrumentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  instrumentBtn: { flex: 1, borderRadius: BorderRadius.sm, borderWidth: 0.5, paddingVertical: 7, alignItems: 'center' },
  instrumentText: { fontSize: Typography.sm },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  playerBtn: { padding: 8 },
  playButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  tempoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tempoLabel: { fontSize: Typography.sm },
  tempoValue: { fontSize: Typography.sm, fontWeight: Typography.medium, flex: 1 },
  transposeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 0.5, borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 5 },
  transposeText: { fontSize: Typography.sm },
  sheetMusicCard: { borderRadius: BorderRadius.lg, borderWidth: 0.5, padding: Spacing.lg },
  sheetMusicPlaceholder: { borderRadius: BorderRadius.md, padding: 32, alignItems: 'center', gap: 8 },
  placeholderText: { fontSize: Typography.base, fontWeight: Typography.medium, marginTop: 4 },
  placeholderSub: { fontSize: Typography.sm, textAlign: 'center' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: BorderRadius.sm, paddingHorizontal: 16, paddingVertical: 10, marginTop: 8 },
  downloadBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.medium },

  indexContainer: { padding: Spacing.lg, gap: 10 },
  indexIntro: { fontSize: Typography.sm, marginBottom: 4 },
  indexRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 0.5, padding: 12, gap: 12 },
  indexYear: { width: 52, height: 52, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  indexYearText: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#fff' },
  indexInfo: { flex: 1 },
  indexEditionTitle: { fontSize: Typography.base, fontWeight: Typography.medium, marginBottom: 2 },
  indexEditionSub: { fontSize: Typography.sm },

  emptyState: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: Typography.base, fontWeight: Typography.medium, textAlign: 'center' },
  emptySubText: { fontSize: Typography.sm, textAlign: 'center' },

  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
});
