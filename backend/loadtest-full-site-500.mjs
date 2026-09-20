import autocannon from 'autocannon';

const target =
  process.env.TARGET ||
  'http://localhost:4000';

const routes = [
  '/api/health',
  '/api/exams',
  '/api/colleges',
  '/api/counselling/results?examId=uptac&rank=50000&category=OPEN&year=2025&round=1',
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
  console.log('\n===== MIXED 500 USER TEST =====');

  console.log({
    duration:
      result.duration,

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
});
