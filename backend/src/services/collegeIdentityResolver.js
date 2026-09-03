const COLLEGE_ID_ALIASES = Object.freeze({
  "atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior":
    "iiitm-gwalior",

  "iiit-allahabad":
    "indian-institute-of-information-technology-allahabad",

  "iiit-pune":
    "indian-institute-of-information-technology-pune",

  "nit-calicut":
    "national-institute-of-technology-calicut",

  "nit-rourkela":
    "national-institute-of-technology-rourkela",

  "nit-trichy":
    "national-institute-of-technology-tiruchirappalli",

  "nit-warangal":
    "national-institute-of-technology-warangal",

  "nit-surathkal":
    "national-institute-of-technology-karnataka-surathkal",
});


export function resolveCanonicalCollegeId(
  collegeId
) {
  if (
    collegeId === null ||
    collegeId === undefined
  ) {
    return null;
  }

  const normalized =
    String(collegeId).trim();

  if (!normalized) {
    return null;
  }

  return (
    COLLEGE_ID_ALIASES[
      normalized
    ] ||
    normalized
  );
}


export function hasCollegeIdAlias(
  collegeId
) {
  if (
    collegeId === null ||
    collegeId === undefined
  ) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(
    COLLEGE_ID_ALIASES,
    String(collegeId).trim()
  );
}


export function getCollegeIdAliases() {
  return {
    ...COLLEGE_ID_ALIASES,
  };
}


export function getCollegeIdSqlCase(
  columnExpression = "c.id::text"
) {
  const clauses =
    Object.entries(
      COLLEGE_ID_ALIASES
    )
      .map(
        ([alias, canonical]) =>
          `WHEN '${escapeSqlLiteral(
            alias
          )}' THEN '${escapeSqlLiteral(
            canonical
          )}'`
      )
      .join("\n");

  return `
    CASE ${columnExpression}
      ${clauses}
      ELSE ${columnExpression}
    END
  `;
}


function escapeSqlLiteral(
  value
) {
  return String(value)
    .replace(/'/g, "''");
}
