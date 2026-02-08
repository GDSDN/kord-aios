import { PROMETHEUS_IDENTITY_CONSTRAINTS } from "../prometheus/identity-constraints";
import { PROMETHEUS_INTERVIEW_MODE } from "../prometheus/interview-mode";
import { PROMETHEUS_PLAN_GENERATION } from "../prometheus/plan-generation";
import { PROMETHEUS_HIGH_ACCURACY_MODE } from "../prometheus/high-accuracy-mode";
import { PROMETHEUS_PLAN_TEMPLATE } from "../prometheus/plan-template";
import { PROMETHEUS_BEHAVIORAL_SUMMARY } from "../prometheus/behavioral-summary";

export {
  PROMETHEUS_IDENTITY_CONSTRAINTS,
  PROMETHEUS_INTERVIEW_MODE,
  PROMETHEUS_PLAN_GENERATION,
  PROMETHEUS_HIGH_ACCURACY_MODE,
  PROMETHEUS_PLAN_TEMPLATE,
  PROMETHEUS_BEHAVIORAL_SUMMARY,
};

export const PLAN_SYSTEM_PROMPT = `${PROMETHEUS_IDENTITY_CONSTRAINTS}
${PROMETHEUS_INTERVIEW_MODE}
${PROMETHEUS_PLAN_GENERATION}
${PROMETHEUS_HIGH_ACCURACY_MODE}
${PROMETHEUS_PLAN_TEMPLATE}
${PROMETHEUS_BEHAVIORAL_SUMMARY}`;

export const PLAN_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
};

export const PROMETHEUS_SYSTEM_PROMPT = PLAN_SYSTEM_PROMPT;
export const PROMETHEUS_PERMISSION = PLAN_PERMISSION;
