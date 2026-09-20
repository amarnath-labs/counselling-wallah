import class12Questions from
  './src/data/careerQuestions/v7/class12Batch01.js';

const map = new Map();

for (const q of class12Questions) {
  const key =
    `${q.trait}::${q.scenario}`;

  if (!map.has(key)) {
    map.set(
      key,
      []
    );
  }

  map.get(key).push(
    q.id
  );
}

const duplicates =
  [...map.entries()]
    .filter(
      ([, ids]) =>
        ids.length > 1
    );

console.log(
  'Duplicate trait+scenario groups:',
  duplicates.length
);

for (
  const [
    key,
    ids,
  ] of duplicates
) {
  console.log(
    '\n',
    key
  );

  console.log(
    ids
  );
}
