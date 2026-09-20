import fs from "node:fs";

const file =
  "./src/components/CollegeCard.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const oldBlock =
`<div className="admission-history-title">
                        Historical Admission Intelligence
                      </div>`;

const newBlock =
`<div className="admission-history-title">
                        Historical Admission Intelligence
                      </div>


                      {/* =====================================================
                          ELIGIBILITY PROFILE USED
                      ===================================================== */}

                      <div className="admission-profile-context">

                        <div className="admission-profile-context__title">
                          Admission Profile Used
                        </div>


                        <div className="admission-profile-context__grid">

                          <div className="admission-profile-context__item">
                            <span>
                              Category
                            </span>

                            <strong>
                              {
                                branch?.category ||
                                profile?.category ||
                                '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item">
                            <span>
                              Gender
                            </span>

                            <strong>
                              {
                                profile?.gender ||
                                '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item">
                            <span>
                              Home State
                            </span>

                            <strong>
                              {
                                profile?.homeState ||
                                '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item">
                            <span>
                              Applicable Quota
                            </span>

                            <strong>
                              {
                                branch?.quota === 'HS'
                                  ? 'Home State'
                                  : branch?.quota === 'OS'
                                    ? 'Other State'
                                    : branch?.quota === 'AI'
                                      ? 'All India'
                                      : branch?.quota ||
                                        '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item admission-profile-context__item--wide">
                            <span>
                              Eligible Seat Pool
                            </span>

                            <strong>
                              {
                                branch?.gender ===
                                  'Female-only (including Supernumerary)'
                                  ? 'Female-only'
                                  : branch?.gender ===
                                      'Gender-Neutral'
                                    ? 'Gender-Neutral'
                                    : branch?.gender ||
                                      '—'
                              }
                            </strong>
                          </div>

                        </div>


                        <div className="admission-profile-context__note">
                          Historical cutoff comparison uses
                          this category, applicable quota and
                          eligible seat pool.
                        </div>

                      </div>`;

if (
  source.includes(
    "admission-profile-context__title"
  )
) {
  console.log(
    "Admission profile UI already installed."
  );

  process.exit(0);
}

if (
  !source.includes(
    oldBlock
  )
) {
  throw new Error(
    "Historical Admission Intelligence title block not found."
  );
}

source =
  source.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Admission Intelligence profile context added."
);
