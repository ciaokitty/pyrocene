import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SENSOR_TYPES,
  MAX_DAY,
  createNetwork,
  advanceNetwork,
  getReports,
  worldAtDay,
  exportPacket,
  importPacket,
  poolPackets,
} from './living-landscape.mjs';
import { WORLD, ACTIVE } from './world.mjs';

function atDay(type, name, day) {
  let state = createNetwork(type, name);
  while (state.day < day) state = advanceNetwork(state);
  return state;
}

test('creates all three authored networks with visible day-zero reports', () => {
  for (const type of SENSOR_TYPES) {
    const state = createNetwork(type, `${type} team`);
    assert.equal(state.day, 0);
    assert.equal(state.chosenDay, 0);
    assert.equal(getReports(state).length, 3);
    for (const report of getReports(state)) {
      assert.equal(report.day, 0);
      assert.ok(ACTIVE.some((cell) => cell.id === report.cellId));
      assert.equal(typeof report.title, 'string');
      assert.ok(Array.isArray(report.series));
      assert.match(report.source, /^https?:\/\//);
    }
  }
});

test('advancement is finite, chronological, and deterministic', () => {
  const first = atDay('acoustic', 'North grant', MAX_DAY);
  const second = atDay('acoustic', 'North grant', MAX_DAY);
  assert.deepEqual(first, second);
  assert.equal(first.day, MAX_DAY);
  assert.equal(first.reports.length, 12);
  assert.equal(getReports({ ...first, chosenDay: 0 }).length, 3);
  assert.deepEqual(advanceNetwork(first), first);
  assert.deepEqual(first.actors.map((actor) => actor.sites.length), [4, 4, 4]);
});

test('world evolution annotates scenario gaps while preserving measured geometry fields', () => {
  const day0 = worldAtDay(0);
  const day3 = worldAtDay(3);
  assert.equal(day0.length, WORLD.length);
  assert.deepEqual(day3.map((cell) => cell.id), WORLD.map((cell) => cell.id));
  assert.deepEqual(day3.map((cell) => cell.active), WORLD.map((cell) => cell.active));
  assert.deepEqual(day3.map((cell) => cell.pointCount), WORLD.map((cell) => cell.pointCount));
  assert.ok(day3.filter((cell) => cell.canopyGap).length >= day0.filter((cell) => cell.canopyGap).length + 2);
  assert.ok(day3.some((cell) => cell.scenarioDisturbance));
  assert.ok(day3.every((cell) => cell.geometryPreserved && cell.geometryNote));
  assert.ok(day3.some((cell) => cell.baseDisturbance === cell.disturbance));
});

test('packets carry validated-not-truth provenance and reject tampering', () => {
  const packet = exportPacket(atDay('environment', 'Field grant', 2));
  assert.equal(packet.provenance.validatedNotTruth, true);
  assert.equal(importPacket(JSON.stringify(packet)).packetId, packet.packetId);
  const tampered = JSON.parse(JSON.stringify(packet));
  tampered.reports[0].series[0].value += 1;
  assert.throws(() => importPacket(tampered), /integrity check failed/);
  const badSource = JSON.parse(JSON.stringify(packet));
  badSource.reports[0].source = `https://${'x'.repeat(600)}`;
  assert.throws(() => importPacket(badSource), /report source/);
});

test('pooling deduplicates exact accounts, retains conflicts, and gates attribution by channel', () => {
  const acoustic = exportPacket(createNetwork('acoustic', 'Acoustic grant'));
  const camera = exportPacket(createNetwork('camera', 'Camera grant'));
  const pooled = poolPackets([acoustic, acoustic, camera]);
  assert.equal(pooled.reports.length, 6);
  assert.equal(pooled.conflicts.length, 0);
  const sharedCell = pooled.attribution['3:0'];
  assert.deepEqual(sharedCell.channels, ['acoustic', 'camera']);
  assert.equal(sharedCell.eligible, true);

  const alteredState = createNetwork('acoustic', 'Second acoustic grant');
  alteredState.reports[0].summary = 'A different authored account recorded a different pattern.';
  const altered = exportPacket(alteredState);
  const conflictPool = poolPackets([acoustic, altered]);
  assert.ok(conflictPool.conflicts.length >= 1);
  assert.ok(conflictPool.reports.some((report) => report.conflict));
  assert.equal(conflictPool.attribution['3:0'].eligible, false);
});

test('sensor trends are linked to current-day scenario signals', () => {
  const acoustic = atDay('acoustic', 'Trend grant', MAX_DAY);
  const camera = atDay('camera', 'Trend grant', MAX_DAY);
  const acousticDay0 = getReports({ ...acoustic, chosenDay: 0 }).find((report) => report.cellId === 3);
  const acousticDay2 = getReports({ ...acoustic, chosenDay: 2 }).find((report) => report.cellId === 3);
  assert.equal(acousticDay0.series[0].value, 0);
  assert.equal(acousticDay2.series[0].value, 1);
  assert.equal(acousticDay2.workContext.nearestSiteCell, 3);

  const cameraDay0 = getReports({ ...camera, chosenDay: 0 });
  const cameraDay2 = getReports({ ...camera, chosenDay: 2 });
  assert.ok(cameraDay2.find((report) => report.cellId === 3).camera.detections < cameraDay0.find((report) => report.cellId === 3).camera.detections);
  assert.ok(cameraDay2.every((report) => report.camera.effort === 12));
  assert.ok(cameraDay2.find((report) => report.cellId === 29).camera.detections > cameraDay0.find((report) => report.cellId === 29).camera.detections);
});
