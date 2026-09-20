import {
  isExamEnabled,
  filterEnabledExams,
} from "./src/config/enabledExams.js";


const tests = [
  "jee-main",
  "jee-advanced",
  "uptac",
  "neet",
  "bitsat",
  "wbjee",
  "mht-cet",
];


console.log(
  "\nTRUMARG EXAM AVAILABILITY\n"
);


for (
  const id of tests
) {
  console.log(
    id.padEnd(20),
    isExamEnabled(id)
      ? "ON"
      : "OFF"
  );
}


console.log(
  "\nFILTER TEST\n"
);


const rows = [
  {
    id: "jee-main",
    name: "JEE Main",
  },

  {
    id: "jee-advanced",
    name: "JEE Advanced",
  },

  {
    id: "uptac",
    name: "UPTAC",
  },

  {
    id: "neet",
    name: "NEET",
  },

  {
    id: "wbjee",
    name: "WBJEE",
  },
];


console.log(
  filterEnabledExams(rows)
);
