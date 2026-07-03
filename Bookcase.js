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
  BURMESE:  { w: 54, h: 250 },
  CONCORDANCE: { w: 48, h: 236 },
  SBH:      { w: 52, h: 246 },
};

const PER_SHELF = 3;   // books per shelf

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
  const VW = 380;
  const screenW = Dimensions.get('window').width;
  const scale = screenW / VW;
  const gap = 6;

  // Filter to real books, then chunk into rows of PER_SHELF
  const items = ids.filter(id => CONFIG[id] && meta[id]).map(id => ({ id, ...CONFIG[id], m: meta[id] }));
  const rows = [];
  for (let i = 0; i < items.length; i += PER_SHELF) rows.push(items.slice(i, i + PER_SHELF));

  // Vertical layout: medallion area on top, then each shelf stacked.
  const TOP = 90;                 // space reserved for the medallion + top trim
  const SHELF_BOOK_AREA = 260;    // tallest book ~266; give each shelf room
  const LEDGE_H = 24;
  const SHELF_PITCH = SHELF_BOOK_AREA + LEDGE_H + 14;  // vertical distance between shelf baselines
  const VH = TOP + rows.length * SHELF_PITCH + 30;

  // Place books per row, centered, baseline at the row's ledge.
  const placed = [];
  rows.forEach((row, r) => {
    const baseY = TOP + (r + 1) * SHELF_PITCH - LEDGE_H - 8;  // baseline where books sit on the ledge
    const totalW = row.reduce((a, b) => a + b.w, 0) + gap * (row.length - 1);
    let cx = (VW - totalW) / 2;
    row.forEach(it => {
      placed.push({ ...it, x: cx, top: baseY - it.h, baseY, ledgeY: baseY + 2 });
      cx += it.w + gap;
    });
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

        {/* Outer cabinet frame spanning all shelves */}
        <Rect x="6" y={TOP - 10} width="368" height={VH - TOP - 6} fill="#1f130b" />
        <Rect x="6" y={TOP - 10} width="20" height={VH - TOP - 6} fill="#33210f" />
        <Rect x="354" y={TOP - 10} width="20" height={VH - TOP - 6} fill="#180e07" />
        <Rect x="6" y={TOP - 16} width="368" height="16" fill="#3c2716" />
        <Rect x="6" y={TOP - 16} width="368" height="3" fill="#67472a" />

        {/* Each shelf: wood back panel + the ledge the books rest on */}
        {rows.map((row, r) => {
          const baseY = TOP + (r + 1) * SHELF_PITCH - LEDGE_H - 8;
          const panelTop = baseY - SHELF_BOOK_AREA;
          return (
            <G key={'shelf-' + r}>
              <Rect x="26" y={panelTop} width="328" height={SHELF_BOOK_AREA} fill="url(#wood)" />
              <Ellipse cx="130" cy={panelTop + 18} rx="170" ry="40" fill="#ffffff" opacity={0.05} />
              {/* ledge */}
              <Rect x="14" y={baseY} width="352" height="24" fill="#48311e" />
              <Rect x="14" y={baseY} width="352" height="3" fill="#714c2c" />
              <Rect x="14" y={baseY + 21} width="352" height="3" fill="#180f08" />
            </G>
          );
        })}

        {/* Books */}
        {placed.map(b => {
          const m = b.m;
          const tcx = b.x + b.w / 2;
          return (
            <G key={b.id}>
              <Rect x={b.x} y={b.top} width={b.w} height={b.h} rx={3} fill={m.cover} />
              <Rect x={b.x} y={b.top} width={b.w} height={5} rx={3} fill={m.accent} />
              <Rect x={b.x} y={b.top} width={5} height={b.h} fill="#ffffff" opacity={0.15} />
              <Rect x={b.x + b.w - 8} y={b.top} width={8} height={b.h} fill="#000000" opacity={0.18} />
              {(() => {
                const titleStr = m.label.split(' \u00b7 ')[0];
                if (b.id === 'BURMESE') {
                  const cy = b.top + b.h * 0.42;
                  return (
                    <SvgText x={tcx} y={cy} fontSize={15} fontWeight="bold"
                      fontFamily="NotoSansMyanmar-Regular"
                      fill={m.ink} textAnchor="middle"
                      transform={`rotate(-90 ${tcx} ${cy})`}>{titleStr}</SvgText>
                  );
                }
                const chars = titleStr.toUpperCase().split('');
                const topY = b.top + b.h * 0.12;
                const bottomY = b.baseY - 26;
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
              {(() => {
                const yr = (m.label.split(' \u00b7 ')[1] || '').trim() || (m.mission ? 'B4L' : '');
                // shrink so the year fits inside the spine width (~5.2px per char at size 10)
                const yfs = Math.min(10, Math.max(6, (b.w - 8) / (Math.max(yr.length, 1) * 0.55)));
                return (
                  <SvgText x={tcx} y={b.baseY - 14} fontSize={yfs} fontFamily="Georgia" fill={m.ink} textAnchor="middle">{yr}</SvgText>
                );
              })()}
            </G>
          );
        })}

        {/* Bottles 4 Life medallion on top */}
        <Path d="M176 28 L204 28 L200 58 L180 58 Z" fill="#9a2f2f" />
        <Circle cx="190" cy="20" r="18" fill="#caa24a" />
        <Circle cx="190" cy="20" r="18" fill="none" stroke="#8a6c28" strokeWidth={1.5} />
        <Circle cx="190" cy="20" r="13" fill="#b8943f" />
        <SvgText x="190" y="74" fontSize={9} fontWeight="bold" fontFamily="Georgia" fill="#c9a24a" textAnchor="middle">BOTTLES 4 LIFE</SvgText>
      </Svg>

      <RNImage
        source={logo}
        resizeMode="contain"
        style={{ position: 'absolute', width: 26 * scale, height: 26 * scale, left: (190 - 13) * scale, top: (20 - 13) * scale }}
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
