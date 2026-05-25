export type Cohort = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type NewCohort = Omit<Cohort, "id" | "userId" | "createdAt" | "updatedAt">;
