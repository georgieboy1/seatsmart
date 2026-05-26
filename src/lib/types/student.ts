import type {
  DietaryAccessibility,
  AntisocialTrait,
  ProsocialTrait,
} from "@/lib/students/constants";

export type Student = {
  id: string;
  userId: string;
  classId?: string | null;
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

export type NewStudent = Omit<
  Student,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
