function bucket(rank, opening, closing) {

  if (rank <= opening) {
    return 'Backup';
  }

  const position =
    (rank - opening) /
    (closing - opening);

  if (position <= 0.60) {
    return 'Safe';
  }

  if (rank <= closing) {
    return 'Target';
  }

  return 'Dream';
}


/*
NIT Warangal screenshot
*/

const warangal =
  bucket(
    3000,
    1963,
    3178
  );


console.log(
  'NIT Warangal:',
  warangal
);


if (
  warangal !==
  'Target'
) {
  throw new Error(
    `Expected Target, got ${warangal}`
  );
}


/*
Earlier screenshot
*/

const longowal =
  bucket(
    100000,
    82452,
    126729
  );


console.log(
  '1,00,000 example:',
  longowal
);


if (
  longowal !==
  'Safe'
) {
  throw new Error(
    `Expected Safe, got ${longowal}`
  );
}


console.log('');
console.log('PASS: Both formula tests correct');
