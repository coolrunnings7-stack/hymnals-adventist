import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ScrollView
} from 'react-native';

const EDITIONS = [
  { code: 'MILLENNIAL1849', label: 'Millennial Harp', year: 1849, count: 120, color: '#6b4226' },
  { code: 'SDA1869', label: 'Hymns & Tunes', year: 1869, count: 308, color: '#4a5568' },
  { code: 'CHRIST1908', label: 'Christ in Song', year: 1908, count: 900, color: '#744210' },
  { code: 'CHURCH1941', label: 'Church Hymnal', year: 1941, count: 703, color: '#2d4a62' },
  { code: 'SDA1985', label: 'SDA Hymnal', year: 1985, count: 695, color: '#1a3a5c' },
];

const HYMNS = [
  { id: 1, num: 1, title: 'Praise to the Lord, the Almighty', line: 'Praise to the Lord, the Almighty, the King of creation', tags: ['praise', 'worship'], verses: 4, chorus: false },
  { id: 2, num: 2, title: 'Holy, Holy, Holy', line: 'Holy, holy, holy! Lord God Almighty', tags: ['worship', 'Trinity'], verses: 4, chorus: false },
  { id: 3, num: 3, title: 'A Mighty Fortress Is Our God', line: 'A mighty fortress is our God, a bulwark never failing', tags: ['faith', 'strength'], verses: 4, chorus: false },
  { id: 4, num: 4, title: 'Great Is Thy Faithfulness', line: 'Great is Thy faithfulness, O God my Father', tags: ['faithfulness', 'morning'], verses: 3, chorus: true },
  { id: 5, num: 5, title: 'How Great Thou Art', line: 'O Lord my God, when I in awesome wonder', tags: ['nature', 'praise'], verses: 4, chorus: true },
  { id: 6, num: 6, title: 'Nearer, My God, to Thee', line: 'Nearer, my God, to Thee, nearer to Thee', tags: ['prayer', 'devotion'], verses: 5, chorus: false },
  { id: 7, num: 7, title: 'What a Friend We Have in Jesus', line: 'What a friend we have in Jesus, all our sins and griefs to bear', tags: ['prayer', 'comfort'], verses: 3, chorus: false },
  { id: 8, num: 8, title: 'Blessed Assurance', line: 'Blessed assurance, Jesus is mine', tags: ['assurance', 'joy'], verses: 3, chorus: true },
  { id: 9, num: 9, title: 'Immortal, Invisible, God Only Wise', line: 'Immortal, invisible, God only wise', tags: ['worship', 'eternity'], verses: 4, chorus: false },
  { id: 10, num: 10, title: 'The Lord Is My Shepherd', line: 'The Lord is my Shepherd; no want shall I know', tags: ['trust', 'peace'], verses: 4, chorus: false },
  { id: 11, num: 11, title: 'Lead Me to Calvary', line: 'King of my life, I crown Thee now', tags: ['calvary', 'salvation'], verses: 4, chorus: true },
  { id: 12, num: 12, title: 'Day by Day', line: 'Day by day and with each passing moment', tags: ['daily', 'trust'], verses: 3, chorus: false },
];

const LYRICS = {
  1: [
    { label: 'Verse 1', chorus: false, text: 'Praise to the Lord, the Almighty, the King of creation!\nO my soul, praise Him, for He is thy health and salvation!\nAll ye who hear,\nNow to His temple draw near;\nJoin me in glad adoration.' },
    { label: 'Verse 2', chorus: false, text: 'Praise to the Lord, who over all things so wondrously reigneth,\nShielding thee under His wings, yea, so gently sustaineth!\nHast thou not seen\nHow all thou needest hath been\nGranted in what He ordaineth?' },
    { label: 'Verse 3', chorus: false, text: 'Praise to the Lord, who doth prosper thy work and defend thee;\nSurely His goodness and mercy shall ever attend thee.\nPonder anew\nWhat the Almighty can do,\nWho with His love doth befriend thee.' },
    { label: 'Verse 4', chorus: false, text: 'Praise to the Lord! O let all that is in me adore Him!\nAll that hath life and breath, come now with praises before Him!\nLet the Amen\nSound from His people again;\nGladly forever adore Him.' },
  ],
  4: [
    { label: 'Verse 1', chorus: false, text: 'Great is Thy faithfulness, O God my Father,\nThere is no shadow of turning with Thee;\nThou changest not, Thy compassions they fail not;\nAs Thou hast been Thou forever wilt be.' },
    { label: 'Chorus', chorus: true, text: 'Great is Thy faithfulness!\nGreat is Thy faithfulness!\nMorning by morning new mercies I see;\nAll I have needed Thy hand hath provided—\nGreat is Thy faithfulness, Lord, unto me!' },
    { label: 'Verse 2', chorus: false, text: 'Summer and winter, and springtime and harvest,\nSun, moon, and stars in their courses above\nJoin with all nature in manifold witness\nTo Thy great faithfulness, mercy, and love.' },
    { label: 'Verse 3', chorus: false, text: 'Pardon for sin and a peace that endureth,\nThine own dear presence to cheer and to guide;\nStrength for today and bright hope for tomorrow,\nBlessings all mine, with ten thousand beside!' },
  ],
  5: [
    { label: 'Verse 1', chorus: false, text: 'O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made,\nI see the stars, I hear the rolling thunder,\nThy power throughout the universe displayed.' },
    { label: 'Chorus', chorus: true, text: 'Then sings my soul, my Saviour God, to Thee:\nHow great Thou art, how great Thou art!\nThen sings my soul, my Saviour God, to Thee:\nHow great Thou art, how great Thou art!' },
    { label: 'Verse 2', chorus: false, text: 'When through the woods and forest glades I wander\nAnd hear the birds sing sweetly in the trees,\nWhen I look down from lofty mountain grandeur\nAnd hear the brook and feel the gentle breeze.' },
  ],
};

export default function App() {
  const [selectedEdition, setSelectedEdition] = useState('SDA1985');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [currentHymn, setCurrentHymn] = useState(null);
  const [activeTab, setActiveTab] = useState('lyrics');

  const filteredHymns = HYMNS.filter(h => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.title.toLowerCase().includes(q) ||
      h.line.toLowerCase().includes(q) ||
      h.tags.some(t => t.includes(q));
  });

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (currentHymn) {
    return (
      <DetailScreen
        hymn={currentHymn}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        onBack={() => { setCurrentHymn(null); setActiveTab('lyrics'); }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    );
  }

  const currentEdition = EDITIONS.find(e => e.code === selectedEdition);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3a5c" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Hymnals of the</Text>
            <Text style={styles.headerSubtitle}>Adventist Movement</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search title, first line, topic..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.editionBar} contentContainerStyle={styles.editionList}>
        {EDITIONS.map(e => {
          const isActive = e.code === selectedEdition;
          return (
            <TouchableOpacity key={e.code} onPress={() => setSelectedEdition(e.code)}
              style={[styles.pill, { backgroundColor: isActive ? e.color : '#f0ede4', borderColor: isActive ? e.color : '#d8d0c0' }]}>
              <Text style={[styles.pillYear, { color: isActive ? 'rgba(255,255,255,0.7)' : '#9a9a9a' }]}>{e.year}</Text>
              <Text style={[styles.pillTitle, { color: isActive ? '#fff' : '#3a3a3a' }]}>{e.label}</Text>
              <Text style={[styles.pillCount, { color: isActive ? 'rgba(255,255,255,0.6)' : '#9a9a9a' }]}>{e.count} hymns</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {searchQuery ? `${filteredHymns.length} results for "${searchQuery}"` : `${currentEdition?.title} · ${currentEdition?.year} · ${currentEdition?.count} hymns`}
        </Text>
      </View>
      <FlatList
        data={filteredHymns}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#ede8de', marginLeft: 62 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.hymnRow} onPress={() => setCurrentHymn(item)} activeOpacity={0.7}>
            <View style={styles.hymnNum}>
              <Text style={styles.hymnNumText}>{item.num}</Text>
            </View>
            <View style={styles.hymnInfo}>
              <Text style={styles.hymnTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.hymnLine} numberOfLines={1}>{item.line}</Text>
              <View style={styles.tagRow}>
                {item.tags.slice(0, 2).map(tag => (
                  <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                ))}
                <Text style={styles.verseCount}>{item.verses}v{item.chorus ? ' + chorus' : ''}</Text>
              </View>
            </View>
            <View style={styles.hymnActions}>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Text style={{ fontSize: 20, color: favorites.has(item.id) ? '#c8922a' : '#ccc' }}>
                  {favorites.has(item.id) ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, color: '#ccc', marginTop: 6 }}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function DetailScreen({ hymn, favorites, toggleFavorite, onBack, activeTab, setActiveTab }) {
  const lyrics = LYRICS[hymn.id] || [{ label: 'Verse 1', chorus: false, text: hymn.line + '...' }];
  const isFav = favorites.has(hymn.id);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3a5c" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: '#fff', marginRight: 6 }}>‹</Text>
            <Text style={{ fontSize: 15, color: '#fff' }}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavorite(hymn.id)}>
            <Text style={{ fontSize: 22 }}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{hymn.title}</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{hymn.line}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
          {hymn.tags.map(tag => (
            <View key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.tabBar}>
        {[{ key: 'lyrics', label: '📄 Lyrics' }, { key: 'music', label: '🎵 Music' }, { key: 'index', label: '🔀 Editions' }].map(tab => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'lyrics' && lyrics.map((verse, idx) => (
          <View key={idx} style={verse.chorus ? styles.chorusBlock : styles.verseBlock}>
            <Text style={verse.chorus ? styles.chorusLabel : styles.verseLabel}>{verse.label}</Text>
            <Text style={styles.verseText}>{verse.text}</Text>
          </View>
        ))}
        {activeTab === 'music' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Audio Playback</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['Organ', 'Piano', 'A cappella'].map(inst => (
                <TouchableOpacity key={inst} style={styles.instrumentBtn}>
                  <Text style={styles.instrumentText}>{inst}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <Text style={{ fontSize: 28, color: '#9a9a9a' }}>⏮</Text>
              <View style={styles.playButton}><Text style={{ fontSize: 28, color: '#fff' }}>▶</Text></View>
              <Text style={{ fontSize: 28, color: '#9a9a9a' }}>⏭</Text>
            </View>
          </View>
        )}
        {activeTab === 'index' && (
          <View>
            <Text style={{ fontSize: 13, color: '#7a7060', marginBottom: 12 }}>
              This hymn appears across multiple SDA hymnal editions.
            </Text>
            {[{ year: 1941, edition: 'The Church Hymnal', num: 9, color: '#2d4a62' },
              { year: 1985, edition: 'SDA Hymnal', num: hymn.num, color: '#1a3a5c' }].map((entry, idx) => (
              <View key={idx} style={styles.indexRow}>
                <View style={[styles.indexYear, { backgroundColor: entry.color }]}>
                  <Text style={styles.indexYearText}>{entry.year}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.indexEdition}>{entry.edition}</Text>
                  <Text style={styles.indexNum}>Hymn #{entry.num}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f0' },
  header: { backgroundColor: '#1a3a5c', padding: 16, paddingTop: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: '#e8b04a' },
  searchBar: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  editionBar: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e8e0d0', maxHeight: 80 },
  editionList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  pill: { borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, minWidth: 80, alignItems: 'center' },
  pillYear: { fontSize: 10 },
  pillTitle: { fontSize: 12, fontWeight: '500' },
  pillCount: { fontSize: 10 },
  infoBar: { backgroundColor: '#f0ede4', paddingHorizontal: 14, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#e8e0d0' },
  infoText: { fontSize: 11, color: '#7a7060' },
  hymnRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  hymnNum: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#f0ede4', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  hymnNumText: { fontSize: 12, fontWeight: '500', color: '#7a7060' },
  hymnInfo: { flex: 1, marginRight: 8 },
  hymnTitle: { fontSize: 15, fontWeight: '500', color: '#1a1a1a', marginBottom: 2 },
  hymnLine: { fontSize: 12, color: '#7a7060', marginBottom: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tag: { backgroundColor: '#f0ede4', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  tagText: { fontSize: 10, color: '#7a7060' },
  verseCount: { fontSize: 10, color: '#9a9a9a', marginLeft: 3 },
  hymnActions: { alignItems: 'center', gap: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#e8e0d0' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1a3a5c' },
  tabText: { fontSize: 12, color: '#7a7060' },
  tabTextActive: { color: '#1a3a5c', fontWeight: '500' },
  verseBlock: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: '#e8e0d0', padding: 14, marginBottom: 10 },
  chorusBlock: { backgroundColor: '#fdf6eb', borderLeftWidth: 3, borderLeftColor: '#c8922a', borderRadius: 10, padding: 14, marginBottom: 10 },
  verseLabel: { fontSize: 10, fontWeight: '700', color: '#1a3a5c', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  chorusLabel: { fontSize: 10, fontWeight: '700', color: '#c8922a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  verseText: { fontSize: 16, lineHeight: 28, color: '#1a1a1a' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e0d0', padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '500', color: '#1a1a1a', marginBottom: 12 },
  instrumentBtn: { flex: 1, borderWidth: 0.5, borderColor: '#e8e0d0', borderRadius: 7, paddingVertical: 7, alignItems: 'center' },
  instrumentText: { fontSize: 12, color: '#3a3a3a' },
  playButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a3a5c', alignItems: 'center', justifyContent: 'center' },
  indexRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 0.5, borderColor: '#e8e0d0', padding: 12, marginBottom: 8, gap: 12 },
  indexYear: { width: 50, height: 50, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  indexYearText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  indexEdition: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  indexNum: { fontSize: 12, color: '#7a7060', marginTop: 2 },
});
