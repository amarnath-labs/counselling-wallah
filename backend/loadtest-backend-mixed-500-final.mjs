import autocannon from 'autocannon';

const target =
  process.env.TARGET ||
  'https://counsellingwallah-backend.onrender.com';

const routes = [
  '/api/health',
  '/api/exams',

  '/api/counselling/results?examId=uptac&rank=48001&category=OPEN&year=2025&round=Round%201',
  '/api/counselling/results?examId=uptac&rank=50001&category=OPEN&year=2025&round=Round%201',
  '/api/counselling/results?examId=uptac&rank=52001&category=OPEN&year=2025&round=Round%201',
  '/api/counselling/results?examId=uptac&rank=55001&category=OPEN&year=2025&round=Round%201',
];

const instance = autocannon({
  url: target,

  connections: 500,

  duration: 30,

  pipelining: 1,

  requests: routes.map((path) => ({
    method: 'GET',
    path,
  })),
});

autocannon.track(instance, {
  renderProgressBar: true,
  renderResultsTable: true,
});

instance.on('done', (result) => {
  console.log('\n===== TRUMARG BACKEND MIXED 500 TEST =====');

  console.log({
    duration: result.duration,

    totalRequests: result.requests.total,

    requestsAverage:
      result.requests.average,

    latencyAverage:
      result.latency.average,

    latencyP50:
      result.latency.p50,

    latencyP90:
      result.latency.p90,

    latencyP99:
      result.latency.p99,

    errors:
      result.errors,

    timeouts:
      result.timeouts,

    non2xx:
      result.non2xx,

    throughputAverage:
      result.throughput.average,
  });

  const passed =
    result.errors === 0 &&
    result.timeouts === 0 &&
    result.non2xx === 0;

  console.log(
    '\nRESULT:',
    passed
      ? 'PASS'
      : 'FAIL / NEEDS REVIEW'
  );
});
