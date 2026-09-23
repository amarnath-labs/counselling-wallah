const tests = [
  {
    name: "JoSAA",
    url:
      "http://localhost:4000/api/v1/recommendations" +
      "?examId=jee-main" +
      "&rank=30000" +
      "&category=OPEN" +
      "&year=2026" +
      "&round=1" +
      "&branchPreferences=CSE,IT" +
      "&annualBudget=1000000" +
      "&gender=Male" +
      "&homeState=Maharashtra" +
      "&locationMode=NONE" +
      "&limit=100",
  },

  {
    name: "CSAB",
    url:
      "http://localhost:4000/api/v1/recommendations" +
      "?examId=csab" +
      "&rank=30000" +
      "&category=OPEN" +
      "&year=2026" +
      "&round=1" +
      "&branchPreferences=CSE,IT" +
      "&annualBudget=1000000" +
      "&gender=Male" +
      "&homeState=Maharashtra" +
      "&locationMode=NONE" +
      "&limit=100",
  },

  {
    name: "Colleges",
    url:
      "http://localhost:4000/api/colleges",
  },
];


async function runBatch(
  test,
  concurrency,
  total
) {
  let next = 0;

  const times = [];
  let ok = 0;
  let failed = 0;


  async function worker() {

    while (true) {

      const current =
        next++;

      if (
        current >= total
      ) {
        return;
      }


      const started =
        performance.now();

      try {

        const response =
          await fetch(
            test.url
          );

        await response.arrayBuffer();

        const elapsed =
          performance.now() -
          started;

        times.push(
          elapsed
        );

        if (
          response.ok
        ) {
          ok++;
        } else {
          failed++;
        }

      } catch {

        times.push(
          performance.now() -
          started
        );

        failed++;
      }
    }
  }


  const started =
    performance.now();


  await Promise.all(
    Array.from(
      {
        length:
          concurrency,
      },
      () =>
        worker()
    )
  );


  const totalMs =
    performance.now() -
    started;


  times.sort(
    (a, b) =>
      a - b
  );


  const percentile =
    (p) => {
      const index =
        Math.min(
          times.length - 1,
          Math.floor(
            times.length *
            p
          )
        );

      return Math.round(
        times[index] || 0
      );
    };


  console.log(
    `\n${test.name}`
  );

  console.table([
    {
      concurrency,
      requests:
        total,
      ok,
      failed,

      p50_ms:
        percentile(
          0.50
        ),

      p95_ms:
        percentile(
          0.95
        ),

      p99_ms:
        percentile(
          0.99
        ),

      total_ms:
        Math.round(
          totalMs
        ),

      req_per_sec:
        Number(
          (
            total /
            (
              totalMs /
              1000
            )
          ).toFixed(
            2
          )
        ),
    },
  ]);
}


for (
  const concurrency of
  [
    10,
    25,
    50,
  ]
) {

  console.log(
    "\n=============================================="
  );

  console.log(
    `CONCURRENCY ${concurrency}`
  );

  console.log(
    "=============================================="
  );


  for (
    const test of
    tests
  ) {

    await runBatch(
      test,
      concurrency,
      100
    );
  }
}
