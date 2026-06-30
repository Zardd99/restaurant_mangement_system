"use client";

import React, { useEffect, useState } from "react";
import { Cake, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * BirthdayOnboardingModal
 *
 * A skippable prompt shown to authenticated users who have not yet recorded a
 * birthdate. Saving persists the date (and privacy preference) to the backend;
 * skipping records a per-user dismissal in localStorage so the prompt does not
 * nag on every page load. Mounted once globally inside the provider tree.
 */

const dismissKey = (userId: string) => `rms_birthday_prompt_dismissed_${userId}`;

const BirthdayOnboardingModal: React.FC = () => {
  const { user, isLoading, axiosInstance, updateUser } = useAuth();

  const [open, setOpen] = useState(false);
  const [birthdate, setBirthdate] = useState("");
  const [shareBirthday, setShareBirthday] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (isLoading || !user) {
      setOpen(false);
      return;
    }

    const alreadyHasBirthdate = Boolean(user.birthdate);
    const dismissed =
      typeof window !== "undefined" &&
      localStorage.getItem(dismissKey(user._id)) === "true";

    setOpen(!alreadyHasBirthdate && !dismissed);
  }, [user, isLoading]);

  if (!open || !user) return null;

  const handleSkip = () => {
    localStorage.setItem(dismissKey(user._id), "true");
    setOpen(false);
  };

  const handleSave = async () => {
    if (!birthdate) {
      setError("Please pick a date, or choose Skip for now.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await axiosInstance.put("/api/auth/update", {
        birthdate,
        showBirthdayToOthers: shareBirthday,
      });
      if (response.data?.user) {
        updateUser(response.data.user);
      } else {
        updateUser({ birthdate, showBirthdayToOthers: shareBirthday });
      }
      setOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not save your birthdate. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <button
          onClick={handleSkip}
          aria-label="Skip"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Cake className="h-6 w-6 text-indigo-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            When&apos;s your birthday?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add your birthdate so the team can celebrate with you. This is
            optional — you can add or change it anytime from your profile.
          </p>

          <div className="mt-6">
            <label
              htmlFor="onboarding-birthdate"
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Birthdate
            </label>
            <input
              id="onboarding-birthdate"
              type="date"
              max={today}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="mt-4 flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={shareBirthday}
              onChange={(e) => setShareBirthday(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Allow the system to notify others of my birthday
          </label>

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleSkip}
              className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthdayOnboardingModal;
