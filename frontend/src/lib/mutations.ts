"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, login } from "@/lib/api";

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
