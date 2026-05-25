import type {
  Accommodation,
  AntisocialTrait,
  ProsocialTrait,
} from "@/lib/students/constants";

export type Student = {
  id: string;
  userId: string;
  cohortId?: string | null;
  name: string;
  prosocialTraits: ProsocialTrait[];
  antisocialTraits: AntisocialTrait[];
  accommodations: Accommodation[];
  peerTutors: string[];
  avoid: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewStudent = Omit<
  Student,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
