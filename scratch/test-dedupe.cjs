const fs = require('fs');
// Candidate pattern: collapse consecutive duplicate comma-separated segments.
const DUP = '(,\\s*([^,]+?))\\s*,\\s*\\2\\s*(?=,|$)';
const DUP_WHERE = ',\\s*([^,]+?)\\s*,\\s*\\1';
const rep = (s) => s.replace(new RegExp(DUP, 'gi'), '$1');
const samples = [
  '5-22/1, Main Road, Main Road, Munigadapa',
  'A, B, B, C, C, C, D',
  'H.No. 12-3/4, Station Road',
  'Road, road, Tiryani',
  'X, A, A, A, Y',
];
for (const s of samples) {
  const once = rep(s);
  const twice = rep(once);
  console.log(JSON.stringify(s), '=>', JSON.stringify(twice), '| where:', new RegExp(DUP_WHERE, 'i').test(s));
}
