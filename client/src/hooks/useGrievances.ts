// src/hooks/useGrievances.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGrievances,
  getGrievanceById,
  submitGrievance,
  addChatMessage,
  NewGrievanceData,
  ChatMessage,
} from '../lib/grievancesApi';
import { useToast } from './use-toast'; // Assuming this hook exists from your folder structure

// Hook to get the list of all grievances
export const useGetGrievances = () => {
  return useQuery({
    queryKey: ['grievances'], // A unique key for this query
    queryFn: getGrievances,   // The API function to call
  });
};

// Hook to get the details of a single grievance
export const useGetGrievance = (id: string) => {
  return useQuery({
    queryKey: ['grievances', id],      // A unique key including the ID
    queryFn: () => getGrievanceById(id), // The API function to call
    enabled: !!id,                     // Only run this query if an ID is provided
  });
};

// Hook for submitting a new grievance
export const useSubmitGrievance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (newGrievance: NewGrievanceData) => submitGrievance(newGrievance),
    onSuccess: () => {
      // After a successful submission, invalidate the 'grievances' query
      // This will cause the list to automatically refetch and update.
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
      toast({ title: "Success", description: "Your grievance has been submitted." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: 'destructive' });
    },
  });
};

// Hook for adding a message to a grievance chat
export const useAddChatMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { id: string } & ChatMessage) => addChatMessage(data),
    onSuccess: (_, variables) => {
      // After sending a message, refetch the details for that specific grievance
      queryClient.invalidateQueries({ queryKey: ['grievances', variables.id] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to send message.", variant: 'destructive' });
    },
  });
};