// Hymnals of the Adventist Movement — v1.0.1
// Changes: persistent favorites (AsyncStorage) + audio playback foundation
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  SafeAreaView, View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { SDAH1985, EDITIONS, sectionFor } from './hymns_data';
import { AUDIO } from './audio_manifest';

const LYRICS = {
  1: ["Praise to the Lord, the Almighty, the King of creation!\nO my soul, praise Him, for He is thy health and salvation!\nAll ye who hear, now to His temple draw near;\nJoin me in glad adoration!",
      "Praise to the Lord, who o'er all things so wondrously reigneth,\nShelters thee under His wings, yea, so gently sustaineth!\nHast thou not seen how thy desires e'er have been\nGranted in what He ordaineth?"],
  73: ["Holy, holy, holy, Lord God Almighty!\nEarly in the morning our song shall rise to Thee;\nHoly, holy, holy, merciful and mighty!\nGod in three persons, blessed Trinity!",
       "Holy, holy, holy! all the saints adore Thee,\nCasting down their golden crowns around the glassy sea;\nCherubim and seraphim falling down before Thee,\nWhich wert, and art, and evermore shalt be."],
  108: ["Amazing grace! how sweet the sound,\nThat saved a wretch like me!\nI once was lost, but now am found,\nWas blind, but now I see.",
        "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed!"],
  287: ["Softly and tenderly Jesus is calling,\nCalling for you and for me;\nSee, on the portals He's waiting and watching,\nWatching for you and for me.",
        "Come home, come home,\nYe who are weary, come home;\nEarnestly, tenderly, Jesus is calling,\nCalling, O sinner, come home!"],
  313: ["Just as I am, without one plea,\nBut that Thy blood was shed for me,\nAnd that Thou bidd'st me come to Thee,\nO Lamb of God, I come! I come!",
        "Just as I am, and waiting not\nTo rid my soul of one dark blot,\nTo Thee whose blood can cleanse each spot,\nO Lamb of God, I come, I come!"],
  318: ["Lord Jesus, I long to be perfectly whole;\nI want Thee forever to live in my soul;\nBreak down every idol, cast out every foe;\nNow wash me, and I shall be whiter than snow.",
        "Whiter than snow, yes, whiter than snow;\nNow wash me, and I shall be whiter than snow."],
  330: ["Take my life and let it be\nConsecrated, Lord, to Thee;\nTake my moments and my days,\nLet them flow in ceaseless praise.",
        "Take my hands and let them move\nAt the impulse of Thy love;\nTake my feet and let them be\nSwift and beautiful for Thee."],
  462: ["Blessed assurance, Jesus is mine!\nO what a foretaste of glory divine!\nHeir of salvation, purchase of God,\nBorn of His Spirit, washed in His blood.",
        "This is my story, this is my song,\nPraising my Savior all the day long;\nThis is my story, this is my song,\nPraising my Savior all the day long."],
  499: ["What a friend we have in Jesus,\nAll our sins and griefs to bear!\nWhat a privilege to carry\nEverything to God in prayer!",
        "O what peace we often forfeit,\nO what needless pain we bear,\nAll because we do not carry\nEverything to God in prayer!"],
  530: ["When peace, like a river, attendeth my way,\nWhen sorrows like sea billows roll;\nWhatever my lot, Thou hast taught me to say,\nIt is well, it is well with my soul.",
        "It is well with my soul,\nIt is well, it is well with my soul."],
  590: ["When we walk with the Lord\nIn the light of His word,\nWhat a glory He sheds on our way!\nWhile we do His good will,\nHe abides with us still,\nAnd with all who will trust and obey.",
        "Trust and obey, for there's no other way\nTo be happy in Jesus, but to trust and obey."],
  633: ["Sing the wondrous love of Jesus,\nSing His mercy and His grace;\nIn the mansions bright and blessed\nHe'll prepare for us a place.",
        "When we all get to heaven,\nWhat a day of rejoicing that will be!\nWhen we all see Jesus,\nWe'll sing and shout the victory!"],
};

const NAVY = '#11283e';
const NAVY_LIGHT = '#1b3a58';
const GOLD = '#d4a84e';
const CREAM = '#f6f2e8';
const FAV_KEY = 'hymnals_favorites_v1';

export default function App() {
  const [edition, setEdition] = useState('SDAH1985');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState({});
  const [favsLoaded, setFavsLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('all');
  const soundRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // ---- Persistent favorites ----
  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY)
      .then(v => { if (v) setFavorites(JSON.parse(v)); })
      .catch(() => {})
      .finally(() => setFavsLoaded(true));
  }, []);

  const toggleFav = (n) => {
    setFavorites(f => {
      const nf = { ...f, [n]: !f[n] };
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(nf)).catch(() => {});
      return nf;
    });
  };

  // ---- Audio ----
  const stopSound = async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
    setPlaying(false);
  };

  const togglePlay = async (n) => {
    if (soundRef.current) {
      if (playing) { await soundRef.current.pauseAsync(); setPlaying(false); }
      else { await soundRef.current.playAsync(); setPlaying(true); }
      return;
    }
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(AUDIO[n]);
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(st => {
        if (st.didJustFinish) { setPlaying(false); sound.setPositionAsync(0); }
      });
      setPlaying(true);
      await sound.playAsync();
    } catch (e) { setPlaying(false); }
  };

  const openHymn = (h) => setSelected(h);
  const closeHymn = async () => { await stopSound(); setSelected(null); };

  const activeEdition = EDITIONS.find(e => e.id === edition);

  const data = useMemo(() => {
    if (edition !== 'SDAH1985') return [];
    let list = SDAH1985;
    if (tab === 'favorites') list = list.filter(h => favorites[h.n]);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    if (/^\d+$/.test(q)) return list.filter(h => String(h.n).startsWith(q));
    return list.filter(h => h.t.toLowerCase().includes(q));
  }, [edition, query, favorites, tab]);

  if (selected) {
    const lyr = LYRICS[selected.n];
    const hasAudio = !!AUDIO[selected.n];
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" />
        <View style={s.header}>
          <TouchableOpacity onPress={closeHymn}>
            <Text style={s.back}>‹ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFav(selected.n)}>
            <Text style={s.fav}>{favorites[selected.n] ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.detail}>
          <Text style={s.detailNum}>No. {selected.n}</Text>
          <Text style={s.detailTitle}>{selected.t}</Text>
          <Text style={s.detailSection}>{sectionFor(selected.n)}</Text>
          <Text style={s.detailEdition}>The Seventh-day Adventist Hymnal (1985)</Text>
          {hasAudio && (
            <TouchableOpacity style={s.playBtn} onPress={() => togglePlay(selected.n)}>
              <Text style={s.playBtnText}>{playing ? '❚❚  Pause' : '▶  Play'}</Text>
            </TouchableOpacity>
          )}
          <View style={s.rule} />
          {lyr ? (
            lyr.map((v, i) => <Text key={i} style={s.verse}>{v}</Text>)
          ) : (
            <View style={s.comingBox}>
              <Text style={s.comingTitle}>Full lyrics coming soon</Text>
              <Text style={s.comingText}>
                We're adding complete, carefully verified lyrics for every
                public-domain hymn in free updates — starting with the most
                loved hymns. Thank you for your patience and support!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <Text style={s.appTitle}>Hymnals of the Adventist Movement</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {EDITIONS.map(e => (
          <TouchableOpacity
            key={e.id}
            style={[s.pill, edition === e.id && s.pillActive]}
            onPress={() => setEdition(e.id)}>
            <Text style={[s.pillText, edition === e.id && s.pillTextActive]}>
              {e.name} {e.year ? `(${e.year})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {activeEdition.status === 'coming' ? (
        <View style={s.comingScreen}>
          <Text style={s.comingBig}>♪</Text>
          <Text style={s.comingTitle}>{activeEdition.name} ({activeEdition.year})</Text>
          <Text style={s.comingText}>
            The complete, verified index of this historic hymnal is being
            prepared and will arrive in a free update. We refuse to show
            inaccurate hymn lists — every number will be right.
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            style={s.search}
            placeholder="Search by number or title…"
            placeholderTextColor="#7e93a8"
            value={query}
            onChangeText={setQuery}
          />
          <View style={s.tabRow}>
            <TouchableOpacity onPress={() => setTab('all')}>
              <Text style={[s.tab, tab === 'all' && s.tabActive]}>All 695 Hymns</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('favorites')}>
              <Text style={[s.tab, tab === 'favorites' && s.tabActive]}>♥ Favorites</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={h => String(h.n)}
            initialNumToRender={25}
            renderItem={({ item, index }) => {
              const sec = sectionFor(item.n);
              const prevSec = index > 0 ? sectionFor(data[index - 1].n) : null;
              return (
                <View>
                  {sec !== prevSec && !query && tab === 'all' && (
                    <Text style={s.sectionHeader}>{sec}</Text>
                  )}
                  <TouchableOpacity style={s.row} onPress={() => openHymn(item)}>
                    <Text style={s.rowNum}>{item.n}</Text>
                    <Text style={s.rowTitle} numberOfLines={1}>{item.t}</Text>
                    <TouchableOpacity onPress={() => toggleFav(item.n)}>
                      <Text style={s.rowFav}>{favorites[item.n] ? '♥' : '♡'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={s.empty}>
                {tab === 'favorites'
                  ? 'No favorites yet — tap ♡ on any hymn.'
                  : 'No hymns match your search.'}
              </Text>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  appTitle: { color: GOLD, fontSize: 19, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  pillRow: { flexGrow: 0, paddingHorizontal: 10, marginBottom: 8 },
  pill: { backgroundColor: NAVY_LIGHT, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginRight: 8, borderWidth: 1, borderColor: '#2c4a68' },
  pillActive: { backgroundColor: GOLD, borderColor: GOLD },
  pillText: { color: '#b8c7d6', fontSize: 13 },
  pillTextActive: { color: NAVY, fontWeight: '700' },
  search: { backgroundColor: NAVY_LIGHT, color: CREAM, marginHorizontal: 14, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginBottom: 6 },
  tabRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 6 },
  tab: { color: '#7e93a8', fontSize: 14, paddingVertical: 4 },
  tabActive: { color: GOLD, fontWeight: '700' },
  sectionHeader: { color: GOLD, fontSize: 13, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#23415e' },
  rowNum: { color: GOLD, width: 44, fontSize: 15, fontWeight: '700' },
  rowTitle: { color: CREAM, flex: 1, fontSize: 15 },
  rowFav: { color: GOLD, fontSize: 18, paddingLeft: 10 },
  empty: { color: '#7e93a8', textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { color: GOLD, fontSize: 17 },
  fav: { color: GOLD, fontSize: 22 },
  detail: { paddingHorizontal: 22, paddingBottom: 40 },
  detailNum: { color: GOLD, fontSize: 15, fontWeight: '700', marginTop: 6 },
  detailTitle: { color: CREAM, fontSize: 24, fontWeight: '700', marginTop: 4 },
  detailSection: { color: '#9fb3c6', fontSize: 14, marginTop: 6, fontStyle: 'italic' },
  detailEdition: { color: '#7e93a8', fontSize: 12, marginTop: 2 },
  playBtn: { backgroundColor: GOLD, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22, marginTop: 14 },
  playBtnText: { color: NAVY, fontWeight: '700', fontSize: 15 },
  rule: { height: 2, backgroundColor: GOLD, opacity: 0.6, marginVertical: 16, width: 90 },
  verse: { color: CREAM, fontSize: 16, lineHeight: 25, marginBottom: 18 },
  comingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  comingBig: { color: GOLD, fontSize: 52, marginBottom: 10 },
  comingBox: { backgroundColor: NAVY_LIGHT, borderRadius: 12, padding: 18, marginTop: 6 },
  comingTitle: { color: GOLD, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  comingText: { color: '#c4d2de', fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
