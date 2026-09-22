import {
  useState,
} from 'react';

import {
  fetchCollegeReviewStandard100,
} from '../services/reviewStandard100Service';


const ASPECT_LABELS = {
  placements:
    'Placements',

  faculty:
    'Faculty',

  academics:
    'Academics',

  infrastructure:
    'Infrastructure',

  hostel:
    'Hostel',

  campus_life:
    'Campus Life',

  administration:
    'Administration',

  internships:
    'Internships',

  value_for_money:
    'Value for Money',

  location:
    'Location',
};


function number(
  value
) {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}


function percentText(
  value
) {
  const n =
    number(
      value
    );

  if (n === null) {
    return 'N/A';
  }

  return (
    n.toFixed(
      1
    ) +
    '%'
  );
}


function dateText(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date
    .toLocaleDateString(
      'en-IN',
      {
        year:
          'numeric',

        month:
          'short',

        day:
          'numeric',
      }
    );
}


function Metric({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding:
          '10px 12px',

        border:
          '1px solid #E2E8F0',

        borderRadius:
          12,

        background:
          '#FFFFFF',
      }}
    >
      <div
        style={{
          fontSize:
            10,

          color:
            '#64748B',

          marginBottom:
            4,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          color:
            '#0F172A',

          fontSize:
            14,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


export default function
ReviewStandard100Panel({
  collegeId,
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ''
    );

  const [
    data,
    setData,
  ] =
    useState(
      null
    );

  const [
    reviews,
    setReviews,
  ] =
    useState(
      []
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );


  async function load(
    requestedPage,
    append = false
  ) {
    if (!collegeId) {
      return;
    }

    setLoading(
      true
    );

    setError(
      ''
    );

    try {
      const result =
        await fetchCollegeReviewStandard100(
          collegeId,
          {
            page:
              requestedPage,

            limit:
              10,
          }
        );

      setData(
        result
      );

      setPage(
        result
          ?.pagination
          ?.page ||
        requestedPage
      );

      setReviews(
        previous =>
          append
            ? [
                ...previous,
                ...(
                  result
                    ?.reviews ||
                  []
                ),
              ]
            : (
                result
                  ?.reviews ||
                []
              )
      );
    }
    catch (
      err
    ) {
      setError(
        err?.message ||
        'Unable to load student reviews.'
      );
    }
    finally {
      setLoading(
        false
      );
    }
  }


  async function toggle() {
    const next =
      !open;

    setOpen(
      next
    );

    if (
      next &&
      !data &&
      !loading
    ) {
      await load(
        1,
        false
      );
    }
  }


  const standard =
    data?.standard ||
    null;

  const analysis =
    data?.analysis ||
    null;

  const aspects =
    analysis?.aspects ||
    {};


  return (
    <section
      style={{
        marginTop:
          18,

        border:
          '1px solid #CBD5E1',

        borderRadius:
          16,

        overflow:
          'hidden',

        background:
          '#F8FAFC',
      }}
    >
      <button
        type="button"
        onClick={
          toggle
        }
        style={{
          width:
            '100%',

          border:
            0,

          background:
            'transparent',

          padding:
            '14px 16px',

          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'space-between',

          cursor:
            'pointer',

          textAlign:
            'left',
        }}
      >
        <div>
          <strong
            style={{
              display:
                'block',

              color:
                '#0F2454',

              fontSize:
                14,
            }}
          >
            Student Reviews & Analysis
          </strong>

          <span
            style={{
              display:
                'block',

              marginTop:
                3,

              color:
                '#64748B',

              fontSize:
                10.5,
            }}
          >
            TruMarg 100-review evidence standard
          </span>
        </div>

        <strong>
          {open
            ? '−'
            : '+'}
        </strong>
      </button>


      {open && (
        <div
          style={{
            padding:
              '0 16px 16px',
          }}
        >
          {loading &&
            !data && (
            <p>
              Loading student reviews...
            </p>
          )}


          {error && (
            <div
              style={{
                padding:
                  12,

                borderRadius:
                  10,

                background:
                  '#FFF7ED',

                color:
                  '#9A3412',

                fontSize:
                  11,
              }}
            >
              {error}
            </div>
          )}


          {data && (
            <>
              <div
                style={{
                  padding:
                    13,

                  borderRadius:
                    12,

                  background:
                    standard
                      ?.standardMet
                      ? '#ECFDF5'
                      : '#FFF7ED',

                  marginBottom:
                    12,
                }}
              >
                <strong
                  style={{
                    color:
                      '#0F172A',
                  }}
                >
                  {standard
                    ?.usableReviews ??
                    0}
                  {' / 100 '}
                  unique usable reviews
                </strong>

                <div
                  style={{
                    marginTop:
                      5,

                    fontSize:
                      10.5,

                    color:
                      '#475569',
                  }}
                >
                  {
                    standard
                      ?.independentSources ??
                    0
                  } canonical sources
                  {' · '}

                  Max source share:{' '}

                  {standard
                    ?.maxSourceShare ==
                  null
                    ? 'N/A'
                    : percentText(
                        standard
                          .maxSourceShare *
                        100
                      )}
                </div>

                <div
                  style={{
                    marginTop:
                      7,

                    fontSize:
                      11,

                    fontWeight:
                      700,

                    color:
                      standard
                        ?.standardMet
                        ? '#047857'
                        : '#C2410C',
                  }}
                >
                  {standard
                    ?.standardMet
                    ? '✓ 100-review standard met'
                    : (
                        'Evidence building · need ' +
                        (
                          standard
                            ?.reviewsNeeded ??
                          0
                        ) +
                        ' more usable reviews'
                      )}
                </div>
              </div>


              <div
                style={{
                  display:
                    'grid',

                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(120px,1fr))',

                  gap:
                    8,

                  marginBottom:
                    15,
                }}
              >
                <Metric
                  label="Overall Review Score"
                  value={
                    analysis
                      ?.overallScore !=
                    null
                      ? (
                          analysis
                            .overallScore
                            .toFixed(
                              1
                            ) +
                          ' / 100'
                        )
                      : 'N/A'
                  }
                />

                <Metric
                  label="Positive"
                  value={
                    percentText(
                      analysis
                        ?.positivePercent
                    )
                  }
                />

                <Metric
                  label="Neutral"
                  value={
                    percentText(
                      analysis
                        ?.neutralPercent
                    )
                  }
                />

                <Metric
                  label="Negative"
                  value={
                    percentText(
                      analysis
                        ?.negativePercent
                    )
                  }
                />
              </div>


              {!standard
                ?.standardMet &&
                analysis
                  ?.provisionalScore !=
                  null && (
                <div
                  style={{
                    marginBottom:
                      14,

                    padding:
                      10,

                    borderRadius:
                      10,

                    background:
                      '#FFFBEB',

                    color:
                      '#92400E',

                    fontSize:
                      10.5,
                  }}
                >
                  Provisional sentiment score:{' '}

                  <strong>
                    {
                      analysis
                        .provisionalScore
                        .toFixed(
                          1
                        )
                    }
                    /100
                  </strong>

                  . It is not used as the qualified
                  100-review score yet.
                </div>
              )}


              <div
                style={{
                  marginBottom:
                    16,
                }}
              >
                <strong
                  style={{
                    color:
                      '#0F2454',

                    fontSize:
                      12,
                  }}
                >
                  Aspect Analysis
                </strong>

                <div
                  style={{
                    display:
                      'grid',

                    gap:
                      7,

                    marginTop:
                      8,
                  }}
                >
                  {Object.entries(
                    ASPECT_LABELS
                  ).map(
                    ([
                      key,
                      label,
                    ]) => {
                      const item =
                        aspects[
                          key
                        ] ||
                        {};

                      return (
                        <div
                          key={
                            key
                          }
                          style={{
                            display:
                              'grid',

                            gridTemplateColumns:
                              'minmax(120px,1fr) auto auto',

                            gap:
                              8,

                            alignItems:
                              'center',

                            padding:
                              '9px 10px',

                            background:
                              '#FFFFFF',

                            border:
                              '1px solid #E2E8F0',

                            borderRadius:
                              10,
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                10.5,

                              color:
                                '#334155',
                            }}
                          >
                            {
                              label
                            }
                          </span>

                          <span
                            style={{
                              fontSize:
                                10,

                              color:
                                '#64748B',
                            }}
                          >
                            {
                              item
                                .reviewCount ??
                              0
                            } reviews
                          </span>

                          <strong
                            style={{
                              fontSize:
                                10.5,

                              color:
                                '#0F2454',
                            }}
                          >
                            {
                              item
                                .score ==
                              null
                                ? 'N/A'
                                : (
                                    Number(
                                      item
                                        .score
                                    )
                                      .toFixed(
                                        1
                                      ) +
                                    '/100'
                                  )
                            }
                          </strong>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>


              {Array.isArray(
                analysis
                  ?.strengths
              ) &&
                analysis
                  .strengths
                  .length >
                  0 && (
                <div
                  style={{
                    marginBottom:
                      13,
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        11,

                      color:
                        '#047857',
                    }}
                  >
                    Strengths
                  </strong>

                  <div
                    style={{
                      marginTop:
                        5,

                      fontSize:
                        10.5,

                      lineHeight:
                        1.55,

                      color:
                        '#334155',
                    }}
                  >
                    {analysis
                      .strengths
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                          >
                            ✓ {
                              typeof item ===
                              'string'
                                ? item
                                : (
                                    item
                                      ?.label ||
                                    item
                                      ?.aspect ||
                                    JSON.stringify(
                                      item
                                    )
                                  )
                            }
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}


              {Array.isArray(
                analysis
                  ?.concerns
              ) &&
                analysis
                  .concerns
                  .length >
                  0 && (
                <div
                  style={{
                    marginBottom:
                      16,
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        11,

                      color:
                        '#B45309',
                    }}
                  >
                    Concerns
                  </strong>

                  <div
                    style={{
                      marginTop:
                        5,

                      fontSize:
                        10.5,

                      lineHeight:
                        1.55,

                      color:
                        '#334155',
                    }}
                  >
                    {analysis
                      .concerns
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                          >
                            • {
                              typeof item ===
                              'string'
                                ? item
                                : (
                                    item
                                      ?.label ||
                                    item
                                      ?.aspect ||
                                    JSON.stringify(
                                      item
                                    )
                                  )
                            }
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}


              <div>
                <strong
                  style={{
                    color:
                      '#0F2454',

                    fontSize:
                      12,
                  }}
                >
                  Actual Student Reviews
                </strong>

                <div
                  style={{
                    marginTop:
                      8,

                    display:
                      'grid',

                    gap:
                      10,
                  }}
                >
                  {reviews.map(
                    review => (
                      <article
                        key={
                          review.id
                        }
                        style={{
                          padding:
                            12,

                          background:
                            '#FFFFFF',

                          border:
                            '1px solid #E2E8F0',

                          borderRadius:
                            12,
                        }}
                      >
                        <p
                          style={{
                            margin:
                              0,

                            color:
                              '#334155',

                            fontSize:
                              10.5,

                            lineHeight:
                              1.6,
                          }}
                        >
                          {
                            review
                              .text
                          }
                        </p>

                        <div
                          style={{
                            display:
                              'flex',

                            flexWrap:
                              'wrap',

                            gap:
                              6,

                            marginTop:
                              9,

                            fontSize:
                              9.5,

                            color:
                              '#64748B',
                          }}
                        >
                          <strong>
                            Source:{' '}
                            {
                              review
                                .source ||
                              'Unknown'
                            }
                          </strong>

                          {dateText(
                            review
                              .reviewDate
                          ) && (
                            <span>
                              {
                                dateText(
                                  review
                                    .reviewDate
                                )
                              }
                            </span>
                          )}

                          {Array.isArray(
                            review
                              .aspects
                          ) &&
                            review
                              .aspects
                              .length >
                              0 && (
                              <span>
                                {
                                  review
                                    .aspects
                                    .map(
                                      key =>
                                        ASPECT_LABELS[
                                          key
                                        ] ||
                                        key
                                    )
                                    .join(
                                      ', '
                                    )
                                }
                              </span>
                            )}
                        </div>

                        {review
                          .sourceUrl && (
                          <a
                            href={
                              review
                                .sourceUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display:
                                'inline-block',

                              marginTop:
                                7,

                              fontSize:
                                9.5,
                            }}
                          >
                            View source
                          </a>
                        )}
                      </article>
                    )
                  )}
                </div>


                {reviews.length ===
                  0 &&
                  !loading && (
                    <p
                      style={{
                        color:
                          '#64748B',

                        fontSize:
                          10.5,
                      }}
                    >
                      No usable stored review text is available yet.
                    </p>
                  )}


                {data
                  ?.pagination
                  ?.hasMore && (
                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={
                      () =>
                        load(
                          page +
                            1,
                          true
                        )
                    }
                    style={{
                      marginTop:
                        12,

                      padding:
                        '9px 14px',

                      borderRadius:
                        10,

                      border:
                        '1px solid #CBD5E1',

                      background:
                        '#FFFFFF',

                      cursor:
                        loading
                          ? 'wait'
                          : 'pointer',

                      fontWeight:
                        700,
                    }}
                  >
                    {loading
                      ? 'Loading...'
                      : (
                          'Load More (' +
                          reviews.length +
                          ' of ' +
                          (
                            data
                              ?.pagination
                              ?.total ||
                            0
                          ) +
                          ')'
                        )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
