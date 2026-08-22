import { pool } from "./src/db/pool.js";

const FIXES = {
  /*
  ========================================================
  IITs
  ========================================================
  */

  "indian-institute-of-technology-bhubaneswar": [
    "Bhubaneswar",
    "Odisha",
    "IIT"
  ],

  "indian-institute-of-technology-bombay": [
    "Mumbai",
    "Maharashtra",
    "IIT"
  ],

  "indian-institute-of-technology-delhi": [
    "New Delhi",
    "Delhi",
    "IIT"
  ],

  "indian-institute-of-technology-dharwad": [
    "Dharwad",
    "Karnataka",
    "IIT"
  ],

  "indian-institute-of-technology-goa": [
    "Ponda",
    "Goa",
    "IIT"
  ],

  "indian-institute-of-technology-gandhinagar": [
    "Gandhinagar",
    "Gujarat",
    "IIT"
  ],

  "indian-institute-of-technology-guwahati": [
    "Guwahati",
    "Assam",
    "IIT"
  ],

  "indian-institute-of-technology-hyderabad": [
    "Hyderabad",
    "Telangana",
    "IIT"
  ],

  "indian-institute-of-technology-indore": [
    "Indore",
    "Madhya Pradesh",
    "IIT"
  ],

  "indian-institute-of-technology-jammu": [
    "Jammu",
    "Jammu and Kashmir",
    "IIT"
  ],

  "indian-institute-of-technology-jodhpur": [
    "Jodhpur",
    "Rajasthan",
    "IIT"
  ],

  "indian-institute-of-technology-kanpur": [
    "Kanpur",
    "Uttar Pradesh",
    "IIT"
  ],

  "indian-institute-of-technology-kharagpur": [
    "Kharagpur",
    "West Bengal",
    "IIT"
  ],

  "indian-institute-of-technology-madras": [
    "Chennai",
    "Tamil Nadu",
    "IIT"
  ],

  "indian-institute-of-technology-mandi": [
    "Mandi",
    "Himachal Pradesh",
    "IIT"
  ],

  "indian-institute-of-technology-palakkad": [
    "Palakkad",
    "Kerala",
    "IIT"
  ],

  "indian-institute-of-technology-patna": [
    "Patna",
    "Bihar",
    "IIT"
  ],

  "indian-institute-of-technology-roorkee": [
    "Roorkee",
    "Uttarakhand",
    "IIT"
  ],

  "indian-institute-of-technology-ropar": [
    "Rupnagar",
    "Punjab",
    "IIT"
  ],

  "indian-institute-of-technology-tirupati": [
    "Tirupati",
    "Andhra Pradesh",
    "IIT"
  ],

  /*
  ========================================================
  IISc
  ========================================================
  */

  "indian-institute-of-science-bangalore": [
    "Bengaluru",
    "Karnataka",
    "IISc"
  ],


  /*
  ========================================================
  NITs
  ========================================================
  */

  "national-institute-of-technology-agartala": [
    "Agartala",
    "Tripura",
    "NIT"
  ],

  "national-institute-of-technology-arunachal-pradesh": [
    "Yupia",
    "Arunachal Pradesh",
    "NIT"
  ],

  "national-institute-of-technology-calicut": [
    "Kozhikode",
    "Kerala",
    "NIT"
  ],

  "national-institute-of-technology-delhi": [
    "New Delhi",
    "Delhi",
    "NIT"
  ],

  "national-institute-of-technology-durgapur": [
    "Durgapur",
    "West Bengal",
    "NIT"
  ],

  "national-institute-of-technology-goa": [
    "Ponda",
    "Goa",
    "NIT"
  ],

  "national-institute-of-technology-hamirpur": [
    "Hamirpur",
    "Himachal Pradesh",
    "NIT"
  ],

  "national-institute-of-technology-karnataka-surathkal": [
    "Surathkal",
    "Karnataka",
    "NIT"
  ],

  "national-institute-of-technology-meghalaya": [
    "Shillong",
    "Meghalaya",
    "NIT"
  ],

  "national-institute-of-technology-nagaland": [
    "Dimapur",
    "Nagaland",
    "NIT"
  ],

  "national-institute-of-technology-patna": [
    "Patna",
    "Bihar",
    "NIT"
  ],

  "national-institute-of-technology-puducherry": [
    "Karaikal",
    "Puducherry",
    "NIT"
  ],

  "national-institute-of-technology-raipur": [
    "Raipur",
    "Chhattisgarh",
    "NIT"
  ],

  "national-institute-of-technology-sikkim": [
    "Ravangla",
    "Sikkim",
    "NIT"
  ],

  "national-institute-of-technology-andhra-pradesh": [
    "Tadepalligudem",
    "Andhra Pradesh",
    "NIT"
  ],

  "national-institute-of-technology-jamshedpur": [
    "Jamshedpur",
    "Jharkhand",
    "NIT"
  ],

  "national-institute-of-technology-kurukshetra": [
    "Kurukshetra",
    "Haryana",
    "NIT"
  ],

  "national-institute-of-technology-manipur": [
    "Imphal",
    "Manipur",
    "NIT"
  ],

  "national-institute-of-technology-mizoram": [
    "Aizawl",
    "Mizoram",
    "NIT"
  ],

  "national-institute-of-technology-rourkela": [
    "Rourkela",
    "Odisha",
    "NIT"
  ],

  "national-institute-of-technology-silchar": [
    "Silchar",
    "Assam",
    "NIT"
  ],

  "national-institute-of-technology-srinagar": [
    "Srinagar",
    "Jammu and Kashmir",
    "NIT"
  ],

  "national-institute-of-technology-tiruchirappalli": [
    "Tiruchirappalli",
    "Tamil Nadu",
    "NIT"
  ],

  "national-institute-of-technology-uttarakhand": [
    "Srinagar (Garhwal)",
    "Uttarakhand",
    "NIT"
  ],

  "national-institute-of-technology-warangal": [
    "Warangal",
    "Telangana",
    "NIT"
  ],

  /*
  ========================================================
  Major IIITs
  ========================================================
  */

  "indian-institute-of-information-technology-agartala": [
    "Agartala",
    "Tripura",
    "IIIT"
  ],

  "indian-institute-of-information-technology-allahabad": [
    "Prayagraj",
    "Uttar Pradesh",
    "IIIT"
  ],

  "indian-institute-of-information-technology-bhagalpur": [
    "Bhagalpur",
    "Bihar",
    "IIIT"
  ],

  "indian-institute-of-information-technology-bhopal": [
    "Bhopal",
    "Madhya Pradesh",
    "IIIT"
  ],

  "indian-institute-of-information-technology-dharwad": [
    "Dharwad",
    "Karnataka",
    "IIIT"
  ],

  "indian-institute-of-information-technology-guwahati": [
    "Guwahati",
    "Assam",
    "IIIT"
  ],

  "indian-institute-of-information-technology-kalyani-west-bengal": [
    "Kalyani",
    "West Bengal",
    "IIIT"
  ],

  "indian-institute-of-information-technology-kilohrad-sonepat-haryana": [
    "Sonepat",
    "Haryana",
    "IIIT"
  ],

  "indian-institute-of-information-technology-kottayam": [
    "Kottayam",
    "Kerala",
    "IIIT"
  ],

  "indian-institute-of-information-technology-lucknow": [
    "Lucknow",
    "Uttar Pradesh",
    "IIIT"
  ],

  "indian-institute-of-information-technology-nagpur": [
    "Nagpur",
    "Maharashtra",
    "IIIT"
  ],

  "indian-institute-of-information-technology-pune": [
    "Pune",
    "Maharashtra",
    "IIIT"
  ],

  "indian-institute-of-information-technology-raichur-karnataka": [
    "Raichur",
    "Karnataka",
    "IIIT"
  ],

  "indian-institute-of-information-technology-ranchi": [
    "Ranchi",
    "Jharkhand",
    "IIIT"
  ],

  "indian-institute-of-information-technology-senapati-manipur": [
    "Senapati",
    "Manipur",
    "IIIT"
  ],

  "indian-institute-of-information-technology-sri-city-chittoor": [
    "Sri City",
    "Andhra Pradesh",
    "IIIT"
  ],

  "indian-institute-of-information-technology-surat": [
    "Surat",
    "Gujarat",
    "IIIT"
  ],

  "indian-institute-of-information-technology-tiruchirappalli": [
    "Tiruchirappalli",
    "Tamil Nadu",
    "IIIT"
  ],

  "indian-institute-of-information-technology-una-himachal-pradesh": [
    "Una",
    "Himachal Pradesh",
    "IIIT"
  ],

  "indian-institute-of-information-technology-vadodara-gujrat": [
    "Vadodara",
    "Gujarat",
    "IIIT"
  ],

  "indian-institute-of-information-technology-vadodara-international-campus-diu": [
    "Diu",
    "Daman and Diu",
    "IIIT"
  ]
};


async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let updated = 0;

    for (const [id, values] of Object.entries(FIXES)) {
      const [city, state, type] = values;

      const result = await client.query(
        `
        UPDATE colleges
        SET
          city = $1,
          state = $2,
          type = $3,
          updated_at = NOW()
        WHERE id = $4
        `,
        [
          city,
          state,
          type,
          id
        ]
      );

      if (result.rowCount > 0) {
        updated++;
        console.log(
          `FIXED: ${id} -> ${city}, ${state}, ${type}`
        );
      } else {
        console.log(
          `NOT FOUND: ${id}`
        );
      }
    }

    await client.query("COMMIT");

    console.log("");
    console.log("========================================");
    console.log("METADATA REPAIR COMPLETE");
    console.log("========================================");
    console.log("Updated:", updated);

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("");
    console.error("METADATA REPAIR FAILED");
    console.error(error.stack || error.message);

    process.exitCode = 1;

  } finally {
    client.release();
    await pool.end();
  }
}

main();
