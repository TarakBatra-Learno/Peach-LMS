/**
 * MYP Assessment Criteria — standard IB definitions
 * Used for pre-populating criteria and showing level descriptors in grading UI.
 */

export const MYP_DEFAULT_CRITERIA = [
  { criterion: "A" as const, title: "Knowing and understanding", maxLevel: 8 },
  { criterion: "B" as const, title: "Inquiring and designing", maxLevel: 8 },
  { criterion: "C" as const, title: "Processing and evaluating", maxLevel: 8 },
  { criterion: "D" as const, title: "Reflecting on the impacts of science", maxLevel: 8 },
];

/**
 * Abbreviated level-band descriptors for each MYP criterion.
 * Bands: 1-2, 3-4, 5-6, 7-8. Each level within a band shares the same descriptor.
 */
export const MYP_LEVEL_DESCRIPTORS: Record<string, Record<number, string>> = {
  A: {
    1: "Limited knowledge and understanding",
    2: "Limited knowledge and understanding",
    3: "Adequate knowledge; some application to unfamiliar situations",
    4: "Adequate knowledge; some application to unfamiliar situations",
    5: "Substantial knowledge; good application and analysis",
    6: "Substantial knowledge; good application and analysis",
    7: "Excellent knowledge; consistent application and critical analysis",
    8: "Excellent knowledge; consistent application and critical analysis",
  },
  B: {
    1: "Limited ability to formulate and test a hypothesis",
    2: "Limited ability to formulate and test a hypothesis",
    3: "Adequate inquiry; describes a method with some awareness of variables",
    4: "Adequate inquiry; describes a method with some awareness of variables",
    5: "Substantial inquiry; explains a method considering reliability",
    6: "Substantial inquiry; explains a method considering reliability",
    7: "Excellent inquiry; justifies a method ensuring reliability and validity",
    8: "Excellent inquiry; justifies a method ensuring reliability and validity",
  },
  C: {
    1: "Limited ability to collect and present data",
    2: "Limited ability to collect and present data",
    3: "Adequate processing; some interpretation of results",
    4: "Adequate processing; some interpretation of results",
    5: "Substantial processing; good interpretation with valid conclusions",
    6: "Substantial processing; good interpretation with valid conclusions",
    7: "Excellent processing; thorough interpretation with justified conclusions",
    8: "Excellent processing; thorough interpretation with justified conclusions",
  },
  D: {
    1: "Limited ability to describe the ways science is applied",
    2: "Limited ability to describe the ways science is applied",
    3: "Adequate reflection; outlines some implications of science",
    4: "Adequate reflection; outlines some implications of science",
    5: "Substantial reflection; discusses implications and evaluates solutions",
    6: "Substantial reflection; discusses implications and evaluates solutions",
    7: "Excellent reflection; critically evaluates implications and ethical issues",
    8: "Excellent reflection; critically evaluates implications and ethical issues",
  },
};
