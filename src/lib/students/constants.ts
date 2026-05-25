export const PROSOCIAL_TRAITS = [
  { value: "helpful", label: "Helpful" },
  { value: "focused", label: "Focused" },
  { value: "leader", label: "Leader" },
  { value: "calm", label: "Calm" },
  { value: "encouraging", label: "Encouraging" },
  { value: "responsible", label: "Responsible" },
] as const;

export const ANTISOCIAL_TRAITS = [
  { value: "talkative", label: "Talkative" },
  { value: "distracted", label: "Distracted" },
  { value: "disruptive", label: "Disruptive" },
  { value: "off_task", label: "Off task" },
  { value: "restless", label: "Restless" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export const ACCOMMODATIONS = [
  {
    value: "near_door",
    label: "Near door",
    description: "Easy exit for breaks or anxiety.",
  },
  {
    value: "near_teacher",
    label: "Near teacher",
    description: "Within arm's reach of the teacher's desk.",
  },
  {
    value: "away_from_window",
    label: "Away from window",
    description: "Reduces distraction from outside.",
  },
  {
    value: "near_charging",
    label: "Near charging station",
    description: "For students with medical or assistive devices.",
  },
  {
    value: "front_of_room",
    label: "Front of room",
    description: "For attention or behavior support.",
  },
  {
    value: "hearing_left",
    label: "Hearing — left ear",
    description: "Stronger hearing on the left.",
  },
  {
    value: "hearing_right",
    label: "Hearing — right ear",
    description: "Stronger hearing on the right.",
  },
  {
    value: "vision_front",
    label: "Vision — front seat",
    description: "Trouble seeing the board from the back of the room.",
  },
] as const;

export type ProsocialTrait = (typeof PROSOCIAL_TRAITS)[number]["value"];
export type AntisocialTrait = (typeof ANTISOCIAL_TRAITS)[number]["value"];
export type Accommodation = (typeof ACCOMMODATIONS)[number]["value"];
