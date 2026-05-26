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

export const DIETARY_ACCESSIBILITY = [
  { value: "near_door", label: "Near Door" },
  { value: "near_teacher", label: "Near Teacher" },
  { value: "near_charging", label: "Near Power" },
  { value: "away_from_window", label: "Away from Window" },
  { value: "front_of_room", label: "Front of Room" },
  { value: "vision_front", label: "Vision Support" },
  { value: "hearing_left", label: "Hearing Left" },
  { value: "hearing_right", label: "Hearing Right" },
] as const;

export type ProsocialTrait = (typeof PROSOCIAL_TRAITS)[number]["value"];
export type AntisocialTrait = (typeof ANTISOCIAL_TRAITS)[number]["value"];
export type DietaryAccessibility = (typeof DIETARY_ACCESSIBILITY)[number]["value"];
