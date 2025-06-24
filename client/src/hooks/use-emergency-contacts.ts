import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface EmergencyContactState {
  showForm: boolean;
  hasAddedContacts: boolean;
  isLoading: boolean;
}

export function useEmergencyContacts(userId: number | null) {
  const [showForm, setShowForm] = useState(false);

  // Check if user has added emergency contacts
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!userId,
  });

  const hasAddedContacts = userData?.hasAddedEmergencyContacts || false;

  // Show form if user hasn't added emergency contacts
  useEffect(() => {
    if (!isLoading && userId && !hasAddedContacts) {
      setShowForm(true);
    }
  }, [userId, hasAddedContacts, isLoading]);

  const handleSuccess = () => {
    setShowForm(false);
    // Optionally refetch user data to update the hasAddedEmergencyContacts flag
    window.location.reload();
  };

  return {
    showForm,
    hasAddedContacts,
    isLoading,
    handleSuccess,
  };
} 