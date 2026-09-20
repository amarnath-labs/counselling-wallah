import autocannon from 'autocannon';

let counter = 0;

const ranks = [
  10000,
  20000,
  30000,
  40000,
  50000,
  60000,
  75000,
  100000,
  150000,
  200000
];

const instance = autocannon({
  url: 'http://localhost:4000',
  connections: 500,
  duration: 120,

  headers: {
    'Accept-Encoding': 'gzip'
  },

  requests: [
    {
      method: 'GET',

      setupRequest(req) {
        const rank =
          ranks[
            counter++ %
            ranks.length
          ];

        req.path =
          '/api/counselling/results' +
          '?examId=uptac' +
          `&rank=${rank}` +
          '&category=OPEN' +
          '&year=2025' +
          '&round=1';

        return req;
      }
    }
  ]
});

autocannon.track(
  instance,
  {
    renderProgressBar: true,
    renderResultsTable: true
  }
);

