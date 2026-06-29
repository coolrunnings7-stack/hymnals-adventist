import React from 'react';
import { Dimensions, View, Image as RNImage, TouchableOpacity } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, G, Circle, Ellipse, Path, Text as SvgText } from 'react-native-svg';

const CONFIG = {
  SDAH1985: { w: 52, h: 244 },
  CH1941:   { w: 50, h: 232 },
  CIS1908:  { w: 66, h: 240 },
  HT1886:   { w: 48, h: 266 },
  MH1854:   { w: 50, h: 252 },
  MISSION:  { w: 46, h: 224 },
};

function twoLines(name) {
  const words = name.split(' ');
  if (words.length === 1) return [name, ''];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
function fitFont(lines, boxW) {
  const longest = Math.max(...lines.map(s => s.length), 1);
  const size = Math.min(11, Math.max(7, Math.floor((boxW - 4) / (longest * 0.58))));
  return size;
}

export default function Bookcase({ ids, meta, logo, onOpen }) {
  const VW = 380, VH = 430;
  const screenW = Dimensions.get('window').width;
  const scale = screenW / VW;
  const baseY = 384;
  const gap = 2;

  const items = ids.filter(id => CONFIG[id] && meta[id]).map(id => ({ id, ...CONFIG[id], m: meta[id] }));
  const totalW = items.reduce((a, b) => a + b.w, 0) + gap * (items.length - 1);
  let cx = (VW - totalW) / 2;
  const placed = items.map(it => {
    const o = { ...it, x: cx, top: baseY - it.h };
    cx += it.w + gap;
    return o;
  });

  return (
    <View style={{ width: screenW, height: VH * scale }}>
      <Svg width={screenW} height={VH * scale} viewBox={`0 0 ${VW} ${VH}`}>
        <Defs>
          <LinearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4e3726" />
            <Stop offset="1" stopColor="#281a10" />
          </LinearGradient>
        </Defs>

        <Ellipse cx="190" cy="410" rx="172" ry="9" fill="#000000" opacity={0.22} />

        <Rect x="6" y="80" width="368" height="312" fill="#1f130b" />
        <Rect x="6" y="80" width="20" height="312" fill="#33210f" />
        <Rect x="354" y="80" width="20" height="312" fill="#180e07" />
        <Rect x="6" y="74" width="368" height="16" fill="#3c2716" />
        <Rect x="6" y="74" width="368" height="3" fill="#67472a" />
        <Rect x="26" y="92" width="328" height="288" fill="url(#wood)" />
        <Ellipse cx="130" cy="110" rx="170" ry="60" fill="#ffffff" opacity={0.05} />

        {placed.map(b => {
          const m = b.m;
          const frame = m.mission ? '#c9a24a' : (b.id === 'SDAH1985' ? '#6b531c' : '#b9974a');
          const [l1, l2] = twoLines(m.label.split(' \u00b7 ')[0]);
          const year = (m.label.split(' \u00b7 ')[1] || '').trim();
          const tcx = b.x + b.w / 2;
          const ty = b.top + b.h * 0.30;
          return (
            <G key={b.id}>
              <Rect x={b.x} y={b.top} width={b.w} height={b.h} rx={3} fill={m.cover} />
              <Rect x={b.x} y={b.top} width={b.w} height={5} rx={3} fill={m.accent} />
              <Rect x={b.x} y={b.top} width={5} height={b.h} fill="#ffffff" opacity={0.15} />
              <Rect x={b.x + b.w - 8} y={b.top} width={8} height={b.h} fill="#000000" opacity={0.18} />
              {(() => {
                const titleStr = m.label.split(' \u00b7 ')[0].toUpperCase();
                const chars = titleStr.split('');
                const topY = b.top + b.h * 0.12;
                const bottomY = baseY - 26;
                const avail = bottomY - topY;
                const step = Math.min(20, avail / chars.length);
                const fs = Math.min(15, Math.max(8, step * 0.9));
                return chars.map((ch, i) => (
                  ch === ' '
                    ? null
                    : <SvgText key={i} x={tcx} y={topY + i * step + fs * 0.85}
                        fontSize={fs} fontWeight="bold" fontFamily="Georgia"
                        fill={m.ink} textAnchor="middle">{ch}</SvgText>
                ));
              })()}
              <SvgText x={tcx} y={baseY - 14} fontSize={10} fontFamily="Georgia" fill={m.ink} textAnchor="middle">{year || (m.mission ? 'B4L' : '')}</SvgText>
            </G>
          );
        })}

        <Rect x="14" y="384" width="352" height="24" fill="#48311e" />
        <Rect x="14" y="384" width="352" height="3" fill="#714c2c" />
        <Rect x="14" y="405" width="352" height="3" fill="#180f08" />

        <Path d="M176 58 L204 58 L200 88 L180 88 Z" fill="#9a2f2f" />
        <Circle cx="190" cy="40" r="25" fill="#caa24a" />
        <Circle cx="190" cy="40" r="25" fill="none" stroke="#8a6c28" strokeWidth={1.5} />
        <Circle cx="190" cy="40" r="19" fill="#b8943f" />
        <SvgText x="190" y="76" fontSize={9} fontWeight="bold" fontFamily="Georgia" fill="#c9a24a" textAnchor="middle">BOTTLES 4 LIFE</SvgText>
      </Svg>

      <RNImage
        source={logo}
        resizeMode="contain"
        style={{ position: 'absolute', width: 34 * scale, height: 34 * scale, left: (190 - 17) * scale, top: (40 - 17) * scale }}
      />

      {placed.map(b => (
        <TouchableOpacity
          key={'tap-' + b.id}
          activeOpacity={0.6}
          onPress={() => onOpen(b.id)}
          style={{
            position: 'absolute',
            left: b.x * scale,
            top: b.top * scale,
            width: b.w * scale,
            height: b.h * scale,
          }}
        />
      ))}
    </View>
  );
}
