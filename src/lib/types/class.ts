export type Class = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type NewClass = Omit<Class, "id" | "userId" | "createdAt" | "updatedAt">;
