import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';

import {
  useAppState,
} from '../hooks/useAppState';

import {
  BRANCH_LIST,
} from '../data/branches';

import {
  ALL_STATES,
} from '../data/states';

const states =
  ALL_STATES;

const FALLBACK_EXAMS = [
  {
    id: 'jee-main',
    name: 'JEE Main',
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
  },
  {
    id: 'mht-cet',
    name: 'MHT-CET',
  },
  {
    id: 'wbjee',
    name: 'WBJEE',
  },
  {
    id: 'cuet',
    name: 'CUET',
  },
];

export default function Home() {
  const {
    profile,
    setProfile,
    setSelectedExamId,
    selectedExamId,
    exams: examsFromState,
  } = useAppState();

  const nav =
    useNavigate();

  const p =
    profile || {};

  const exams =
    Array.isArray(examsFromState)
      ? examsFromState
      : FALLBACK_EXAMS;

  const selectedExam =
    exams.find(
      (exam) =>
        String(
          exam?.id || ''
        )
          .trim()
          .toLowerCase() ===
        String(
          selectedExamId || ''
        )
          .trim()
          .toLowerCase()
    );

  const currentExam =
    selectedExam?.name ||
    p.exam ||
    'JEE Main';

  const currentCategory =
    p.category ||
    'General';

  const currentHomeState =
    p.homeState ||
    states[0] ||
    '';

  const branches =
    Array.isArray(p.branches)
      ? p.branches
      : [];

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  | Home DOES NOT generate counselling results.
  | It only saves profile information and opens Profile.
  |--------------------------------------------------------------------------
  */

  const find = () => {
    const nextProfile = {
      ...p,
      exam: currentExam,
      examId: selectedExamId,
      branches,
      category: currentCategory,
      homeState: currentHomeState,
    };

    setProfile(
      nextProfile
    );

    console.log(
      '[HOME] Selected exam:',
      selectedExamId
    );

    console.log(
      '[HOME] Profile saved:',
      nextProfile
    );

    nav('/profile');
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">

          <div>
            <span className="eyebrow">
              🇮🇳 Made for Indian students &amp; parents
            </span>

            <h1>
              Apni Rank Batao.{' '}
              <span className="accent">
                Apna Best College
              </span>{' '}
              Jaano.
            </h1>

            <p className="lead">
              JEE, MHT-CET, WBJEE, CUET aur
              other entrance exams ke basis
              par apne liye best college aur
              branch options discover karein —
              sirf rank se, guesswork se nahi.
            </p>

            <div className="hero-actions">

              <Button
                onClick={() =>
                  nav('/exams')
                }
              >
                Find My Colleges →
              </Button>

              <Button
                variant="ghost"
                onClick={() =>
                  nav('/exams')
                }
              >
                Explore Colleges
              </Button>

            </div>

            <div className="hero-stats">

              <div>
                <b className="mono">
                  10
                </b>

                <span>
                  Exams supported
                </span>
              </div>

              <div>
                <b className="mono">
                  1,200+
                </b>

                <span>
                  College &amp; branch profiles
                </span>
              </div>

              <div>
                <b className="mono">
                  ₹0
                </b>

                <span>
                  To get started
                </span>
              </div>

            </div>

            <p
              style={{
                fontSize: 11,
                color: 'var(--ink-3)',
                marginTop: 18,
              }}
            >
              Sample figures shown for illustration{' '}
              <span className="demo-tag">
                DEMO DATA
              </span>
            </p>
          </div>

          <div className="rank-card">

            <h3>
              Find Colleges Based On Your Rank
            </h3>

            <div className="sub">
              2 minute ka form — turant results.
            </div>

            {/* EXAM */}

            <div className="field">

              <label>
                Select Exam
              </label>

              <select
                value={currentExam}
                onChange={(e) => {
                  const selectedExam =
                    exams.find(
                      (exam) =>
                        exam?.name ===
                        e.target.value
                    );

                  const examName =
                    String(
                      e.target.value || ''
                    )
                      .trim()
                      .toLowerCase();

                  let examId =
                    String(
                      selectedExam?.id || ''
                    )
                      .trim()
                      .toLowerCase();

                  if (
                    examName.includes('jee') &&
                    examName.includes('advanced')
                  ) {
                    examId =
                      'jee-advanced';
                  } else if (
                    examName.includes('jee') &&
                    examName.includes('main')
                  ) {
                    examId =
                      'jee-main';
                  }

                  console.log(
                    '[HOME] Exam selected:',
                    examId
                  );

                  setSelectedExamId(
                    examId
                  );

                  setProfile({
                    ...p,
                    exam:
                      e.target.value,
                    examId,
                    branches,
                  });
                }}
              >

                {exams
                  .slice(0, 5)
                  .map((exam) => (
                    <option
                      key={exam?.id}
                      value={exam?.name}
                    >
                      {exam?.name}
                    </option>
                  ))}

              </select>

            </div>

            {/* RANK + CATEGORY */}

            <div className="field-row">

              <div className="field">

                <label>
                  Rank / Percentile
                </label>

                <input
                  value={p.rank || ''}
                  onChange={(e) => {
                    const cleaned =
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 7);

                    setProfile({
                      ...p,
                      rank:
                        Number(cleaned) || 0,
                      branches,
                    });
                  }}
                  inputMode="numeric"
                  maxLength="7"
                  placeholder="e.g. 18452"
                />

              </div>

              <div className="field">

                <label>
                  Category
                </label>

                <select
                  value={currentCategory}
                  onChange={(e) => {
                    setProfile({
                      ...p,
                      category:
                        e.target.value,
                      branches,
                    });
                  }}
                >

                  {[
                    'General',
                    'EWS',
                    'OBC-NCL',
                    'SC',
                    'ST',
                  ].map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            {/* HOME STATE + BRANCH */}

            <div className="field-row">

              <div className="field">

                <label>
                  Home State
                </label>

                <select
                  value={currentHomeState}
                  onChange={(e) => {
                    setProfile({
                      ...p,
                      homeState:
                        e.target.value,
                      branches,
                    });
                  }}
                >

                  {states.map((state) => (
                    <option
                      key={state}
                      value={state}
                    >
                      {state}
                    </option>
                  ))}

                </select>

              </div>

              <div className="field">

                <label>
                  Preferred Branch
                </label>

                <select
                  value={
                    branches[0] ||
                    'Any'
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setProfile({
                      ...p,
                      branches:
                        value === 'Any'
                          ? BRANCH_LIST.slice(
                              0,
                              5
                            )
                          : [value],
                    });
                  }}
                >

                  {[
                    'CSE',
                    'IT',
                    'ECE',
                    'Mechanical',
                    'Civil',
                    'Any',
                  ].map((branch) => (
                    <option
                      key={branch}
                      value={branch}
                    >
                      {branch}
                    </option>
                  ))}

                </select>

              </div>

            </div>

            <Button
              variant="orange"
              block
              onClick={find}
            >
              Find My Colleges →
            </Button>

            <div className="free-note">
              Free basic results available.
            </div>

          </div>
        </div>
      </section>

      {/* WHY US */}

      <section className="section">

        <div className="container">

          <div className="section-head">

            <div className="kicker">
              Why Us
            </div>

            <h2>
              Why Students Choose TruMarg
            </h2>

          </div>

          <div className="grid-4">

            {[
              [
                '🎯',
                'Personalized',
                'Recommendations based on your actual rank, category and preferences.',
              ],
              [
                '📊',
                'Data Driven',
                'Historical cutoff, seat and admission data to help you decide with confidence.',
              ],
              [
                '🧭',
                'Complete Guidance',
                'From college discovery to choice filling and counselling deadlines.',
              ],
              [
                '❤️',
                'Student First',
                "Recommendations prioritize your needs — not paid promotions.",
              ],
            ].map(
              ([
                icon,
                title,
                description,
              ]) => (
                <div
                  className="card"
                  key={title}
                >
                  <div
                    className="icon-badge"
                    style={{
                      background:
                        'var(--blue-soft)',
                    }}
                  >
                    {icon}
                  </div>

                  <h4>
                    {title}
                  </h4>

                  <p>
                    {description}
                  </p>
                </div>
              )
            )}

          </div>

          <div className="trust-strip">
            "We help you choose. We don't
            choose based on who pays us."
          </div>

        </div>
      </section>

      {/* PROCESS */}

      <section
        className="section"
        style={{
          background: '#fff',
        }}
      >
        <div className="container">

          <div className="section-head">

            <div className="kicker">
              The Process
            </div>

            <h2>
              How It Works
            </h2>

          </div>

          <div className="steps">

            {[
              [
                'STEP 01',
                'Select Your Exam',
                'JEE Main, JEE Advanced, MHT-CET, WBJEE, CUET and more.',
              ],
              [
                'STEP 02',
                'Enter Your Rank',
                'Rank, percentile or score, along with category and preferences.',
              ],
              [
                'STEP 03',
                'Discover Your Options',
                'Personalized colleges sorted into Dream, Target, Safe and Backup.',
              ],
              [
                'STEP 04',
                'Make Your Decision',
                'Compare colleges, build your preference list and get counselling guidance.',
              ],
            ].map((step) => (
              <div
                className="step-card"
                key={step[0]}
              >
                <div className="step-num">
                  {step[0]}
                </div>

                <h4>
                  {step[1]}
                </h4>

                <p>
                  {step[2]}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* RESULT CATEGORIES */}

      <section className="section">

        <div className="container">

          <div className="section-head">

            <div className="kicker">
              Your Result Categories
            </div>

            <h2>
              Dream, Target, Safe &amp;
              Backup — explained
            </h2>

          </div>

          <div className="dtsb-row">

            {[
              [
                'dream',
                '🎯',
                'Dream',
                'High-value, competitive options — worth trying, admission not guaranteed.',
              ],
              [
                'target',
                '📌',
                'Target',
                'Realistic and strong options based on historical trends.',
              ],
              [
                'safe',
                '✅',
                'Safe',
                'Higher-probability options, comfortably within your rank range.',
              ],
              [
                'backup',
                '🛟',
                'Backup',
                'Extra options to keep in hand so you never miss admission.',
              ],
            ].map((item) => (
              <div
                className={`dtsb-chip ${item[0]}`}
                key={item[0]}
              >
                <b>
                  {item[1]} {item[2]}
                </b>

                <span>
                  {item[3]}
                </span>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* PRICING */}

      <section
        className="section"
        style={{
          background: '#fff',
        }}
      >
        <div className="container">

          <div className="section-head">

            <div className="kicker">
              TruMarg Pro
            </div>

            <h2>
              Simple, honest pricing
            </h2>

          </div>

          <div className="grid-3">

            <Price
              name="FREE"
              amount="₹0"
              items={[
                'Basic college search',
                'Limited results',
                'Basic college information',
              ]}
              button="Start Free"
              to="/exams"
            />

            <Price
              pop
              name="COLLEGE FINDER"
              amount="₹99"
              items={[
                'Full personalized college list',
                'Advanced filters',
                'Dream/Target/Safe/Backup classification',
                'College comparison',
                'Preference-list builder',
              ]}
              button="Unlock College Finder"
              to="/pricing"
            />

            <Price
              name="COUNSELLING SUPPORT"
              amount="₹249–₹299"
              items={[
                'Personalized counselling guidance',
                'Choice-list review',
                'Deadline reminders',
                'Document guidance',
                'Support chat',
              ]}
              button="View Details"
              to="/pricing"
              primary
            />

          </div>
        </div>
      </section>

      {/* FAQ */}

      <section className="section">

        <div className="container">

          <div className="section-head">

            <div className="kicker">
              Questions
            </div>

            <h2>
              Frequently asked
            </h2>

          </div>

          <div className="grid-3">

            {[
              [
                'Is this affiliated with JoSAA or NTA?',
                'No. TruMarg is an independent guidance platform, not affiliated with any government counselling authority.',
              ],
              [
                'Are results guaranteed?',
                'No. We show historical, estimate-based possibilities — final admission depends on official counselling rules and seat availability.',
              ],
              [
                'Is basic search free?',
                'Yes — basic college search and limited results are always free.',
              ],
              [
                'What about CSAB special rounds?',
                'CSAB fills seats left vacant after JoSAA regular rounds. This tool does not yet include CSAB-specific figures; verify directly on the official portal.',
              ],
              [
                'Where does the cutoff data come from?',
                'Closing ranks are sourced where marked; unmarked branches use trend-based estimates. Fee and placement figures remain illustrative.',
              ],
            ].map(
              ([
                question,
                answer,
              ]) => (
                <div
                  className="card"
                  key={question}
                >
                  <h4
                    style={{
                      fontSize: 14,
                    }}
                  >
                    {question}
                  </h4>

                  <p
                    style={{
                      fontSize: 13,
                    }}
                  >
                    {answer}
                  </p>
                </div>
              )
            )}

          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="section">

        <div
          className="container"
          style={{
            textAlign: 'center',
            background:
              'var(--navy)',
            borderRadius: 24,
            padding:
              '48px 20px',
          }}
        >

          <h2
            style={{
              color: '#fff',
            }}
          >
            Your Rank Deserves
            the Right Decision.
          </h2>

          <p
            style={{
              color:
                '#B9C4E8',
            }}
          >
            Don't let confusion decide
            your college.
          </p>

          <Button
            variant="orange"
            onClick={() =>
              nav('/exams')
            }
          >
            Find My College — Free
          </Button>

        </div>
      </section>
    </>
  );
}

/* ============================================================
   PRICE CARD
============================================================ */

function Price({
  name,
  amount,
  items,
  button,
  to,
  pop,
  primary,
}) {
  return (
    <div
      className={
        `price-card ${
          pop
            ? 'pop'
            : ''
        }`
      }
    >

      {pop && (
        <span className="pop-tag">
          MOST USED
        </span>
      )}

      <b
        style={{
          color:
            'var(--ink-3)',
          fontSize: 13,
        }}
      >
        {name}
      </b>

      <div className="amt">
        {amount}
      </div>

      <ul>

        {items.map(
          (item) => (
            <li
              key={item}
            >
              {item}
            </li>
          )
        )}

      </ul>

      <Link
        className={
          `btn ${
            primary
              ? 'btn-primary'
              : pop
              ? 'btn-orange'
              : 'btn-ghost'
          } btn-block`
        }
        to={to}
      >
        {button}
      </Link>

    </div>
  );
}