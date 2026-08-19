"use client";

import { useState, useEffect } from "react";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import WeddingChecklistHeader from "@/components/marketing/wedding-checklist/WeddingChecklistHeader";
import WeddingChecklistSetup from "@/components/marketing/wedding-checklist/WeddingChecklistSetup";
import WeddingChecklistProgress from "@/components/marketing/wedding-checklist/WeddingChecklistProgress";
import WeddingChecklistTimeline from "@/components/marketing/wedding-checklist/WeddingChecklistTimeline";
import WeddingChecklistPrivatePreview from "@/components/marketing/wedding-checklist/WeddingChecklistPrivatePreview";
import WeddingChecklistAdvisoryBridge from "@/components/marketing/wedding-checklist/WeddingChecklistAdvisoryBridge";
import {
  CANONICAL_TASKS,
  PublicChecklistTask,
  WeddingJourney,
  ChecklistPhase,
  ChecklistCategory,
  loadChecklistState,
  saveChecklistState,
  StoredChecklistState,
} from "@/lib/marketing/wedding-checklist-data";

export default function WeddingChecklistPage() {
  const [isClient, setIsClient] = useState(false);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [selectedJourneys, setSelectedJourneys] = useState<WeddingJourney[]>([
    "civil",
    "recepcao",
  ]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<PublicChecklistTask[]>([]);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    setIsClient(true);
    const initial = loadChecklistState();
    setWeddingDate(initial.weddingDate);
    setSelectedJourneys(initial.selectedJourneys || ["civil", "recepcao"]);
    setCompletedTaskIds(initial.completedTaskIds || []);
    setCustomTasks(initial.customTasks || []);
  }, []);

  // Helper to persist state
  const persist = (
    newDate: string | null,
    newJourneys: WeddingJourney[],
    newCompletedIds: string[],
    newCustom: PublicChecklistTask[]
  ) => {
    const updatedState: StoredChecklistState = {
      version: 2,
      weddingDate: newDate,
      selectedJourneys: newJourneys,
      completedTaskIds: newCompletedIds,
      customTasks: newCustom,
      updatedAt: new Date().toISOString(),
    };
    saveChecklistState(updatedState);
  };

  // Toggle completion of task (default or custom)
  const handleToggleTask = (id: string) => {
    const isCustom = customTasks.some((t) => t.id === id);

    if (isCustom) {
      const updatedCustom = customTasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      setCustomTasks(updatedCustom);
      persist(weddingDate, selectedJourneys, completedTaskIds, updatedCustom);
    } else {
      const exists = completedTaskIds.includes(id);
      const updatedCompleted = exists
        ? completedTaskIds.filter((tid) => tid !== id)
        : [...completedTaskIds, id];
      setCompletedTaskIds(updatedCompleted);
      persist(weddingDate, selectedJourneys, updatedCompleted, customTasks);
    }
  };

  // Add custom task
  const handleAddTask = (
    title: string,
    phase: ChecklistPhase,
    category: ChecklistCategory
  ) => {
    const newTask: PublicChecklistTask = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      phase,
      category,
      appliesTo: ["all"],
      completed: false,
      custom: true,
    };
    const updatedCustom = [...customTasks, newTask];
    setCustomTasks(updatedCustom);
    persist(weddingDate, selectedJourneys, completedTaskIds, updatedCustom);
  };

  // Delete custom task
  const handleDeleteCustomTask = (id: string) => {
    const updatedCustom = customTasks.filter((t) => t.id !== id);
    setCustomTasks(updatedCustom);
    persist(weddingDate, selectedJourneys, completedTaskIds, updatedCustom);
  };

  // Change wedding date
  const handleDateChange = (date: string | null) => {
    setWeddingDate(date);
    persist(date, selectedJourneys, completedTaskIds, customTasks);
  };

  // Toggle wedding journey (Civil, Religiosa, Lobolo, Recepção)
  const handleJourneyToggle = (journey: WeddingJourney) => {
    let updated: WeddingJourney[];
    if (selectedJourneys.includes(journey)) {
      // Keep at least one journey selected
      if (selectedJourneys.length <= 1) return;
      updated = selectedJourneys.filter((j) => j !== journey);
    } else {
      updated = [...selectedJourneys, journey];
    }
    setSelectedJourneys(updated);
    persist(weddingDate, updated, completedTaskIds, customTasks);
  };

  // Reset checklist to defaults
  const handleReset = () => {
    setCompletedTaskIds([]);
    setCustomTasks([]);
    persist(weddingDate, selectedJourneys, [], []);
  };

  // Build combined task list with completion status
  const allCurrentTasks: PublicChecklistTask[] = [
    ...CANONICAL_TASKS.map((t) => ({
      ...t,
      completed: completedTaskIds.includes(t.id),
    })),
    ...customTasks,
  ];

  // Filter tasks applicable to selected journeys
  const applicableTasks = allCurrentTasks.filter((t) => {
    return (
      t.appliesTo.includes("all") ||
      t.appliesTo.some((j) => selectedJourneys.includes(j as WeddingJourney))
    );
  });

  const totalCount = applicableTasks.length;
  const completedCount = applicableTasks.filter((t) => t.completed).length;

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">
          Carregando checklist HAXR...
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark">
      <div className="site-container mx-auto px-4 max-w-4xl">
        <MarketingToolBanner title="Checklist" />

        {/* 1. Header */}
        <WeddingChecklistHeader />

        {/* 2. Setup (Date & Journey selection) */}
        <WeddingChecklistSetup
          weddingDate={weddingDate}
          selectedJourneys={selectedJourneys}
          onDateChange={handleDateChange}
          onJourneyToggle={handleJourneyToggle}
          onReset={handleReset}
        />

        {/* 3. Global Progress & Quick Navigation */}
        <WeddingChecklistProgress
          totalCount={totalCount}
          completedCount={completedCount}
        />

        {/* 4. Canonical Timeline (7 Phases) */}
        <WeddingChecklistTimeline
          tasks={allCurrentTasks}
          selectedJourneys={selectedJourneys}
          weddingDate={weddingDate}
          onToggleTask={handleToggleTask}
          onAddTask={handleAddTask}
          onDeleteCustomTask={handleDeleteCustomTask}
        />

        {/* 5. Private Client System Contrast & Preview */}
        <WeddingChecklistPrivatePreview />

        {/* 6. Advisory Bridge */}
        <WeddingChecklistAdvisoryBridge />
      </div>
    </main>
  );
}
