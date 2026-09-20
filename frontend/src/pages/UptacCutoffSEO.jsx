import {
  Link,
} from 'react-router-dom';


const ROUND_DATA = [
  {
    round: 'Round 1',
    records: 3853,
  },
  {
    round: 'Round 2',
    records: 2531,
  },
  {
    round: 'Round 3',
    records: 1674,
  },
  {
    round: 'Round 4',
    records: 932,
  },
  {
    round: 'Round 6',
    records: 996,
  },
  {
    round: 'Round 7',
    records: 818,
  },
];


const CATEGORY_DATA = [
  {
    category: 'OPEN',
    records: 6495,
  },
  {
    category: 'OBC',
    records: 1702,
  },
  {
    category: 'EWS',
    records: 1386,
  },
  {
    category: 'SC',
    records: 1045,
  },
  {
    category: 'ST',
    records: 176,
  },
];


export default function UptacCutoffSEO() {
  return (
    <main
      style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '48px 20px 80px',
        lineHeight: 1.75,
      }}
    >
      <section
        style={{
          maxWidth: '850px',
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            color: '#f97316',
            fontWeight: 800,
          }}
        >
          UPTAC Admission Data
        </p>

        <h1
          style={{
            margin: 0,
            color: '#172554',
            fontSize:
              'clamp(34px, 6vw, 54px)',
            lineHeight: 1.1,
          }}
        >
          UPTAC Cutoff 2025
        </h1>

        <p
          style={{
            marginTop: '20px',
            color: '#475569',
            fontSize: '18px',
          }}
        >
          Explore historical UPTAC 2025
          opening and closing rank data by
          counselling round and category.
          TruMarg's imported dataset contains
          10,804 historical cutoff records.
        </p>

        <Link
          to="/uptac-college-predictor"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            marginTop: '16px',
          }}
        >
          Use UPTAC College Predictor
        </Link>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          UPTAC 2025 Cutoff Data Overview
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginTop: '24px',
          }}
        >
          <article
            style={{
              border:
                '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '22px',
            }}
          >
            <strong
              style={{
                display: 'block',
                fontSize: '30px',
                color: '#172554',
              }}
            >
              10,804
            </strong>

            Historical cutoff records
          </article>

          <article
            style={{
              border:
                '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '22px',
            }}
          >
            <strong
              style={{
                display: 'block',
                fontSize: '30px',
                color: '#172554',
              }}
            >
              6
            </strong>

            Counselling rounds represented
          </article>

          <article
            style={{
              border:
                '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '22px',
            }}
          >
            <strong
              style={{
                display: 'block',
                fontSize: '30px',
                color: '#172554',
              }}
            >
              5
            </strong>

            Main category groups
          </article>
        </div>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          UPTAC Cutoff 2025 by Counselling Round
        </h2>

        <p>
          The imported historical dataset
          contains cutoff records from the
          following UPTAC counselling rounds.
        </p>

        <div
          style={{
            overflowX: 'auto',
            marginTop: '22px',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '460px',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderBottom:
                      '2px solid #e2e8f0',
                  }}
                >
                  Counselling Round
                </th>

                <th
                  style={{
                    textAlign: 'right',
                    padding: '12px',
                    borderBottom:
                      '2px solid #e2e8f0',
                  }}
                >
                  Cutoff Records
                </th>
              </tr>
            </thead>

            <tbody>
              {ROUND_DATA.map(
                item => (
                  <tr
                    key={
                      item.round
                    }
                  >
                    <td
                      style={{
                        padding:
                          '12px',
                        borderBottom:
                          '1px solid #e2e8f0',
                      }}
                    >
                      {item.round}
                    </td>

                    <td
                      style={{
                        padding:
                          '12px',
                        textAlign:
                          'right',
                        borderBottom:
                          '1px solid #e2e8f0',
                      }}
                    >
                      {item.records.toLocaleString(
                        'en-IN'
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          UPTAC Cutoff 2025 by Category
        </h2>

        <div
          style={{
            overflowX: 'auto',
            marginTop: '22px',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '460px',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    borderBottom:
                      '2px solid #e2e8f0',
                  }}
                >
                  Category
                </th>

                <th
                  style={{
                    textAlign: 'right',
                    padding: '12px',
                    borderBottom:
                      '2px solid #e2e8f0',
                  }}
                >
                  Cutoff Records
                </th>
              </tr>
            </thead>

            <tbody>
              {CATEGORY_DATA.map(
                item => (
                  <tr
                    key={
                      item.category
                    }
                  >
                    <td
                      style={{
                        padding:
                          '12px',
                        borderBottom:
                          '1px solid #e2e8f0',
                      }}
                    >
                      {item.category}
                    </td>

                    <td
                      style={{
                        padding:
                          '12px',
                        textAlign:
                          'right',
                        borderBottom:
                          '1px solid #e2e8f0',
                      }}
                    >
                      {item.records.toLocaleString(
                        'en-IN'
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          How to Read UPTAC Opening and Closing Ranks
        </h2>

        <p>
          The opening rank represents the
          rank near which admission to a
          particular college, branch and seat
          category began in the historical
          counselling data. The closing rank
          represents the later rank boundary
          recorded for that option.
        </p>

        <p>
          Cutoffs differ by college, branch,
          category, quota, gender and
          counselling round. A previous-year
          closing rank should therefore be
          treated as historical guidance,
          not as a guaranteed future cutoff.
        </p>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          Why UPTAC Cutoffs Change Between Rounds
        </h2>

        <p>
          Cutoff ranks may move between
          counselling rounds because students
          upgrade or leave seats, preferences
          change, vacancies become available
          and seat allocation progresses.
        </p>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          Use Cutoff Data with the UPTAC College Predictor
        </h2>

        <p>
          Instead of checking thousands of
          historical cutoff rows manually,
          students can enter their admission
          details in the TruMarg UPTAC College
          Predictor and explore relevant
          college and branch possibilities.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
            marginTop: '20px',
          }}
        >
          <Link
            to="/uptac-college-predictor"
            className="btn btn-primary"
          >
            UPTAC College Predictor 2026
          </Link>

          <Link
            to="/college-counselling"
            className="btn"
          >
            College Counselling Guide
          </Link>

          <Link
            to="/college-predictor"
            className="btn"
          >
            All College Predictors
          </Link>
        </div>
      </section>


      <section
        style={{
          marginTop: '60px',
        }}
      >
        <h2>
          Frequently Asked Questions
        </h2>

        <h3>
          Which year's UPTAC cutoff data is shown?
        </h3>

        <p>
          This page currently summarizes
          historical UPTAC 2025 counselling
          cutoff data used by TruMarg.
        </p>

        <h3>
          Does a previous UPTAC closing rank guarantee admission?
        </h3>

        <p>
          No. Historical cutoffs are useful
          for planning, but actual future
          admission depends on counselling
          rules, seat availability, applicant
          demand and preference movement.
        </p>

        <h3>
          Can I use these cutoffs to predict colleges?
        </h3>

        <p>
          Yes. TruMarg's UPTAC College
          Predictor uses historical admission
          information together with the
          student's profile to organize
          relevant college and branch options.
        </p>
      </section>
    </main>
  );
}