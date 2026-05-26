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
  // Education
  { value: "near_door", label: "Near Door" },
  { value: "near_teacher", label: "Near Teacher" },
  { value: "near_charging", label: "Near Power" },
  { value: "away_from_window", label: "Away from Window" },
  { value: "front_of_room", label: "Front of Room" },
  { value: "vision_front", label: "Vision Support" },
  { value: "hearing_left", label: "Hearing Left" },
  { value: "hearing_right", label: "Hearing Right" },
  // Events
  {
    value: "vegan",
    label: "Vegan",
    description: "No animal products.",
  },
  {
    value: "vegetarian",
    label: "Vegetarian",
    description: "No meat.",
  },
  {
    value: "gluten-free",
    label: "Gluten-Free",
    description: "No wheat or gluten products.",
  },
  {
    value: "nut-allergy",
    label: "Nut-Free",
    description: "Severe nut allergy.",
  },
  {
    value: "dairy-free",
    label: "Dairy-Free",
    description: "Lactose intolerant or no dairy.",
  },
  {
    value: "wheelchair-access",
    label: "Wheelchair Access",
    description: "Requires easy access and space for a wheelchair.",
  },
  {
    value: "low-hearing",
    label: "Hard of Hearing",
    description: "Needs to be closer to speakers or visual cues.",
  },
  {
    value: "service-animal",
    label: "Service Animal",
    description: "Accompanied by a service animal.",
  },
] as const;

export type ProsocialTrait = (typeof PROSOCIAL_TRAITS)[number]["value"];
export type AntisocialTrait = (typeof ANTISOCIAL_TRAITS)[number]["value"];
export type DietaryAccessibility = (typeof DIETARY_ACCESSIBILITY)[number]["value"];
