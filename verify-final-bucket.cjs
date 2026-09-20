function classify(
  rank,
  opening,
  closing
) {

  if (
    rank <= opening
  ) {
    return 'Backup';
  }


  const position =
    (
      rank -
      opening
    ) /
    (
      closing -
      opening
    );


  if (
    position <= 0.60
  ) {
    return 'Safe';
  }


  if (
    rank <= closing
  ) {
    return 'Target';
  }


  return 'Dream';
}


const tests = [

  {
    name:
      'NIT Warangal',

    rank:
      3000,

    opening:
      1963,

    closing:
      3178,

    expected:
      'Target',
  },


  {
    name:
      '100000 example',

    rank:
      100000,

    opening:
      82452,

    closing:
      126729,

    expected:
      'Safe',
  },

];


for (
  const test of
  tests
) {

  const result =
    classify(
      test.rank,
      test.opening,
      test.closing
    );


  console.log(
    test.name,
    '=>',
    result
  );


  if (
    result !==
    test.expected
  ) {

    throw new Error(
      `${test.name}: expected ${test.expected}, got ${result}`
    );

  }

}


console.log(
  'PASS: formula verified'
);
