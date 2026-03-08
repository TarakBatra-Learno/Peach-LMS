import { format, subDays, addDays } from "date-fns";
import type {
  UnitPlan,
  LessonPlan,
  LessonSlotAssignment,
  LessonActivity,
} from "@/types/unit-planning";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TODAY = new Date(2026, 1, 28); // 2026-02-28
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const now = () => new Date().toISOString();

const pad = (n: number, len = 2) => String(n).padStart(len, "0");
const unitId = (n: number) => `unit_${pad(n)}`;
const lpId = (n: number) => `lp_${pad(n)}`;
const actId = (n: number) => `act_${pad(n)}`;
const lsaId = (n: number) => `lsa_${pad(n)}`;

// ---------------------------------------------------------------------------
// Class & Learning-Goal constants (match main seed)
// ---------------------------------------------------------------------------
const CLS_MYP_SCI = "cls_myp_sci";
const CLS_MYP_HR = "cls_myp_hr";
const CLS_DP_ENG = "cls_dp_eng";

const lgId = (n: number) => `lg_${pad(n)}`;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------
export function generateUnitPlanningData() {
  const createdAt = now();
  const updatedAt = createdAt;

  // =======================================================================
  // UNIT PLANS (6)
  // =======================================================================
  const unitPlans: UnitPlan[] = [
    // ---- 1. Ecosystems & Interdependence  (MYP SCI, active, 4 lessons) ----
    {
      id: unitId(1),
      classId: CLS_MYP_SCI,
      title: "Ecosystems & Interdependence",
      code: "SCI-U1",
      summary:
        "Students explore how living organisms interact within ecosystems, investigating food webs, nutrient cycling, and the impact of human activity on ecological balance.",
      programme: "MYP",
      status: "active",
      startDate: "2026-02-03",
      endDate: "2026-03-06",
      strategy: {
        learningGoals: [
          "Explain the flow of energy and matter through an ecosystem",
          "Analyse the impact of human activity on biodiversity",
          "Design and evaluate an ecological investigation using the scientific method",
          "Interpret data from field observations and lab experiments",
        ],
        linkedStandardIds: [lgId(1), lgId(2)],
        conceptualFraming: {
          keyConcept: "Systems",
          relatedConcepts: ["Balance", "Interaction"],
          globalContext: "Globalization and sustainability",
          statementOfInquiry:
            "Living systems maintain balance through interdependent relationships",
          atlFocus: ["ATL.RES", "ATL.THK"],
        },
        assessmentApproach:
          "Criterion B/C lab reports, formative exit tickets, and a summative investigation on osmosis.",
        differentiationNotes:
          "Sentence starters for EAL learners; extension data-analysis tasks for advanced students.",
        resourceLinks: [
          "https://education.nationalgeographic.org/ecosystems",
          "https://www.khanacademy.org/science/biology/ecology",
        ],
      },
      lessonPlanIds: [lpId(1), lpId(2), lpId(3), lpId(4)],
      order: 1,
      createdAt,
      updatedAt,
    },

    // ---- 2. Forces & Motion  (MYP SCI, draft, 2 lessons) ----
    {
      id: unitId(2),
      classId: CLS_MYP_SCI,
      title: "Forces & Motion",
      code: "SCI-U2",
      summary:
        "An introduction to Newton's laws, balanced and unbalanced forces, and the relationship between force, mass, and acceleration.",
      programme: "MYP",
      status: "draft",
      startDate: "2026-03-09",
      endDate: "2026-04-03",
      strategy: {
        learningGoals: [
          "Describe Newton's three laws of motion with real-world examples",
          "Calculate net force, acceleration, and friction in simple systems",
          "Design a controlled experiment to test a hypothesis about force and motion",
        ],
        linkedStandardIds: [lgId(1)],
        conceptualFraming: {
          keyConcept: "Change",
          relatedConcepts: ["Movement", "Energy"],
          globalContext: "Scientific and technical innovation",
          statementOfInquiry:
            "Understanding the forces that cause change allows us to predict and control motion",
          atlFocus: ["ATL.THK"],
        },
        assessmentApproach:
          "Problem set covering quantitative force calculations and a practical friction investigation.",
        differentiationNotes:
          "Visual force-diagram scaffolds; challenge problems for higher-ability students.",
      },
      lessonPlanIds: [lpId(5), lpId(6)],
      order: 2,
      createdAt,
      updatedAt,
    },

    // ---- 3. Community & Identity  (MYP HR, active, 3 lessons) ----
    {
      id: unitId(3),
      classId: CLS_MYP_HR,
      title: "Community & Identity",
      code: "HR-U1",
      summary:
        "Students examine the relationship between personal identity and community, exploring how cultural background, values, and shared experiences shape who we are.",
      programme: "MYP",
      status: "active",
      startDate: "2026-02-10",
      endDate: "2026-03-13",
      strategy: {
        learningGoals: [
          "Articulate the relationship between personal identity and community membership",
          "Analyse how cultural perspectives influence decision-making",
          "Collaborate effectively in a diverse group to achieve shared goals",
          "Reflect on personal growth through service-learning experiences",
        ],
        linkedStandardIds: [lgId(5), lgId(6), lgId(7)],
        conceptualFraming: {
          keyConcept: "Identity",
          relatedConcepts: ["Community", "Perspective"],
          globalContext: "Identities and relationships",
          statementOfInquiry:
            "Our identities are shaped by the communities we belong to and the perspectives we encounter",
          atlFocus: ["ATL.COM", "ATL.COL"],
        },
        assessmentApproach:
          "Personal project proposal and community-service reflection, assessed via rubric.",
        differentiationNotes:
          "Audio/visual reflection options for students who find extended writing challenging.",
      },
      lessonPlanIds: [lpId(7), lpId(8), lpId(9)],
      order: 1,
      createdAt,
      updatedAt,
    },

    // ---- 4. Creative Writing Portfolio  (MYP HR, completed, 3 lessons) ----
    {
      id: unitId(4),
      classId: CLS_MYP_HR,
      title: "Creative Writing Portfolio",
      code: "HR-U2",
      summary:
        "A creative writing unit in which students draft, revise, and curate original pieces for a personal portfolio, reflecting on their development as writers.",
      programme: "MYP",
      status: "completed",
      startDate: "2026-01-12",
      endDate: "2026-02-06",
      strategy: {
        learningGoals: [
          "Produce original creative writing in multiple genres",
          "Apply revision strategies to improve clarity and voice",
          "Reflect on personal growth as a writer using the Learner Profile",
        ],
        linkedStandardIds: [lgId(5), lgId(14)],
        conceptualFraming: {
          keyConcept: "Creativity",
          relatedConcepts: ["Self-expression", "Communication"],
          globalContext: "Personal and cultural expression",
          statementOfInquiry:
            "Creative expression allows us to communicate who we are and what we value",
          atlFocus: ["ATL.COM"],
        },
        assessmentApproach:
          "Learner Profile self-reflection rubric assessed against portfolio evidence.",
        differentiationNotes:
          "Choice of genre (poem, short story, script); graphic organisers for planning.",
      },
      lessonPlanIds: [lpId(10), lpId(11), lpId(12)],
      order: 2,
      createdAt,
      updatedAt,
    },

    // ---- 5. Comparative Literary Analysis  (DP ENG, active, 4 lessons) ----
    {
      id: unitId(5),
      classId: CLS_DP_ENG,
      title: "Comparative Literary Analysis",
      code: "ENG-U1",
      summary:
        "Students develop comparative analytical skills by examining themes, narrative techniques, and cultural contexts across two or more literary works from the DP reading list.",
      programme: "DP",
      status: "active",
      startDate: "2026-02-03",
      endDate: "2026-03-13",
      strategy: {
        learningGoals: [
          "Compare and contrast thematic concerns across literary works from different cultures",
          "Analyse how authors use narrative technique to shape meaning",
          "Construct a sustained, evidence-based comparative argument",
          "Deliver an effective oral commentary under timed conditions",
        ],
        linkedStandardIds: [lgId(3), lgId(4)],
        conceptualFraming: {
          tokConnection:
            "How does language shape our understanding of literary truth?",
          casOpportunity:
            "Literary mentoring with younger students",
        },
        assessmentApproach:
          "Paper 1 guided textual analysis and an individual oral commentary on a studied work.",
        differentiationNotes:
          "Annotated model essays provided; scaffolded thesis-statement frames for developing writers.",
        resourceLinks: [
          "https://www.litcharts.com",
          "https://www.jstor.org",
        ],
      },
      lessonPlanIds: [lpId(13), lpId(14), lpId(15), lpId(16)],
      order: 1,
      createdAt,
      updatedAt,
    },

    // ---- 6. World Literature Seminar  (DP ENG, draft, 2 lessons) ----
    {
      id: unitId(6),
      classId: CLS_DP_ENG,
      title: "World Literature Seminar",
      code: "ENG-U2",
      summary:
        "A seminar-style unit exploring world literature across continents, focusing on postcolonial voices, translation, and the concept of a global literary canon.",
      programme: "DP",
      status: "draft",
      startDate: "2026-03-16",
      endDate: "2026-04-10",
      strategy: {
        learningGoals: [
          "Evaluate the concept of a literary canon and its cultural implications",
          "Analyse how translation shapes the reception of world literature",
          "Engage in Socratic discussion on postcolonial themes and perspectives",
        ],
        linkedStandardIds: [lgId(3), lgId(4)],
        conceptualFraming: {
          tokConnection:
            "To what extent does translation alter the knowledge conveyed by a literary text?",
          casOpportunity:
            "Organise a world-literature reading event for the school community",
        },
        assessmentApproach:
          "Seminar participation rubric and a comparative essay outline.",
        differentiationNotes:
          "Pre-reading summaries for complex texts; discussion sentence stems for less confident speakers.",
      },
      lessonPlanIds: [lpId(17), lpId(18)],
      order: 2,
      createdAt,
      updatedAt,
    },
  ];

  // =======================================================================
  // LESSON PLANS (18)
  // =======================================================================

  // --- Helper to build activities ---
  let actCounter = 0;
  const makeActivity = (
    title: string,
    type: LessonActivity["type"],
    durationMinutes: number,
    description?: string,
  ): LessonActivity => {
    actCounter++;
    return {
      id: actId(actCounter),
      title,
      description,
      durationMinutes,
      type,
      order: 0, // will be set below
    };
  };

  const buildActivities = (
    ...items: [string, LessonActivity["type"], number, string?][]
  ): LessonActivity[] =>
    items.map(([t, ty, d, desc], i) => {
      const a = makeActivity(t, ty, d, desc);
      a.order = i + 1;
      return a;
    });

  // Status distribution across 18 lessons:
  //   4 taught, 4 assigned, 5 ready, 4 draft, 1 skipped

  const lessonPlans: LessonPlan[] = [
    // =====================================================================
    // Unit 1 — Ecosystems & Interdependence (CLS_MYP_SCI) — 4 lessons
    // =====================================================================
    {
      id: lpId(1),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      title: "Introduction to Ecosystems",
      objectives: [
        "Define ecosystem, habitat, and niche",
        "Identify biotic and abiotic factors in a local ecosystem",
      ],
      sequence: 1,
      activities: buildActivities(
        ["Ecosystem photo gallery walk", "intro", 10, "Students examine projected images of diverse ecosystems and note observations."],
        ["Key vocabulary direct instruction", "direct_instruction", 20, "Teacher introduces biotic/abiotic, producer/consumer/decomposer."],
        ["Local ecosystem audit", "group_work", 20, "Small groups catalogue biotic and abiotic factors on the school grounds."],
        ["Exit ticket reflection", "reflection", 10, "Students write one new understanding and one question."],
      ),
      teachingNotes: "Bring clipboards for the outdoor audit. Have the vocabulary handout printed.",
      linkedStandardIds: [lgId(1)],
      status: "taught",
      estimatedDurationMinutes: 60,
      teacherReflection:
        "The outdoor audit was very engaging. Several students needed extra scaffolding on the difference between habitat and niche. Next time, include a worked example before sending groups out.",
      createdAt,
      updatedAt,
    },
    {
      id: lpId(2),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      title: "Food Webs & Energy Flow",
      objectives: [
        "Construct a food web from field observation data",
        "Explain how energy flows through trophic levels",
      ],
      sequence: 2,
      activities: buildActivities(
        ["Recap quiz: ecosystem vocabulary", "intro", 8, "Quick-fire recall of key terms from Lesson 1."],
        ["Energy pyramids presentation", "direct_instruction", 15, "Slide deck on trophic levels and the 10 % rule."],
        ["Food web construction challenge", "group_work", 25, "Groups receive organism cards and build a food web on A3 paper."],
        ["Peer review of food webs", "discussion", 12, "Gallery walk: groups critique each other's webs for accuracy."],
      ),
      teachingNotes: "Print organism cards on coloured card stock. Prepare A3 sheets and markers.",
      linkedStandardIds: [lgId(1), lgId(2)],
      status: "taught",
      estimatedDurationMinutes: 60,
      teacherReflection:
        "Groups loved the card activity. Some food webs had inaccurate arrows. Need to reinforce that arrows show energy flow direction, not predation direction.",
      createdAt,
      updatedAt,
    },
    {
      id: lpId(3),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      title: "Human Impact on Biodiversity",
      objectives: [
        "Evaluate at least two ways humans affect biodiversity",
        "Propose a local conservation action plan",
      ],
      sequence: 3,
      activities: buildActivities(
        ["News headline sort", "intro", 10, "Sort headlines into positive and negative human impacts."],
        ["Case study jigsaw", "group_work", 25, "Expert groups study deforestation, overfishing, or pollution, then teach home groups."],
        ["Conservation action plan", "individual", 20, "Each student drafts a one-page action plan for a local issue."],
      ),
      teachingNotes: "Differentiated reading levels for the case study texts.",
      linkedStandardIds: [lgId(1), lgId(2)],
      status: "assigned",
      estimatedDurationMinutes: 55,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(4),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      title: "Ecology Lab: pH & Plant Growth",
      objectives: [
        "Design a controlled experiment investigating the effect of pH on plant growth",
        "Record and present raw data with appropriate units",
      ],
      sequence: 4,
      activities: buildActivities(
        ["Safety briefing & lab setup", "intro", 10, "Review lab safety rules and distribute equipment."],
        ["Guided investigation design", "direct_instruction", 15, "Model how to write an aim, hypothesis, and identify variables."],
        ["Hands-on experiment", "group_work", 30, "Pairs carry out the investigation and collect data."],
        ["Data table reflection", "reflection", 5, "Students note sources of error and suggest improvements."],
      ),
      teachingNotes: "Ensure pH buffer solutions are pre-prepared. Check that all groups have goggles.",
      resourceLinks: ["https://www.rsc.org/education/teachers/resources/practical-chemistry"],
      linkedStandardIds: [lgId(1), lgId(2)],
      status: "ready",
      estimatedDurationMinutes: 60,
      createdAt,
      updatedAt,
    },

    // =====================================================================
    // Unit 2 — Forces & Motion (CLS_MYP_SCI) — 2 lessons
    // =====================================================================
    {
      id: lpId(5),
      unitId: unitId(2),
      classId: CLS_MYP_SCI,
      title: "Newton's First & Second Laws",
      objectives: [
        "State Newton's first and second laws of motion",
        "Calculate acceleration given force and mass",
      ],
      sequence: 1,
      activities: buildActivities(
        ["Tablecloth trick demonstration", "intro", 8, "Teacher demonstrates inertia with plates on a cloth."],
        ["Laws of motion lecture", "direct_instruction", 20, "Cover F=ma with worked examples."],
        ["Practice problems", "individual", 20, "Worksheet of graded difficulty problems on net force and acceleration."],
        ["Think-pair-share review", "discussion", 12, "Students compare answers and resolve discrepancies."],
      ),
      linkedStandardIds: [lgId(1)],
      status: "draft",
      estimatedDurationMinutes: 60,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(6),
      unitId: unitId(2),
      classId: CLS_MYP_SCI,
      title: "Friction & Newton's Third Law",
      objectives: [
        "Describe friction as a force and its effect on motion",
        "Apply Newton's third law to everyday situations",
      ],
      sequence: 2,
      activities: buildActivities(
        ["Friction video clip", "intro", 5, "Short clip showing friction in sports."],
        ["Friction investigation planning", "group_work", 25, "Groups plan an experiment to measure friction on different surfaces."],
        ["Third-law matching game", "individual", 15, "Match action-reaction force pairs on a worksheet."],
      ),
      linkedStandardIds: [lgId(1)],
      status: "draft",
      estimatedDurationMinutes: 45,
      createdAt,
      updatedAt,
    },

    // =====================================================================
    // Unit 3 — Community & Identity (CLS_MYP_HR) — 3 lessons
    // =====================================================================
    {
      id: lpId(7),
      unitId: unitId(3),
      classId: CLS_MYP_HR,
      title: "Who Am I? Identity Mapping",
      objectives: [
        "Create a personal identity map highlighting cultural, social, and personal dimensions",
        "Share identity narratives respectfully in small groups",
      ],
      sequence: 1,
      activities: buildActivities(
        ["Identity iceberg visual", "intro", 5, "Discuss the iceberg model: visible vs. hidden identity."],
        ["Personal identity map", "individual", 12, "Students create their own identity map on a template."],
        ["Small-group sharing circle", "discussion", 10, "Share one element of your map and why it matters to you."],
      ),
      teachingNotes: "Emphasise that sharing is voluntary. Ensure a safe and respectful environment.",
      linkedStandardIds: [lgId(5), lgId(6)],
      status: "taught",
      estimatedDurationMinutes: 27,
      teacherReflection:
        "Students engaged deeply. Some were hesitant to share, which is expected. The iceberg visual was a powerful entry point. Allow more time for the sharing circle next round.",
      createdAt,
      updatedAt,
    },
    {
      id: lpId(8),
      unitId: unitId(3),
      classId: CLS_MYP_HR,
      title: "Community Service Planning",
      objectives: [
        "Identify a community need and propose a service-learning project",
        "Collaborate with peers to create a project action plan",
      ],
      sequence: 2,
      activities: buildActivities(
        ["Community needs brainstorm", "intro", 5, "Whole-class brainstorm of local community needs."],
        ["Need-solution matching", "group_work", 10, "Groups match identified needs with realistic student actions."],
        ["Project proposal writing", "individual", 10, "Draft a one-paragraph service project proposal."],
        ["Peer feedback round", "discussion", 5, "Exchange proposals and provide constructive feedback."],
      ),
      linkedStandardIds: [lgId(5), lgId(7)],
      status: "assigned",
      estimatedDurationMinutes: 30,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(9),
      unitId: unitId(3),
      classId: CLS_MYP_HR,
      title: "Perspectives & Empathy Workshop",
      objectives: [
        "Analyse a scenario from multiple cultural perspectives",
        "Demonstrate empathy through active listening exercises",
      ],
      sequence: 3,
      activities: buildActivities(
        ["Empathy warm-up: walk-in-their-shoes", "intro", 5, "Read a short scenario and imagine different viewpoints."],
        ["Perspective-taking role play", "group_work", 15, "Groups role-play a scenario from assigned perspectives."],
        ["Debrief discussion", "discussion", 10, "Whole-class discussion on what was learned."],
      ),
      linkedStandardIds: [lgId(5), lgId(6), lgId(7)],
      status: "ready",
      estimatedDurationMinutes: 30,
      createdAt,
      updatedAt,
    },

    // =====================================================================
    // Unit 4 — Creative Writing Portfolio (CLS_MYP_HR) — 3 lessons
    // =====================================================================
    {
      id: lpId(10),
      unitId: unitId(4),
      classId: CLS_MYP_HR,
      title: "Finding Your Voice: Genre Exploration",
      objectives: [
        "Identify features of at least three creative writing genres",
        "Select a genre for the first portfolio piece",
      ],
      sequence: 1,
      activities: buildActivities(
        ["Genre gallery walk", "intro", 5, "Read excerpts from poetry, fiction, and script pinned around the room."],
        ["Genre features chart", "direct_instruction", 10, "Teacher-led comparison of genre conventions."],
        ["Free-write experiment", "individual", 12, "Write a short piece in a genre of your choice."],
        ["Pair share & feedback", "reflection", 3, "Read your piece aloud to a partner and receive one piece of feedback."],
      ),
      teachingNotes: "Print genre excerpts on coloured paper for the gallery walk.",
      linkedStandardIds: [lgId(5)],
      status: "taught",
      estimatedDurationMinutes: 30,
      teacherReflection:
        "Most students chose fiction or poetry. Only two chose script format, so it may need more explicit modelling next time. The free-write produced surprisingly strong first drafts.",
      createdAt,
      updatedAt,
    },
    {
      id: lpId(11),
      unitId: unitId(4),
      classId: CLS_MYP_HR,
      title: "Revision Workshop: Drafting & Editing",
      objectives: [
        "Apply at least two revision strategies to improve a draft",
        "Give and receive constructive peer feedback",
      ],
      sequence: 2,
      activities: buildActivities(
        ["Revision strategy mini-lesson", "direct_instruction", 8, "Teach 'read aloud', 'cut the clutter', and 'show don't tell'."],
        ["Silent revision time", "individual", 12, "Students revise their draft using the strategies."],
        ["Peer editing circles", "group_work", 10, "Groups of three exchange drafts and annotate with feedback."],
      ),
      linkedStandardIds: [lgId(5), lgId(14)],
      status: "skipped",
      estimatedDurationMinutes: 30,
      teachingNotes: "Skipped due to school assembly; students completed revision at home.",
      createdAt,
      updatedAt,
    },
    {
      id: lpId(12),
      unitId: unitId(4),
      classId: CLS_MYP_HR,
      title: "Portfolio Curation & Self-Reflection",
      objectives: [
        "Select pieces for the portfolio with a rationale",
        "Write a Learner Profile self-reflection connecting portfolio evidence to growth",
      ],
      sequence: 3,
      activities: buildActivities(
        ["Portfolio criteria review", "intro", 5, "Revisit the portfolio rubric and quality indicators."],
        ["Piece selection & rationale", "individual", 10, "Choose 2-3 pieces and write a sentence explaining each choice."],
        ["Learner Profile self-reflection", "reflection", 12, "Write a paragraph linking portfolio evidence to Learner Profile attributes."],
        ["Whole-class celebration", "discussion", 3, "Volunteers share a favourite line from their portfolio."],
      ),
      linkedStandardIds: [lgId(5), lgId(14)],
      status: "ready",
      estimatedDurationMinutes: 30,
      createdAt,
      updatedAt,
    },

    // =====================================================================
    // Unit 5 — Comparative Literary Analysis (CLS_DP_ENG) — 4 lessons
    // =====================================================================
    {
      id: lpId(13),
      unitId: unitId(5),
      classId: CLS_DP_ENG,
      title: "Close Reading: Unseen Prose",
      objectives: [
        "Annotate an unseen prose passage for literary technique",
        "Write a thesis statement that addresses the guiding question",
      ],
      sequence: 1,
      activities: buildActivities(
        ["Annotation modelling", "direct_instruction", 20, "Teacher demonstrates close-reading annotation on a projected passage."],
        ["Independent annotation practice", "individual", 35, "Students annotate a new unseen passage."],
        ["Thesis-statement workshop", "group_work", 25, "Pairs craft and refine thesis statements, then share with the class."],
        ["Self-assessment exit slip", "reflection", 10, "Rate your confidence on a scale and note one area for improvement."],
      ),
      teachingNotes: "Use passages from the supplementary reader; avoid works on the reading list.",
      linkedStandardIds: [lgId(3), lgId(4)],
      status: "assigned",
      estimatedDurationMinutes: 90,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(14),
      unitId: unitId(5),
      classId: CLS_DP_ENG,
      title: "Narrative Technique Across Texts",
      objectives: [
        "Identify at least three narrative techniques used across two studied works",
        "Analyse how these techniques create different effects",
      ],
      sequence: 2,
      activities: buildActivities(
        ["Technique card sort", "intro", 15, "Sort technique cards (irony, foreshadowing, unreliable narrator, etc.) into categories."],
        ["Comparative passage analysis", "group_work", 35, "Groups compare extracts from two novels, identifying shared/divergent techniques."],
        ["Mini-presentation", "discussion", 30, "Each group presents findings; class takes notes."],
        ["Individual comparison paragraph", "individual", 10, "Draft one comparative paragraph using the PEE structure."],
      ),
      linkedStandardIds: [lgId(3), lgId(4)],
      status: "assigned",
      estimatedDurationMinutes: 90,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(15),
      unitId: unitId(5),
      classId: CLS_DP_ENG,
      title: "Oral Commentary Preparation",
      objectives: [
        "Plan a structured oral commentary with introduction, body, and conclusion",
        "Practise delivering commentary within the 15-minute time limit",
      ],
      sequence: 3,
      activities: buildActivities(
        ["Model commentary playback", "direct_instruction", 15, "Listen to an exemplar oral commentary and note structural features."],
        ["Commentary planning sheet", "individual", 30, "Complete the planning template for your chosen passage."],
        ["Timed practice in pairs", "group_work", 35, "Pairs take turns delivering and timing each other; provide peer feedback."],
        ["Feedback consolidation", "reflection", 10, "Record three pieces of feedback and set a target for improvement."],
      ),
      linkedStandardIds: [lgId(3)],
      status: "ready",
      estimatedDurationMinutes: 90,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(16),
      unitId: unitId(5),
      classId: CLS_DP_ENG,
      title: "Comparative Essay: Drafting & Review",
      objectives: [
        "Draft a comparative essay introduction and two body paragraphs",
        "Apply the assessment criteria to self-evaluate the draft",
      ],
      sequence: 4,
      activities: buildActivities(
        ["Criteria unpacking", "intro", 10, "Review the DP assessment criteria for Paper 2 essays."],
        ["Guided drafting session", "individual", 50, "Write the introduction and two body paragraphs of the comparative essay."],
        ["Self-assessment against criteria", "assessment", 20, "Use the rubric to highlight strengths and areas for improvement in your draft."],
        ["Peer review swap", "group_work", 10, "Exchange drafts with a partner; annotate with suggestions."],
      ),
      linkedStandardIds: [lgId(3), lgId(4)],
      status: "ready",
      estimatedDurationMinutes: 90,
      createdAt,
      updatedAt,
    },

    // =====================================================================
    // Unit 6 — World Literature Seminar (CLS_DP_ENG) — 2 lessons
    // =====================================================================
    {
      id: lpId(17),
      unitId: unitId(6),
      classId: CLS_DP_ENG,
      title: "What Is the Literary Canon?",
      objectives: [
        "Define 'literary canon' and discuss its historical formation",
        "Evaluate whose voices are included and excluded from the canon",
      ],
      sequence: 1,
      activities: buildActivities(
        ["Canon brainstorm", "intro", 10, "List authors you consider 'essential' — then examine the patterns."],
        ["Mini-lecture on canon formation", "direct_instruction", 25, "Historical overview of how canons are formed and challenged."],
        ["Debate: should there be a canon?", "discussion", 40, "Structured debate in two teams with prepared arguments."],
        ["Reflection journal", "reflection", 15, "Write a personal response: how do you feel about the canon debate?"],
      ),
      linkedStandardIds: [lgId(3), lgId(4)],
      status: "draft",
      estimatedDurationMinutes: 90,
      createdAt,
      updatedAt,
    },
    {
      id: lpId(18),
      unitId: unitId(6),
      classId: CLS_DP_ENG,
      title: "Translation & Meaning in World Literature",
      objectives: [
        "Analyse how translation choices affect meaning and tone",
        "Compare two translations of the same passage",
      ],
      sequence: 2,
      activities: buildActivities(
        ["Translation comparison warm-up", "intro", 10, "Read two translations of the same poem side by side."],
        ["Close analysis of translation differences", "individual", 30, "Annotate specific word choices that alter meaning between versions."],
        ["Socratic seminar: does translation betray the original?", "discussion", 40, "Open discussion using the Socratic method with prepared questions."],
        ["Exit reflection", "reflection", 10, "One sentence: what surprised you about translation today?"],
      ),
      linkedStandardIds: [lgId(3), lgId(4)],
      status: "draft",
      estimatedDurationMinutes: 90,
      createdAt,
      updatedAt,
    },
  ];

  // =======================================================================
  // LESSON SLOT ASSIGNMENTS (~8 total)
  // Assign "taught" and "assigned" lessons to actual timetable slots.
  // =======================================================================

  // Class schedules for reference:
  //   CLS_MYP_SCI: Mon 09:00, Tue 11:00, Thu 09:00
  //   CLS_MYP_HR:  Mon 08:00, Wed 08:00, Fri 08:00
  //   CLS_DP_ENG:  Mon 10:15, Wed 10:15, Fri 10:15

  const lessonSlotAssignments: LessonSlotAssignment[] = [
    // LP 1 (taught) — Unit 1, MYP SCI — Mon Feb 9 09:00
    {
      id: lsaId(1),
      lessonPlanId: lpId(1),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      date: "2026-02-09",
      slotDay: "mon",
      slotStartTime: "09:00",
      createdAt,
    },
    // LP 2 (taught) — Unit 1, MYP SCI — Tue Feb 10 11:00
    {
      id: lsaId(2),
      lessonPlanId: lpId(2),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      date: "2026-02-10",
      slotDay: "tue",
      slotStartTime: "11:00",
      createdAt,
    },
    // LP 3 (assigned) — Unit 1, MYP SCI — Thu Mar 5 09:00
    {
      id: lsaId(3),
      lessonPlanId: lpId(3),
      unitId: unitId(1),
      classId: CLS_MYP_SCI,
      date: "2026-03-05",
      slotDay: "thu",
      slotStartTime: "09:00",
      createdAt,
    },
    // LP 7 (taught) — Unit 3, MYP HR — Wed Feb 11 08:00
    {
      id: lsaId(4),
      lessonPlanId: lpId(7),
      unitId: unitId(3),
      classId: CLS_MYP_HR,
      date: "2026-02-11",
      slotDay: "wed",
      slotStartTime: "08:00",
      createdAt,
    },
    // LP 8 (assigned) — Unit 3, MYP HR — Fri Mar 6 08:00
    {
      id: lsaId(5),
      lessonPlanId: lpId(8),
      unitId: unitId(3),
      classId: CLS_MYP_HR,
      date: "2026-03-06",
      slotDay: "fri",
      slotStartTime: "08:00",
      createdAt,
    },
    // LP 10 (taught) — Unit 4, MYP HR — Mon Jan 12 08:00
    {
      id: lsaId(6),
      lessonPlanId: lpId(10),
      unitId: unitId(4),
      classId: CLS_MYP_HR,
      date: "2026-01-12",
      slotDay: "mon",
      slotStartTime: "08:00",
      createdAt,
    },
    // LP 13 (assigned) — Unit 5, DP ENG — Wed Mar 4 10:15
    {
      id: lsaId(7),
      lessonPlanId: lpId(13),
      unitId: unitId(5),
      classId: CLS_DP_ENG,
      date: "2026-03-04",
      slotDay: "wed",
      slotStartTime: "10:15",
      createdAt,
    },
    // LP 14 (assigned) — Unit 5, DP ENG — Fri Mar 6 10:15
    {
      id: lsaId(8),
      lessonPlanId: lpId(14),
      unitId: unitId(5),
      classId: CLS_DP_ENG,
      date: "2026-03-06",
      slotDay: "fri",
      slotStartTime: "10:15",
      createdAt,
    },
  ];

  // =======================================================================
  // ASSESSMENT-UNIT LINKS
  // =======================================================================
  const assessmentUnitLinks: { assessmentId: string; unitId: string }[] = [
    // Unit 1 — Ecosystems & Interdependence
    { assessmentId: "asmt_11", unitId: unitId(1) }, // Ecology Lab Report
    { assessmentId: "asmt_13", unitId: unitId(1) }, // Scientific Investigation: Osmosis

    // Unit 2 — Forces & Motion
    { assessmentId: "asmt_14", unitId: unitId(2) }, // Physics Problem Set

    // Unit 3 — Community & Identity
    { assessmentId: "asmt_01", unitId: unitId(3) }, // Personal Project Proposal
    { assessmentId: "asmt_02", unitId: unitId(3) }, // Community Service Reflection

    // Unit 4 — Creative Writing Portfolio
    { assessmentId: "asmt_04", unitId: unitId(4) }, // Learner Profile Self-Reflection

    // Unit 5 — Comparative Literary Analysis
    { assessmentId: "asmt_22", unitId: unitId(5) }, // Paper 1: Guided Textual Analysis
    { assessmentId: "asmt_23", unitId: unitId(5) }, // Individual Oral Commentary
  ];

  return { unitPlans, lessonPlans, lessonSlotAssignments, assessmentUnitLinks };
}
