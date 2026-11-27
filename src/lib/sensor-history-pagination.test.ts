import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type * as PaginationModule from './sensor-history-pagination';

let pagination: typeof PaginationModule;

before(async () => {
  const modulePath = './sensor-history-pagination.ts';
  pagination = (await import(modulePath)) as typeof PaginationModule;
});

describe('paginateItems', () => {
  it('returns empty slice and zero bounds when items array is empty', () => {
    const result = pagination.paginateItems([], 3, 25);

    assert.deepEqual(result.items, []);
    assert.equal(result.currentPage, 1);
    assert.equal(result.totalPages, 1);
    assert.equal(result.totalItems, 0);
    assert.equal(result.startIndex, 0);
    assert.equal(result.endIndex, 0);
  });

  it('slices the requested page and computes 1-based range indices', () => {
    const rows = Array.from({ length: 55 }, (_, index) => index + 1);
    const result = pagination.paginateItems(rows, 2, 25);

    assert.equal(result.currentPage, 2);
    assert.equal(result.totalPages, 3);
    assert.equal(result.totalItems, 55);
    assert.equal(result.startIndex, 26);
    assert.equal(result.endIndex, 50);
    assert.equal(result.items.length, 25);
    assert.equal(result.items[0], 26);
    assert.equal(result.items[24], 50);
  });

  it('clamps out-of-range page numbers to the last valid page', () => {
    const rows = Array.from({ length: 12 }, (_, index) => index + 1);
    const result = pagination.paginateItems(rows, 9, 10);

    assert.equal(result.currentPage, 2);
    assert.equal(result.totalPages, 2);
    assert.equal(result.startIndex, 11);
    assert.equal(result.endIndex, 12);
    assert.deepEqual(result.items, [11, 12]);
  });
});

describe('buildPaginationRange', () => {
  it('returns all page numbers when totalPages is at most 7', () => {
    assert.deepEqual(pagination.buildPaginationRange(1, 1), [1]);
    assert.deepEqual(pagination.buildPaginationRange(3, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(pagination.buildPaginationRange(4, 7), [1, 2, 3, 4, 5, 6, 7]);
  });

  it('includes trailing ellipsis near the start of a long range', () => {
    assert.deepEqual(pagination.buildPaginationRange(2, 12), [
      1,
      2,
      3,
      4,
      'ellipsis',
      12,
    ]);
  });

  it('includes both ellipses in the middle of a long range', () => {
    assert.deepEqual(pagination.buildPaginationRange(6, 12), [
      1,
      'ellipsis',
      5,
      6,
      7,
      'ellipsis',
      12,
    ]);
  });

  it('includes leading ellipsis near the end of a long range', () => {
    assert.deepEqual(pagination.buildPaginationRange(11, 12), [
      1,
      'ellipsis',
      9,
      10,
      11,
      12,
    ]);
  });
});

describe('payload formatting helpers', () => {
  it('formats objects as pretty-printed JSON and counts top-level keys', () => {
    const payload = { origin_type: 'sensor', temperature: 24.5, nested: { ok: true } };

    assert.equal(
      pagination.formatPayloadJson(payload),
      JSON.stringify(payload, null, 2)
    );
    assert.equal(pagination.formatPayloadCompact(payload), JSON.stringify(payload));
    assert.equal(pagination.getPayloadKeyCount(payload), 3);
  });

  it('handles nullish or non-object payloads safely', () => {
    assert.equal(pagination.formatPayloadJson(null), 'null');
    assert.equal(pagination.formatPayloadCompact(undefined), '{}');
    assert.equal(pagination.getPayloadKeyCount(null), 0);
    assert.equal(pagination.getPayloadKeyCount(['a', 'b']), 0);
  });
});
