import type {
  AssessmentIntent,
  AssessmentType,
  ChatAssessmentConfig,
  EssayAssessmentConfig,
  OffPlatformAssessmentConfig,
  QuizAssessmentConfig,
} from "@/types/assessment";

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  off_platform: "Off-platform",
  quiz: "Quiz",
  chat: "Chat",
  essay: "Essay",
};

export const ASSESSMENT_INTENT_LABELS: Record<AssessmentIntent, string> = {
  formative: "Formative",
  summative: "Summative",
};

export function getAssessmentTypeLabel(type?: AssessmentType) {
  return type ? ASSESSMENT_TYPE_LABELS[type] : "Off-platform";
}

export function getAssessmentIntentLabel(intent?: AssessmentIntent) {
  return intent ? ASSESSMENT_INTENT_LABELS[intent] : undefined;
}

export function createDefaultOffPlatformConfig(): OffPlatformAssessmentConfig {
  return {
    submissionMode: "digital_submission",
    allowAttachments: true,
    allowTextResponse: true,
  };
}

export function createDefaultQuizConfig(): QuizAssessmentConfig {
  return {
    durationMinutes: 20,
    passingScore: 10,
    questions: [
      {
        id: "quiz_builder_q_01",
        prompt: "Add your first question prompt",
        type: "multiple_choice",
        options: ["Option A", "Option B", "Option C", "Option D"],
      },
    ],
  };
}

export function createDefaultChatConfig(): ChatAssessmentConfig {
  return {
    starterPrompt: "Set the opening prompt for the conversation.",
    minimumTurns: 4,
    successCriteria: [],
  };
}

export function createDefaultEssayConfig(): EssayAssessmentConfig {
  return {
    prompt: "Set the long-form writing prompt for students.",
    recommendedWords: 600,
    scaffoldPrompts: [],
  };
}
