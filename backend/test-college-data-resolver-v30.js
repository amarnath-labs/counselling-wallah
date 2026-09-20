import {
  resolveCollegeData,
} from "./src/services/collegeDataResolver.js";

const ids = [
  "nit-warangal",
  "national-institute-of-technology-karnataka-surathkal"
];

async function main() {
  for (const id of ids) {

    console.log("\n========================================");
    console.log("TEST:", id);
    console.log("========================================");

    const result =
      await resolveCollegeData(id);

    if (!result) {
      console.log("❌ College not found");
      continue;
    }


    console.log("\nIDENTITY");

    console.table([
      result.identity
    ]);


    console.log("\nCOLLEGE");

    console.table([
      {
        id:
          result.college?.id ?? null,

        name:
          result.college?.name ?? null,

        city:
          result.college?.city ?? null,

        state:
          result.college?.state ?? null,

        type:
          result.college?.type ?? null,
      }
    ]);


    console.log("\nFEE");

    console.table([
      {
        feeYear:
          result.fees?.feeYear ?? null,

        tuitionPerSemester:
          result.fees?.tuitionFeePerSemester ?? null,

        academicPerSemester:
          result.fees?.academicFeePerSemester ?? null,

        firstSemester:
          result.fees?.firstSemesterFee ?? null,

        hostelPerSemester:
          result.fees?.hostelFeePerSemester ?? null,

        messPerSemester:
          result.fees?.messFeePerSemester ?? null,

        annualAcademic:
          result.fees?.annualAcademicFee ?? null,

        annualTotal:
          result.fees?.annualTotalFee ?? null,

        courseTotal:
          result.fees?.totalCourseFee ?? null,

        resolvedAnnualFee:
          result.fees?.resolvedAnnualFee ?? null,

        resolvedFrom:
          result.fees?.resolvedAnnualFeeFrom ?? null,

        source:
          result.fees?.sourceKind ?? null,

        verification:
          result.fees?.verificationStatus ?? null,

        confidence:
          result.fees?.confidence ?? null,

        hasFeeData:
          result.fees?.hasFeeData ?? false,
      }
    ]);


    console.log(
      "\nBranches:",
      result.branches?.length ?? 0
    );

    console.log(
      "Cutoffs:",
      result.cutoffs?.length ?? 0
    );


    console.log("\nREVIEWS");

    console.table([
      result.reviews || {}
    ]);


    console.log("\nQUALITY");

    if (result.quality) {

      console.table([
        {
          college_id:
            result.quality.college_id,

          academic_year:
            result.quality.academic_year,

          nirf_score:
            result.quality.nirf_score,

          placement_rate:
            result.quality.placement_rate,

          median_package:
            result.quality.median_package,

          verification_status:
            result.quality.verification_status,
        }
      ]);

    } else {

      console.log(
        "No quality data"
      );
    }
  }
}


main()
  .catch((error) => {

    console.error(
      "\n❌ TEST FAILED"
    );

    console.error(error);

    process.exitCode = 1;
  });
