import type {
  DietaryAccessibility,
  AntisocialTrait,
  ProsocialTrait,
} from "@/lib/attendees/constants";

export type Attendee = {
  id: string;
  userId: string;
  cohortId?: string | null;
  name: string;
  externalId?: string | null;
  age?: number | null;
  familyName?: string | null;
  allergies: string[];
  healthFlags: string[];
  prosocialTraits: ProsocialTrait[];
  antisocialTraits: AntisocialTrait[];
  constraints: DietaryAccessibility[];
  togetherIds: string[];
  separateIds: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewAttendee = Omit<
  Attendee,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
