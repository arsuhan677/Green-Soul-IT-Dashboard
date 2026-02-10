// UUID validation helper
export const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Validate UUID and return error message if invalid
export const validateUUID = (id: string | null | undefined, fieldName?: string): string | null => {
  if (!id) return null; // Optional field
  if (!isValidUUID(id)) {
    return `ভুল আইডি পাঠানো হয়েছে${fieldName ? ` (${fieldName})` : ''}, অনুগ্রহ করে আবার নির্বাচন করুন।`;
  }
  return null;
};

// Validate multiple UUIDs
export const validateUUIDs = (ids: Record<string, string | null | undefined>): string | null => {
  for (const [fieldName, id] of Object.entries(ids)) {
    if (id) {
      const error = validateUUID(id, fieldName);
      if (error) return error;
    }
  }
  return null;
};
